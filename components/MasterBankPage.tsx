import React from 'react';
import { ArrowLeftIcon, HomeIcon, ChevronRightIcon, UsersIcon } from '@heroicons/react/24/outline';
import { MasterStudentsPanel } from './MasterStudentsPanel';
import { ClassStats } from './ClassStats';

interface MasterStudent {
    id: string;
    name: string;
    year: string | null;
    course: string;
    imageUrl: string | null;
    entryYear?: number | null;
    durationYears?: number | null;
    classCode?: string | null;
}

interface MasterBankPageProps {
    allStudents: MasterStudent[];
    students: MasterStudent[];
    loading: boolean;
    error: string | null;
    filters: { search: string; year: string | null; course: string | null };
    setFilters: (f: { search: string; year: string | null; course: string | null }) => void;
    selectedIds: Set<string>;
    toggleSelected: (id: string) => void;
    clearSelection: () => void;
    createOrUpdate: (payload: { id?: string; name: string; year: string | null; course: string; imageUrl: string | null; entryYear?: number | null; durationYears?: number | null; classCode?: string | null }) => Promise<void>;
    remove: (id: string) => Promise<void>;
    editing: MasterStudent | null;
    setEditing: (s: MasterStudent | null) => void;
    sendSelected: () => void;
    canUse: boolean;
    onBackToDashboard: () => void;
}

export function MasterBankPage({
    allStudents,
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
    sendSelected,
    canUse,
    onBackToDashboard,
}: MasterBankPageProps) {
    // Filter count uses the filtered students
    const filteredCount = students.length;

    const hasFilters = filters.year || filters.course || filters.search;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex flex-col font-sans">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onBackToDashboard}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            >
                                <ArrowLeftIcon className="w-4 h-4" />
                                Voltar
                            </button>

                            {/* Breadcrumb */}
                            <nav className="hidden sm:flex items-center gap-2 text-sm">
                                <button
                                    onClick={onBackToDashboard}
                                    className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <HomeIcon className="w-4 h-4" />
                                    Dashboard
                                </button>
                                <ChevronRightIcon className="w-3 h-3 text-gray-300" />
                                <span className="flex items-center gap-1 text-blue-600 font-medium">
                                    <UsersIcon className="w-4 h-4" />
                                    Banco Global
                                </span>
                            </nav>
                        </div>

                        {/* Stats Badge */}
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
                                <span className="text-xs text-blue-600">
                                    {hasFilters ? (
                                        <>{filteredCount} de {allStudents.length} alunos</>
                                    ) : (
                                        <>{allStudents.length} alunos cadastrados</>
                                    )}
                                </span>
                            </div>
                            {hasFilters && (
                                <button
                                    onClick={() => setFilters({ search: '', year: null, course: null })}
                                    className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                                >
                                    Limpar filtros
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-6 py-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <ClassStats
                        students={allStudents}
                        onManageClass={(year, course) => setFilters({ ...filters, year, course })}
                    />
                    <MasterStudentsPanel
                        students={students}
                        loading={loading}
                        error={error}
                        filters={filters}
                        setFilters={setFilters}
                        selectedIds={selectedIds}
                        toggleSelected={toggleSelected}
                        clearSelection={clearSelection}
                        createOrUpdate={createOrUpdate}
                        remove={remove}
                        editing={editing}
                        setEditing={setEditing}
                        sendSelected={sendSelected}
                        canUse={canUse}
                    />
                </div>
            </div>
        </div>
    );
}
