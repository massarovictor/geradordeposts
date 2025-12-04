import React from 'react';
import { CardLayout, LAYOUT_CONFIG } from '../types';
import { Squares2X2Icon } from '@heroicons/react/24/outline';

interface LayoutSelectorProps {
    currentLayout: CardLayout;
    onLayoutChange: (layout: CardLayout) => void;
}

export function LayoutSelector({ currentLayout, onLayoutChange }: LayoutSelectorProps) {
    const layouts = [
        { id: CardLayout.GRID_2X2, icon: '⊞', gridClass: 'grid-cols-2 grid-rows-2' },
        { id: CardLayout.GRID_3X2, icon: '⊟', gridClass: 'grid-cols-3 grid-rows-2' },
        { id: CardLayout.GRID_3X3, icon: '⊞', gridClass: 'grid-cols-3 grid-rows-3' },
    ];

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-gray-700">
                <Squares2X2Icon className="w-4 h-4" />
                <span className="text-xs font-medium">Layout do Card</span>
            </div>

            <div className="flex gap-2">
                {layouts.map((layout) => {
                    const config = LAYOUT_CONFIG[layout.id];
                    const isActive = currentLayout === layout.id;

                    return (
                        <button
                            key={layout.id}
                            onClick={() => onLayoutChange(layout.id)}
                            className={`flex-1 p-3 rounded-xl border-2 transition-all ${isActive
                                    ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {/* Mini Grid Preview */}
                            <div className={`grid ${layout.gridClass} gap-0.5 w-full aspect-square mb-2`}>
                                {Array.from({ length: config.max }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`rounded-sm ${isActive ? 'bg-emerald-400' : 'bg-gray-300'}`}
                                    />
                                ))}
                            </div>

                            <p className={`text-[10px] font-medium text-center ${isActive ? 'text-emerald-700' : 'text-gray-600'}`}>
                                {config.label}
                            </p>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
