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

    const filterStudents = useCallback((students: Student[]): Student[] => {
        return students.filter((student) => {
            if (filters.year && student.year !== filters.year) return false;
            if (filters.course && student.course !== filters.course) return false;
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
