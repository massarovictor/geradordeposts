import React from 'react';
import { ArrowRightCircleIcon, ArrowPathIcon, UsersIcon, FolderOpenIcon, CloudIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { ProjectSelector } from './ProjectSelector';

interface Project {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface DashboardProps {
  userEmail?: string | null;
  masterCount: number | null;
  masterStudents: any[];
  onReloadMaster: () => void;
  loadingMaster: boolean;
  supabaseConfigured: boolean;
  onSignOut: () => void;
  authError?: string | null;
  projects: Project[];
  currentProjectId: string | null;
  currentProjectName: string | null;
  loadingProjects: boolean;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (name: string) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  onRenameProject: (projectId: string, newName: string) => Promise<void>;
  onEnterProject: () => void;
  onAccessMasterBank: () => void;
}

export function Dashboard({
  userEmail,
  masterCount,
  masterStudents,
  onReloadMaster,
  loadingMaster,
  supabaseConfigured,
  onSignOut,
  authError,
  projects,
  currentProjectId,
  currentProjectName,
  loadingProjects,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onRenameProject,
  onEnterProject,
  onAccessMasterBank,
}: DashboardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-emerald-50/30 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Header */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Olá, <span className="text-emerald-600">{userEmail?.split('@')[0]}</span>
              </h1>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                Gerador de Grade
                {supabaseConfigured && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <CloudIcon className="w-3 h-3" />
                    Sincronizado
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
          >
            Sair
          </button>
        </div>

        {/* Alerts */}
        {!supabaseConfigured && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-3 animate-in fade-in duration-300">
            <span className="text-xl">⚠️</span>
            <span>Supabase não configurado. O sistema não salvará dados na nuvem.</span>
          </div>
        )}

        {authError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 animate-in fade-in duration-300">
            {authError}
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column: Master Bank */}
          <div className="lg:col-span-5">
            <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 hover:border-blue-200/50 h-full">
              <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <UsersIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Banco Global</h2>
                      <p className="text-blue-100 text-xs">Área Administrativa</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-bold text-gray-900 tabular-nums">{masterCount ?? '—'}</p>
                    <p className="text-xs text-gray-500 uppercase font-medium tracking-wide mt-1">Alunos cadastrados</p>
                  </div>
                  <button
                    onClick={onReloadMaster}
                    disabled={loadingMaster}
                    className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                    title="Recarregar dados"
                  >
                    <ArrowPathIcon className={`w-5 h-5 ${loadingMaster ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="p-4 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100/50">
                  <p className="text-sm text-blue-800/80 mb-4">
                    Cadastre e organize todos os alunos. Depois, importe para seus projetos.
                  </p>
                  <button
                    onClick={onAccessMasterBank}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-600/20 transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Gerenciar Banco Global
                    <ArrowRightCircleIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Projects */}
          <div className="lg:col-span-7">
            <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 hover:border-emerald-200/50 h-full flex flex-col">
              <div className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <FolderOpenIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Meus Projetos</h2>
                      <p className="text-emerald-100 text-xs">Área Criativa & Edição</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <ProjectSelector
                  projects={projects}
                  currentProjectId={currentProjectId}
                  loading={loadingProjects}
                  onSelectProject={onSelectProject}
                  onCreateProject={onCreateProject}
                  onDeleteProject={onDeleteProject}
                  onRenameProject={onRenameProject}
                />

                {currentProjectId && (
                  <div className="mt-6 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl text-white shadow-lg shadow-emerald-600/20 group/cta hover:shadow-xl hover:shadow-emerald-600/30 transition-all duration-300">
                      <div className="min-w-0 flex-1 mr-4">
                        <p className="text-emerald-200 text-xs font-medium uppercase mb-1">Pronto para editar</p>
                        <p className="text-lg font-bold truncate">{currentProjectName}</p>
                      </div>
                      <button
                        onClick={onEnterProject}
                        className="whitespace-nowrap px-5 py-2.5 bg-white text-emerald-700 text-sm font-bold rounded-lg hover:bg-emerald-50 transition-all duration-200 flex items-center gap-2 hover:scale-105 active:scale-95"
                      >
                        Abrir Editor
                        <ArrowRightCircleIcon className="w-4 h-4 group-hover/cta:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
