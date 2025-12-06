import React, { useMemo } from 'react';
import { UserGroupIcon, ExclamationTriangleIcon, PhotoIcon, CheckCircleIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

interface StudentStub {
    id: string;
    name: string;
    year?: string | null;
    course?: string | null;
    imageUrl: string | null;
}

interface ClassStatsProps {
    students: StudentStub[];
    onManageClass: (year: string, course: string) => void;
}

export function ClassStats({ students, onManageClass }: ClassStatsProps) {
    const classes = useMemo(() => {
        const groups: Record<string, { year: string; course: string; total: number; missingPhoto: number, missingIds: string[] }> = {};

        students.forEach((s) => {
            if (!s.year || !s.course) return;

            const key = `${s.year}|${s.course}`;

            if (!groups[key]) {
                groups[key] = {
                    year: s.year,
                    course: s.course,
                    total: 0,
                    missingPhoto: 0,
                    missingIds: []
                };
            }

            groups[key].total++;
            if (!s.imageUrl) {
                groups[key].missingPhoto++;
                groups[key].missingIds.push(s.name);
            }
        });

        return Object.values(groups).sort((a, b) => {
            const yearCompare = a.year.localeCompare(b.year);
            if (yearCompare !== 0) return yearCompare;
            return a.course.localeCompare(b.course);
        });
    }, [students]);

    if (classes.length === 0) {
        return null;
    }

    const totalStudents = classes.reduce((sum, c) => sum + c.total, 0);
    const totalMissing = classes.reduce((sum, c) => sum + c.missingPhoto, 0);
    const completionRate = totalStudents > 0 ? Math.round(((totalStudents - totalMissing) / totalStudents) * 100) : 100;

    return (
        <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-5">
            {/* Header with Stats */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                        <AcademicCapIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900">Turmas Cadastradas</h3>
                        <p className="text-xs text-gray-500">{classes.length} turmas • {totalStudents} alunos</p>
                    </div>
                </div>

                {/* Completion Badge */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${completionRate === 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {completionRate === 100 ? (
                        <>
                            <CheckCircleIcon className="w-4 h-4" />
                            Fotos completas
                        </>
                    ) : (
                        <>
                            <ExclamationTriangleIcon className="w-4 h-4" />
                            {totalMissing} sem foto ({completionRate}% completo)
                        </>
                    )}
                </div>
            </div>

            {/* Class Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {classes.map((cls) => {
                    const isComplete = cls.missingPhoto === 0;

                    return (
                        <button
                            key={`${cls.year}-${cls.course}`}
                            onClick={() => onManageClass(cls.year, cls.course)}
                            className={`relative flex flex-col p-4 rounded-xl border-2 transition-all duration-200 text-left group hover:scale-[1.02] active:scale-[0.98] ${isComplete
                                    ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200 hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-100'
                                    : 'bg-gradient-to-br from-amber-50 to-white border-amber-200 hover:border-amber-400 hover:shadow-md hover:shadow-amber-100'
                                }`}
                        >
                            {/* Year Badge */}
                            <div className="flex justify-between items-center w-full mb-3">
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm ${isComplete
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-amber-500 text-white'
                                    }`}>
                                    {cls.year}
                                </span>
                                <span className="text-xs text-gray-500 font-medium">
                                    {cls.total} {cls.total === 1 ? 'aluno' : 'alunos'}
                                </span>
                            </div>

                            {/* Course Name */}
                            <h4 className="text-sm font-semibold text-gray-900 leading-tight mb-3 group-hover:text-gray-700 line-clamp-2">
                                {cls.course}
                            </h4>

                            {/* Status Footer */}
                            <div className="mt-auto pt-3 border-t border-gray-100">
                                {isComplete ? (
                                    <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                                        <PhotoIcon className="w-4 h-4" />
                                        <span className="font-medium">Todas as fotos</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-xs text-amber-600">
                                            <ExclamationTriangleIcon className="w-4 h-4" />
                                            <span className="font-medium">{cls.missingPhoto} sem foto</span>
                                        </div>
                                        {/* Progress bar */}
                                        <div className="w-12 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-amber-500 rounded-full transition-all"
                                                style={{ width: `${((cls.total - cls.missingPhoto) / cls.total) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
