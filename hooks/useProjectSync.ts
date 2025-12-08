import { useCallback, useEffect, useRef, useState } from 'react';
import { Student, PageConfig } from '../types';
import {
  loadProject,
  saveProject,
  listProjects,
  createProject,
  deleteProject,
  renameProject,
  ProjectPayload,
  Project
} from '../services/projectService';
import { supabase } from '../services/supabaseClient';

const CURRENT_PROJECT_KEY = 'current-project-id';

export function useProjectSync(userId?: string | null) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supabaseEnabled = !!supabase;

  // Load projects list
  const loadProjects = useCallback(async () => {
    if (!supabase || !userId) return [];
    setIsLoadingProjects(true);
    const list = await listProjects(userId);
    setProjects(list);
    setIsLoadingProjects(false);
    return list;
  }, [userId]);

  // Load on mount
  useEffect(() => {
    if (supabaseEnabled && userId) {
      loadProjects().then((list) => {
        // Restore last selected project from localStorage
        const savedId = localStorage.getItem(CURRENT_PROJECT_KEY);
        if (savedId && list.some((p) => p.id === savedId)) {
          setCurrentProjectId(savedId);
          const proj = list.find((p) => p.id === savedId);
          if (proj) setCurrentProjectName(proj.name);
        }
      });
    }
  }, [supabaseEnabled, userId, loadProjects]);

  // Select a project
  const selectProject = useCallback((projectId: string | null) => {
    setCurrentProjectId(projectId);
    if (projectId) {
      localStorage.setItem(CURRENT_PROJECT_KEY, projectId);
      const proj = projects.find((p) => p.id === projectId);
      if (proj) setCurrentProjectName(proj.name);
    } else {
      localStorage.removeItem(CURRENT_PROJECT_KEY);
      setCurrentProjectName(null);
    }
  }, [projects]);

  // Create new project
  const createNewProject = useCallback(async (name: string) => {
    if (!supabase || !userId) return null;
    const newProject = await createProject(userId, name);
    if (newProject) {
      setProjects((prev) => [newProject, ...prev]);
      selectProject(newProject.id);
    }
    return newProject;
  }, [userId, selectProject]);

  // Delete a project
  const removeProject = useCallback(async (projectId: string) => {
    if (!supabase) return false;
    const success = await deleteProject(projectId);
    if (success) {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (currentProjectId === projectId) {
        selectProject(null);
      }
    }
    return success;
  }, [currentProjectId, selectProject]);

  // Rename current project
  const renameCurrentProject = useCallback(async (newName: string) => {
    if (!supabase || !currentProjectId) return false;
    const success = await renameProject(currentProjectId, newName);
    if (success) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === currentProjectId ? { ...p, name: newName.trim() } : p
        )
      );
      setCurrentProjectName(newName.trim());
    }
    return success;
  }, [currentProjectId]);

  // Load project data
  const loadRemote = useCallback(async () => {
    if (!supabase || !currentProjectId) return null;
    setIsLoadingRemote(true);
    const data = await loadProject(currentProjectId);
    setIsLoadingRemote(false);
    return data;
  }, [currentProjectId]);

  // Save status
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const pendingPayload = useRef<ProjectPayload | null>(null);

  // Save project data (debounced)
  const saveRemote = useCallback((payload: ProjectPayload) => {
    if (!supabase || !currentProjectId || !userId) return;
    pendingPayload.current = payload;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      if (!pendingPayload.current) return;
      setIsSaving(true);
      await saveProject(currentProjectId, userId, pendingPayload.current);
      setIsSaving(false);
      setLastSaved(new Date());
      pendingPayload.current = null;
    }, 800);
  }, [currentProjectId, userId]);

  // Immediate save (for manual save button)
  const saveNow = useCallback(async (payload: ProjectPayload) => {
    if (!supabase || !currentProjectId || !userId) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setIsSaving(true);
    await saveProject(currentProjectId, userId, payload);
    setIsSaving(false);
    setLastSaved(new Date());
    pendingPayload.current = null;
  }, [currentProjectId, userId]);

  return {
    // Projects list
    projects,
    isLoadingProjects,
    loadProjects,

    // Current project
    currentProjectId,
    currentProjectName,
    selectProject,

    // CRUD operations
    createNewProject,
    removeProject,
    renameCurrentProject,

    // Data operations
    isLoadingRemote,
    loadRemote,
    saveRemote,
    saveNow,
    isSaving,
    lastSaved,

    supabaseEnabled,
  };
}

