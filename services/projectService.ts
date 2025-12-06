import { supabase } from './supabaseClient';
import { PageConfig, Student } from '../types';

export interface Project {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectPayload {
  config: PageConfig;
  currentPage: number;
  students: Student[];
}

const normalizeStudent = (s: any): Student => ({
  id: s.id,
  name: s.name,
  grade: s.grade,
  year: s.year ?? undefined,
  course: s.course ?? undefined,
  imageUrl: s.image_url ?? null,
});

// ========== PROJECT CRUD ==========

export async function listProjects(userId: string): Promise<Project[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('projects')
    .select('id, name, user_id, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.warn('Erro ao listar projetos:', error.message);
    return [];
  }

  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.name || 'Projeto sem nome',
    user_id: p.user_id,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }));
}

export async function createProject(userId: string, name: string): Promise<Project | null> {
  if (!supabase) return null;

  const projectId = crypto.randomUUID();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('projects')
    .insert({
      id: projectId,
      user_id: userId,
      name: name.trim() || 'Novo Projeto',
      config: {},
      current_page: 0,
      created_at: now,
      updated_at: now,
    })
    .select('id, name, user_id, created_at, updated_at')
    .single();

  if (error) {
    console.warn('Erro ao criar projeto:', error.message);
    return null;
  }

  return data as Project;
}

export async function deleteProject(projectId: string): Promise<boolean> {
  if (!supabase) return false;

  // First delete project students
  const { error: studentsError } = await supabase
    .from('project_students')
    .delete()
    .eq('project_id', projectId);

  if (studentsError) {
    console.warn('Erro ao deletar alunos do projeto:', studentsError.message);
  }

  // Then delete the project
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    console.warn('Erro ao deletar projeto:', error.message);
    return false;
  }

  return true;
}

export async function renameProject(projectId: string, newName: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('projects')
    .update({ name: newName.trim(), updated_at: new Date().toISOString() })
    .eq('id', projectId);

  if (error) {
    console.warn('Erro ao renomear projeto:', error.message);
    return false;
  }

  return true;
}

// ========== PROJECT DATA LOAD/SAVE ==========

export async function loadProject(projectId: string): Promise<ProjectPayload | null> {
  if (!supabase) return null;

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('config, current_page')
    .eq('id', projectId)
    .maybeSingle();

  if (projectError) {
    console.warn('Erro ao carregar projeto:', projectError.message);
    return null;
  }

  const { data: students, error: studentsError } = await supabase
    .from('project_students')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true });

  if (studentsError) {
    console.warn('Erro ao carregar alunos do projeto:', studentsError.message);
    return null;
  }

  if (!project) return null;

  return {
    config: project.config,
    currentPage: project.current_page ?? 0,
    students: (students || []).map(normalizeStudent),
  };
}

export async function saveProject(projectId: string, userId: string | null, payload: ProjectPayload) {
  if (!supabase) return;

  const { config, currentPage, students } = payload;

  // Upsert do projeto
  const { error: upsertError } = await supabase
    .from('projects')
    .upsert({
      id: projectId,
      user_id: userId,
      config,
      current_page: currentPage,
      updated_at: new Date().toISOString(),
    });

  if (upsertError) {
    console.warn('Erro ao salvar projeto:', upsertError.message);
    return;
  }

  // Simplificação: apaga e reinsere alunos
  const { error: deleteError } = await supabase
    .from('project_students')
    .delete()
    .eq('project_id', projectId);

  if (deleteError) {
    console.warn('Erro ao limpar alunos do projeto:', deleteError.message);
    return;
  }

  if (!students.length) return;

  const rows = students.map((s, idx) => ({
    id: s.id,
    project_id: projectId,
    name: s.name,
    grade: s.grade,
    year: s.year ?? null,
    course: s.course ?? null,
    image_url: s.imageUrl ?? null,
    order_index: idx,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { error: insertError } = await supabase
    .from('project_students')
    .insert(rows);

  if (insertError) {
    console.warn('Erro ao salvar alunos do projeto:', insertError.message);
  }
}

