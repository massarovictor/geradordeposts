import { useState, useMemo, useCallback } from 'react';
import { Student, FilterState } from '../types';

export interface UseFiltersReturn {
    filters: FilterState;
    setYearFilter: (year: string | null) => void;
    setCourseFilter: (course: string | null) => void;
    clearFilters: () => void;
    filterStudents: (students: Student[]) => Student[];
    hasActiveFilters: boolean;
}

export function useFilters(): UseFiltersReturn {
    const [filters, setFilters] = useState<FilterState>({
        year: null,
        course: null,
    });

    const setYearFilter = useCallback((year: string | null) => {
        setFilters((prev) => ({ ...prev, year }));
    }, []);

    const setCourseFilter = useCallback((course: string | null) => {
        setFilters((prev) => ({ ...prev, course }));
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({ year: null, course: null });
    }, []);

    // Normalize course name for comparison (handles abbreviations)
    const normalizeCourse = (course: string | undefined | null): string => {
        if (!course) return '';
        const lower = course.trim().toLowerCase();
        // Map all variations to a canonical form
        // Handle "Redes de Computadores", "Redes de C.", etc.
        if (lower.includes('redes') || lower.includes('computadores')) return 'redes';
        // Handle "D. de Sistemas", "Desenv. de Sistemas", "Desenvolvimento de Sistemas"
        if (lower.includes('sistemas') || lower.includes('desenv') || lower.includes('desenvolvimento') || lower.startsWith('d.')) return 'sistemas';
        if (lower.includes('admin')) return 'administracao';
        if (lower.includes('comercio') || lower.includes('comércio')) return 'comercio';
        if (lower.includes('finanças') || lower.includes('financas')) return 'financas';
        if (lower.includes('frut')) return 'fruticultura';
        if (lower.includes('agro')) return 'agronegocio';
        return lower;
    };

    const filterStudents = useCallback((students: Student[]): Student[] => {
        return students.filter((student) => {
            if (filters.year && student.year !== filters.year) return false;
            if (filters.course) {
                const normalizedFilter = normalizeCourse(filters.course);
                const normalizedStudent = normalizeCourse(student.course);
                if (normalizedFilter !== normalizedStudent) return false;
            }
            return true;
        });
    }, [filters]);

    const hasActiveFilters = useMemo(() => {
        return filters.year !== null || filters.course !== null;
    }, [filters]);

    return {
        filters,
        setYearFilter,
        setCourseFilter,
        clearFilters,
        filterStudents,
        hasActiveFilters,
    };
}
