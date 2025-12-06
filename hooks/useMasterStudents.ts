import { useCallback, useEffect, useMemo, useState } from 'react';
import { Student, SCHOOL_YEARS, SCHOOL_COURSES } from '../types';
import {
  listMasterStudents,
  createMasterStudent,
  updateMasterStudent,
  deleteMasterStudent,
  MasterStudentInput,
  MasterStudentRecord,
} from '../services/masterStudentsService';
import { uploadImageToStorage, dataUrlToBlob } from '../services/storageService';
import { syncMasterStudentToProjects } from '../services/syncStudentUpdates';

export interface UseMasterStudentsFilters {
  search: string;
  year: string | null;
  course: string | null;
}

const currentYear = () => new Date().getFullYear();

const computeSchoolYear = (entryYear?: number | null, durationYears?: number | null) => {
  if (!entryYear || entryYear < 1900) return null;
  const dur = durationYears && durationYears > 0 ? durationYears : 3;
  const sy = currentYear() - entryYear + 1;
  if (sy < 1) return 1;
  if (sy > dur) return dur;
  return sy;
};

const computeClassCode = (course: string, entryYear?: number | null, durationYears?: number | null) => {
  if (!entryYear) return null;
  const dur = durationYears && durationYears > 0 ? durationYears : 3;
  const exitYear = entryYear + dur;
  const courseCode = course.replace(/\s+/g, '').toUpperCase().slice(0, 6);
  return `${courseCode}-${entryYear}-${exitYear}`;
};

export function useMasterStudents(
  userId: string | null,
  supabaseEnabled: boolean,
  onStudentUpdated?: (student: MasterStudentRecord) => void
) {
  const [allStudents, setAllStudents] = useState<MasterStudentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UseMasterStudentsFilters>({ search: '', year: null, course: null });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<MasterStudentRecord | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const canUse = supabaseEnabled && !!userId;

  // Load ALL students without filters - runs once on mount
  const loadAll = useCallback(async () => {
    if (!supabaseEnabled) {
      setError('Supabase não configurado');
      return;
    }
    setLoading(true);
    setError(null);
    // Load ALL students without any filters
    const data = await listMasterStudents();
    setAllStudents(data);
    setLoading(false);
    setInitialLoadDone(true);
  }, [supabaseEnabled]);

  // Auto-load on mount
  useEffect(() => {
    if (supabaseEnabled && !initialLoadDone) {
      loadAll();
    }
  }, [supabaseEnabled, initialLoadDone, loadAll]);

  // Filter students locally using useMemo
  const students = useMemo(() => {
    return allStudents.filter((s) => {
      if (filters.year && s.year !== filters.year) return false;
      if (filters.course && s.course !== filters.course) return false;
      if (filters.search && !s.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [allStudents, filters]);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const createOrUpdate = useCallback(
    async (input: MasterStudentInput & { id?: string }) => {
      if (!supabaseEnabled || !userId) {
        setError('Necessário login/Supabase');
        return;
      }
      setError(null);

      // Find existing student to check for old image
      const existingStudent = input.id ? allStudents.find((s) => s.id === input.id) : null;
      const oldImageUrl = existingStudent?.imageUrl;

      let finalImage = input.imageUrl;
      if (input.imageUrl && input.imageUrl.startsWith('data:')) {
        const blob = dataUrlToBlob(input.imageUrl);
        if (blob) {
          const uploaded = await uploadImageToStorage(blob, 'master-students');
          if (uploaded) finalImage = uploaded;
        }
      }

      // Delete old image if we're updating with a new one
      if (input.id && oldImageUrl && finalImage && oldImageUrl !== finalImage && !oldImageUrl.startsWith('data:')) {
        const { deleteImageFromStorage } = await import('../services/storageService');
        await deleteImageFromStorage(oldImageUrl);
      }

      const payload: MasterStudentInput = {
        name: input.name.trim(),
        year: input.year ? (SCHOOL_YEARS.includes(input.year) ? input.year : input.year) : null,
        course: SCHOOL_COURSES.includes(input.course) ? input.course : input.course,
        imageUrl: finalImage || null,
        entryYear: input.entryYear ?? null,
        durationYears: input.durationYears ?? null,
        classCode: input.classCode ?? computeClassCode(input.course, input.entryYear, input.durationYears),
      };

      try {
        if (input.id) {
          const updated = await updateMasterStudent(input.id, payload, userId);
          setAllStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          setEditing(null);

          // Sync changes to all projects that contain this student
          await syncMasterStudentToProjects(input.id, {
            name: payload.name,
            imageUrl: payload.imageUrl,
            year: payload.year ?? undefined,
            course: payload.course,
          });

          // Call local callback to update current project state
          if (onStudentUpdated) {
            onStudentUpdated(updated);
          }

        } else {
          const created = await createMasterStudent(payload, userId);
          setAllStudents((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        }
      } catch (err: any) {
        setError(err?.message || 'Erro ao salvar aluno');
      }
    },
    [supabaseEnabled, userId, allStudents, onStudentUpdated]
  );

  const remove = useCallback(
    async (id: string) => {
      if (!supabaseEnabled || !userId) {
        setError('Necessário login/Supabase');
        return;
      }
      await deleteMasterStudent(id);
      setAllStudents((prev) => prev.filter((s) => s.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [supabaseEnabled, userId]
  );

  const selectedStudents = useMemo(() => allStudents.filter((s) => selectedIds.has(s.id)), [allStudents, selectedIds]);

  const toProjectStudents = useCallback((): Student[] => {
    return selectedStudents.map((s) => ({
      id: s.id,
      name: s.name,
      grade: (() => {
        const sy = computeSchoolYear(s.entryYear, s.durationYears);
        if (sy) return `${sy}º ${s.course || ''}`.trim();
        return `${s.year || ''} ${s.course || ''}`.trim();
      })(),
      year: s.year || undefined,
      course: s.course || undefined,
      imageUrl: s.imageUrl,
    }));
  }, [selectedStudents]);

  return {
    // Return allStudents for ClassStats (to show all classes)
    allStudents,
    // Return filtered students for the list
    students,
    loading,
    error,
    filters,
    setFilters,
    selectedIds,
    toggleSelected,
    clearSelection,
    createOrUpdate,
    remove,
    editing,
    setEditing,
    reload: loadAll,
    selectedStudents,
    toProjectStudents,
    canUse,
  };
}

