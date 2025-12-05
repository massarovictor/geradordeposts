import React from 'react';
import { CardLayout, LAYOUT_CONFIG } from '../types';
import { Squares2X2Icon } from '@heroicons/react/24/outline';

interface LayoutSelectorProps {
    currentLayout: CardLayout;
    onLayoutChange: (layout: CardLayout) => void;
}

export function LayoutSelector({ currentLayout, onLayoutChange }: LayoutSelectorProps) {
    const layouts = [
        { id: CardLayout.GRID_2X2, gridClass: 'grid-cols-2 grid-rows-2' },
        { id: CardLayout.GRID_3X2, gridClass: 'grid-cols-3 grid-rows-2' },
        { id: CardLayout.GRID_3X3, gridClass: 'grid-cols-3 grid-rows-3' },
    ];

    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-gray-500">
                <Squares2X2Icon className="w-4 h-4" />
                <span className="text-xs font-medium">Layout</span>
            </div>

            <div className="flex gap-1.5">
                {layouts.map((layout) => {
                    const config = LAYOUT_CONFIG[layout.id];
                    const isActive = currentLayout === layout.id;

                    return (
                        <button
                            key={layout.id}
                            onClick={() => onLayoutChange(layout.id)}
                            title={config.label}
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-all ${isActive
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                        >
                            {/* Mini Grid Preview */}
                            <div className={`grid ${layout.gridClass} gap-px w-5 h-5`}>
                                {Array.from({ length: config.max }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`rounded-[1px] ${isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                    />
                                ))}
                            </div>
                            <span className={`text-[10px] font-medium ${isActive ? 'text-emerald-700' : 'text-gray-500'}`}>
                                {config.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
