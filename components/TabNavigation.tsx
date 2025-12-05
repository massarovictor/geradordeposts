import React from 'react';
import { PaintBrushIcon, UserGroupIcon } from '@heroicons/react/24/outline';

export type TabType = 'visual' | 'students';

interface TabNavigationProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
    return (
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
            <div className="flex">
                <button
                    onClick={() => onTabChange('visual')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'visual'
                            ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    <PaintBrushIcon className="w-4 h-4" />
                    Visual & Escola
                </button>
                <button
                    onClick={() => onTabChange('students')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'students'
                            ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    <UserGroupIcon className="w-4 h-4" />
                    Alunos
                </button>
            </div>
        </div>
    );
}
