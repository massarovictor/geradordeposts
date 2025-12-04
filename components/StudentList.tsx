import React from 'react';
import { Student } from '../types';
import { TrashIcon, PencilIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface StudentListProps {
    students: Student[];
    editingId: string | null;
    onEdit: (student: Student) => void;
    onRemove: (id: string) => void;
    onMove: (index: number, direction: 'up' | 'down') => void;
    onDragStart: (index: number) => void;
    onDragOver: (index: number, e: React.DragEvent<HTMLLIElement>) => void;
    onDragEnd: () => void;
    dragIndex: number | null;
    onClearAll: () => void;
}

export function StudentList({
    students,
    editingId,
    onEdit,
    onRemove,
    onMove,
    onDragStart,
    onDragOver,
    onDragEnd,
    dragIndex,
    onClearAll,
}: StudentListProps) {
    return (
        <section className="space-y-3">
            <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Lista Atual ({students.length})
                </h3>
                {students.length > 0 && (
                    <button
                        onClick={() => {
                            if (confirm('Limpar toda a lista?')) onClearAll();
                        }}
                        className="text-[10px] text-red-500 hover:underline"
                    >
                        Limpar tudo
                    </button>
                )}
            </div>

            {students.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-lg">
                    Nenhum aluno adicionado ainda.
                </div>
            ) : (
                <ul className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {students.map((s, idx) => (
                        <li
                            key={s.id}
                            draggable
                            onDragStart={() => onDragStart(idx)}
                            onDragOver={(e) => onDragOver(idx, e)}
                            onDragEnd={onDragEnd}
                            className={`flex items-center gap-2 p-2 rounded-lg border shadow-sm group transition-all ${editingId === s.id ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'
                                } ${dragIndex === idx ? 'ring-2 ring-emerald-200' : ''}`}
                        >
                            {/* Move Controls */}
                            <div className="flex flex-col -space-y-1">
                                <button
                                    onClick={() => onMove(idx, 'up')}
                                    disabled={idx === 0}
                                    className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-0"
                                    title="Mover para cima"
                                >
                                    <ArrowUpIcon className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => onMove(idx, 'down')}
                                    disabled={idx === students.length - 1}
                                    className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-0"
                                    title="Mover para baixo"
                                >
                                    <ArrowDownIcon className="w-3 h-3" />
                                </button>
                            </div>

                            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border border-gray-100">
                                {s.imageUrl ? (
                                    <img src={s.imageUrl} className="w-full h-full object-cover" alt={s.name} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                        <span className="text-[9px] text-gray-400 font-bold">{s.name.charAt(0)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex-grow min-w-0">
                                <p className={`text-sm font-medium truncate ${editingId === s.id ? 'text-amber-900' : 'text-gray-900'}`}>
                                    {s.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{s.grade}</p>
                            </div>

                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => onEdit(s)}
                                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                                    title="Editar"
                                >
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onRemove(s.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                    title="Remover"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
