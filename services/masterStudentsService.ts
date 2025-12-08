import { supabase } from './supabaseClient';
import { Student, SCHOOL_YEARS, SCHOOL_COURSES } from '../types';

export interface MasterStudentInput {
  name: string;
  year: string | null;
  course: string;
  imageUrl: string | null;
  entryYear?: number | null;
  durationYears?: number | null;
  classCode?: string | null;
}

export interface MasterStudentRecord extends MasterStudentInput {
  id: string;
  created_at?: string;
  updated_at?: string;
}

export interface MasterStudentFilters {
  search?: string;
  year?: string | null;
  course?: string | null;
}

const TABLE = 'students_master';

const mapRow = (row: any): MasterStudentRecord => ({
  id: row.id,
  name: row.name,
  year: row.year,
  course: row.course,
  imageUrl: row.image_url ?? null,
  entryYear: row.entry_year ?? null,
  durationYears: row.duration_years ?? null,
  classCode: row.class_code ?? null,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export async function listMasterStudents(filters: MasterStudentFilters = {}): Promise<MasterStudentRecord[]> {
  if (!supabase) return [];
  let query = supabase.from(TABLE).select('*').order('name', { ascending: true });

  if (filters.year) query = query.eq('year', filters.year);
  // Handle course abbreviations by matching key parts
  if (filters.course) {
    const courseLower = filters.course.toLowerCase();
    if (courseLower.includes('redes') || courseLower.includes('computadores')) {
      query = query.or('course.ilike.%redes%,course.ilike.%computadores%');
    } else if (courseLower.includes('sistemas') || courseLower.includes('desenv') || courseLower.includes('desenvolvimento')) {
      query = query.or('course.ilike.%sistemas%,course.ilike.%desenv%,course.ilike.%desenvolvimento%');
    } else {
      query = query.ilike('course', `%${filters.course}%`);
    }
  }
  if (filters.search) query = query.ilike('name', `%${filters.search}%`);

  const { data, error } = await query;
  if (error) {
    console.warn('Erro ao listar alunos master:', error.message);
    return [];
  }
  return (data || []).map(mapRow);
}

export async function createMasterStudent(input: MasterStudentInput, userId: string) {
  if (!supabase) throw new Error('Supabase não configurado');

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      name: input.name.trim(),
      year: SCHOOL_YEARS.includes(input.year) ? input.year : null,
      course: SCHOOL_COURSES.includes(input.course) ? input.course : input.course || null,
      image_url: input.imageUrl,
      user_id: userId,
      entry_year: input.entryYear ?? null,
      duration_years: input.durationYears ?? null,
      class_code: input.classCode ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}

export async function updateMasterStudent(id: string, input: MasterStudentInput, userId: string) {
  if (!supabase) throw new Error('Supabase não configurado');
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      name: input.name.trim(),
      year: SCHOOL_YEARS.includes(input.year) ? input.year : null,
      course: SCHOOL_COURSES.includes(input.course) ? input.course : input.course || null,
      image_url: input.imageUrl,
      user_id: userId,
      entry_year: input.entryYear ?? null,
      duration_years: input.durationYears ?? null,
      class_code: input.classCode ?? null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}

export async function deleteMasterStudent(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) {
    console.warn('Erro ao remover aluno master:', error.message);
  }
}

