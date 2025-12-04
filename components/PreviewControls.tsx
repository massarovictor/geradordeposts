import React from 'react';
import { DevicePhoneMobileIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

interface PreviewControlsProps {
    scale: number;
    onScaleChange: (scale: number) => void;
    showMobileFrame: boolean;
    onToggleMobileFrame: () => void;
}

export function PreviewControls({
    scale,
    onScaleChange,
    showMobileFrame,
    onToggleMobileFrame,
}: PreviewControlsProps) {
    const scaleOptions = [
        { value: 0.7, label: '70%' },
        { value: 0.85, label: '85%' },
        { value: 1, label: '100%' },
    ];

    return (
        <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-gray-100">
            {/* Scale Controls */}
            <div className="flex items-center gap-1">
                {scaleOptions.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onScaleChange(option.value)}
                        className={`px-2 py-1 text-[10px] font-medium rounded-full transition-all ${scale === option.value
                                ? 'bg-gray-900 text-white'
                                : 'text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            <div className="w-px h-4 bg-gray-200" />

            {/* Mobile Frame Toggle */}
            <button
                onClick={onToggleMobileFrame}
                className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium rounded-full transition-all ${showMobileFrame
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                title="Simular visualização mobile"
            >
                {showMobileFrame ? (
                    <DevicePhoneMobileIcon className="w-3.5 h-3.5" />
                ) : (
                    <ComputerDesktopIcon className="w-3.5 h-3.5" />
                )}
                {showMobileFrame ? 'Mobile' : 'Desktop'}
            </button>
        </div>
    );
}
