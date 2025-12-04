import React from 'react';
import { SCHOOL_YEARS, SCHOOL_COURSES, FilterState } from '../types';
import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface FilterBarProps {
    filters: FilterState;
    onYearChange: (year: string | null) => void;
    onCourseChange: (course: string | null) => void;
    onClear: () => void;
    hasActiveFilters: boolean;
    totalCount: number;
    filteredCount: number;
}

export function FilterBar({
    filters,
    onYearChange,
    onCourseChange,
    onClear,
    hasActiveFilters,
    totalCount,
    filteredCount,
}: FilterBarProps) {
    return (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-1.5 text-indigo-700">
                <FunnelIcon className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Filtros</span>
            </div>

            <select
                value={filters.year || ''}
                onChange={(e) => onYearChange(e.target.value || null)}
                className="px-2 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
            >
                <option value="">Todos os anos</option>
                {SCHOOL_YEARS.map((year) => (
                    <option key={year} value={year}>
                        {year} Ano
                    </option>
                ))}
            </select>

            <select
                value={filters.course || ''}
                onChange={(e) => onCourseChange(e.target.value || null)}
                className="px-2 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
            >
                <option value="">Todos os cursos</option>
                {SCHOOL_COURSES.map((course) => (
                    <option key={course} value={course}>
                        {course}
                    </option>
                ))}
            </select>

            {hasActiveFilters && (
                <button
                    onClick={onClear}
                    className="flex items-center gap-1 px-2 py-1.5 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                    <XMarkIcon className="w-3 h-3" />
                    Limpar
                </button>
            )}

            <span className="ml-auto text-[10px] text-indigo-600 bg-white px-2 py-1 rounded-full border border-indigo-100">
                {hasActiveFilters ? `${filteredCount} de ${totalCount}` : `${totalCount} alunos`}
            </span>
        </div>
    );
}
