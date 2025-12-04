import React, { useState, useCallback } from 'react';
import { Student, SCHOOL_YEARS, SCHOOL_COURSES } from '../types';
import { utils, write, read } from 'xlsx';

const makeId = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export type ImportMode = 'append' | 'replace';

export interface UseStudentsReturn {
    students: Student[];
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
    addStudent: (name: string, year: string, course: string, imageUrl: string | null) => void;
    updateStudent: (id: string, name: string, year: string, course: string, imageUrl: string | null) => void;
    removeStudent: (id: string) => void;
    moveStudent: (index: number, direction: 'up' | 'down') => void;
    reorderStudents: (fromIndex: number, toIndex: number) => void;
    downloadTemplate: () => void;
    importFromExcel: (file: File, mode: ImportMode) => Promise<{ imported: number; errors: string[] }>;
    clearAll: () => void;
}

export function useStudents(
    initialStudents: Student[] = [],
    onStudentsChange?: (students: Student[]) => void
): UseStudentsReturn {
    const [students, setStudentsInternal] = useState<Student[]>(initialStudents);

    const setStudents: React.Dispatch<React.SetStateAction<Student[]>> = useCallback((action) => {
        setStudentsInternal((prev) => {
            const next = typeof action === 'function' ? action(prev) : action;
            onStudentsChange?.(next);
            return next;
        });
    }, [onStudentsChange]);

    const addStudent = useCallback((name: string, year: string, course: string, imageUrl: string | null) => {
        const fullGrade = `${year} ${course}`.trim();
        const student: Student = {
            id: makeId(),
            name: name.trim(),
            grade: fullGrade,
            year,
            course,
            imageUrl,
        };
        setStudents((prev) => [...prev, student]);
    }, [setStudents]);

    const updateStudent = useCallback((id: string, name: string, year: string, course: string, imageUrl: string | null) => {
        const fullGrade = `${year} ${course}`.trim();
        setStudents((prev) =>
            prev.map((s) =>
                s.id === id
                    ? { ...s, name: name.trim(), grade: fullGrade, year, course, imageUrl: imageUrl || s.imageUrl }
                    : s
            )
        );
    }, [setStudents]);

    const removeStudent = useCallback((id: string) => {
        setStudents((prev) => prev.filter((s) => s.id !== id));
    }, [setStudents]);

    const moveStudent = useCallback((index: number, direction: 'up' | 'down') => {
        setStudents((prev) => {
            const newArr = [...prev];
            if (direction === 'up' && index > 0) {
                [newArr[index], newArr[index - 1]] = [newArr[index - 1], newArr[index]];
            } else if (direction === 'down' && index < newArr.length - 1) {
                [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
            }
            return newArr;
        });
    }, [setStudents]);

    const reorderStudents = useCallback((fromIndex: number, toIndex: number) => {
        setStudents((prev) => {
            const updated = [...prev];
            const [item] = updated.splice(fromIndex, 1);
            updated.splice(toIndex, 0, item);
            return updated;
        });
    }, [setStudents]);

    const downloadTemplate = useCallback(() => {
        const headers = [['Nome do Aluno', 'Ano (Ex: 1º)', 'Curso (Ex: Administração)']];
        const examples = [
            ['João Silva', '1º', 'Administração'],
            ['Maria Souza', '2º', 'Redes de Computadores'],
            ['Pedro Santos', '3º', 'Finanças'],
        ];

        const wb = utils.book_new();
        const ws = utils.aoa_to_sheet([...headers, ...examples]);
        utils.book_append_sheet(wb, ws, 'Modelo');

        const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'modelo_alunos.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
    }, []);

    const importFromExcel = useCallback(async (file: File, mode: ImportMode): Promise<{ imported: number; errors: string[] }> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const buffer = evt.target?.result as ArrayBuffer;
                    const wb = read(buffer, { type: 'array' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = utils.sheet_to_json(ws, { header: 1 }).slice(1) as any[][];

                    const newStudents: Student[] = [];
                    const errors: string[] = [];

                    data.forEach((row, idx) => {
                        const line = idx + 2;
                        const name = row?.[0] ? String(row[0]).trim() : '';
                        const yearRaw = row?.[1] ? String(row[1]).trim() : '';
                        const courseRaw = row?.[2] ? String(row[2]).trim() : '';

                        if (!name) {
                            errors.push(`Linha ${line}: nome vazio, linha ignorada.`);
                            return;
                        }

                        const year = SCHOOL_YEARS.includes(yearRaw) ? yearRaw : yearRaw || undefined;
                        const course = courseRaw || undefined;
                        const gradeStr = [year, course].filter(Boolean).join(' ');

                        newStudents.push({
                            id: makeId(),
                            name,
                            grade: gradeStr || 'Série/Curso não informado',
                            year,
                            course,
                            imageUrl: null,
                        });
                    });

                    if (newStudents.length > 0) {
                        setStudents((prev) => (mode === 'replace' ? newStudents : [...prev, ...newStudents]));
                    }

                    resolve({ imported: newStudents.length, errors });
                } catch (error) {
                    console.error('Import error', error);
                    resolve({ imported: 0, errors: ['Erro ao ler o arquivo.'] });
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }, [setStudents]);

    const clearAll = useCallback(() => {
        setStudents([]);
    }, [setStudents]);

    return {
        students,
        setStudents,
        addStudent,
        updateStudent,
        removeStudent,
        moveStudent,
        reorderStudents,
        downloadTemplate,
        importFromExcel,
        clearAll,
    };
}
