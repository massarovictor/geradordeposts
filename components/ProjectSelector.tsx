import React, { useState } from 'react';
import {
    FolderIcon,
    PlusIcon,
    TrashIcon,
    PencilSquareIcon,
    CheckIcon,
    XMarkIcon,
    DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';

interface Project {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
}

interface ProjectSelectorProps {
    projects: Project[];
    currentProjectId: string | null;
    loading: boolean;
    onSelectProject: (projectId: string) => void;
    onCreateProject: (name: string) => Promise<void>;
    onDeleteProject: (projectId: string) => Promise<void>;
    onRenameProject: (projectId: string, newName: string) => Promise<void>;
}

export function ProjectSelector({
    projects,
    currentProjectId,
    loading,
    onSelectProject,
    onCreateProject,
    onDeleteProject,
    onRenameProject,
}: ProjectSelectorProps) {
    const [newProjectName, setNewProjectName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!newProjectName.trim()) return;
        setIsCreating(true);
        await onCreateProject(newProjectName.trim());
        setNewProjectName('');
        setIsCreating(false);
    };

    const handleRename = async (projectId: string) => {
        if (!editingName.trim()) {
            setEditingId(null);
            return;
        }
        await onRenameProject(projectId, editingName.trim());
        setEditingId(null);
        setEditingName('');
    };

    const handleDelete = async (projectId: string) => {
        await onDeleteProject(projectId);
        setDeletingId(null);
    };

    const startEditing = (project: Project) => {
        setEditingId(project.id);
        setEditingName(project.name);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-4">
            {/* Create New Project */}
            <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <PlusIcon className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Criar Novo Projeto</h3>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Nome do projeto..."
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        disabled={isCreating}
                    />
                    <button
                        onClick={handleCreate}
                        disabled={!newProjectName.trim() || isCreating}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        {isCreating ? 'Criando...' : 'Criar'}
                    </button>
                </div>
            </div>

            {/* Projects List */}
            <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <FolderIcon className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Meus Projetos</h3>
                    <span className="text-xs text-gray-500">({projects.length})</span>
                </div>

                {loading ? (
                    <div className="py-8 text-center text-gray-500 text-sm">Carregando projetos...</div>
                ) : projects.length === 0 ? (
                    <div className="py-8 text-center">
                        <DocumentDuplicateIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Nenhum projeto criado ainda</p>
                        <p className="text-gray-400 text-xs">Crie um projeto acima para começar</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className={`group p-3 rounded-lg border transition-all cursor-pointer ${currentProjectId === project.id
                                        ? 'border-emerald-500 bg-emerald-50/50'
                                        : 'border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {deletingId === project.id ? (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-red-600">Confirmar exclusão?</span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleDelete(project.id)}
                                                className="p-1.5 text-white bg-red-500 hover:bg-red-600 rounded-md"
                                            >
                                                <CheckIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeletingId(null)}
                                                className="p-1.5 text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-md"
                                            >
                                                <XMarkIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : editingId === project.id ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleRename(project.id)}
                                            className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleRename(project.id)}
                                            className="p-1.5 text-white bg-emerald-500 hover:bg-emerald-600 rounded-md"
                                        >
                                            <CheckIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="p-1.5 text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-md"
                                        >
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between" onClick={() => onSelectProject(project.id)}>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-gray-900 truncate">{project.name}</h4>
                                            <p className="text-[11px] text-gray-500">
                                                Atualizado em {formatDate(project.updated_at)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    startEditing(project);
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md"
                                                title="Renomear"
                                            >
                                                <PencilSquareIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeletingId(project.id);
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md"
                                                title="Excluir"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
