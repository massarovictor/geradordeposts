import React, { useState, useMemo } from 'react';
import { SCHOOL_YEARS, SCHOOL_COURSES } from '../types';
import { MagnifyingGlassIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface MasterStudent {
    id: string;
    name: string;
    year: string | null;
    course: string;
    imageUrl: string | null;
    classCode?: string | null;
}

interface MasterStudentSelectorProps {
    students: MasterStudent[];
    onImport: (selected: MasterStudent[]) => void;
    onCancel: () => void;
}

export function MasterStudentSelector({ students, onImport, onCancel }: MasterStudentSelectorProps) {
    const [search, setSearch] = useState('');
    const [yearFilter, setYearFilter] = useState<string>('');
    const [courseFilter, setCourseFilter] = useState<string>('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const filteredList = useMemo(() => {
        return students.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
            const matchesYear = yearFilter ? s.year === yearFilter : true;
            const matchesCourse = courseFilter ? s.course === courseFilter : true;
            return matchesSearch && matchesYear && matchesCourse;
        });
    }, [students, search, yearFilter, courseFilter]);

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleImport = () => {
        const selected = students.filter(s => selectedIds.has(s.id));
        onImport(selected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredList.length && filteredList.length > 0) {
            setSelectedIds(new Set());
        } else {
            const next = new Set(selectedIds);
            filteredList.forEach(s => next.add(s.id));
            setSelectedIds(next);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Selecionar do Banco</h3>
                        <p className="text-sm text-gray-500">Escolha os alunos para adicionar ao projeto</p>
                    </div>
                    <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Filters */}
                <div className="p-4 border-b border-gray-100 space-y-3 bg-gray-50/50">
                    <div className="flex gap-2">
                        <div className="flex-1 flex items-center px-3 bg-white border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-emerald-100 focus-within:border-emerald-400 transition-all">
                            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nome..."
                                className="w-full px-2 py-2 text-sm outline-none"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <select
                            className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-emerald-400"
                            value={yearFilter}
                            onChange={e => setYearFilter(e.target.value)}
                        >
                            <option value="">Todos os Anos</option>
                            {SCHOOL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <select
                            className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-emerald-400"
                            value={courseFilter}
                            onChange={e => setCourseFilter(e.target.value)}
                        >
                            <option value="">Todos os Cursos</option>
                            {SCHOOL_COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500">
                            Mostrando {filteredList.length} alunos
                        </p>
                        <button
                            onClick={toggleSelectAll}
                            className="text-xs text-blue-600 hover:underline font-medium"
                        >
                            {selectedIds.size === filteredList.length && filteredList.length > 0 ? 'Desmarcar todos' : 'Marcar todos visíveis'}
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredList.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            Nenhum aluno encontrado com esses filtros.
                        </div>
                    ) : (
                        filteredList.map(student => {
                            const isSelected = selectedIds.has(student.id);
                            return (
                                <div
                                    key={student.id}
                                    onClick={() => toggleSelection(student.id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isSelected
                                            ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                                            : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 bg-white'
                                        }`}>
                                        {isSelected && <CheckCircleIcon className="w-4 h-4 text-white" />}
                                    </div>

                                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200 flex-shrink-0">
                                        {student.imageUrl ? (
                                            <img src={student.imageUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">
                                                {student.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${isSelected ? 'text-emerald-900' : 'text-gray-900'}`}>
                                            {student.name}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {[student.year, student.course].filter(Boolean).join(' - ')}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center rounded-b-2xl">
                    <span className="text-sm font-medium text-gray-600">
                        {selectedIds.size} selecionado(s)
                    </span>
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={selectedIds.size === 0}
                            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Importar Selecionados
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
