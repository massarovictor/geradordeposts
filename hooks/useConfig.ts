import React, { useState, useCallback } from 'react';
import { PageConfig, ThemeColor, CardLayout } from '../types';

export const defaultConfig: PageConfig = {
    schoolName: 'Alunos Destaques',
    footerTitle: 'EEEP Maria Célia',
    footerSubtitle: '3º Bimestre',
    themeColor: ThemeColor.GREEN,
    customThemeColor: '#059669',
    customAccentColor: '#059669',
    useSingleCustomColor: false,
    headerTitleColor: '#0f172a',
    footerTitleColor: '#ffffff',
    subtitleColor: '#0f172a',
    logoUrl: null,
    backgroundImageUrl: null,
    enableThemeOverlay: true,
    enableBackgroundBlur: true,
    applyThemeToAccents: true,
    cardLayout: CardLayout.GRID_3X3,
    darkCardMode: false,
    // Grid container defaults
    gridBackgroundColor: '#ffffff',
    gridBackgroundOpacity: 50,
    gridBackgroundPattern: 'none',
    gridTintWithTheme: false,
};

export interface UseConfigReturn {
    config: PageConfig;
    setConfig: React.Dispatch<React.SetStateAction<PageConfig>>;
    updateConfig: (updates: Partial<PageConfig>) => void;
    setTheme: (theme: ThemeColor) => void;
    setCustomColor: (color: string) => void;
    setLayout: (layout: CardLayout) => void;
    setLogo: (url: string | null) => void;
    setBackground: (url: string | null) => void;
    resetConfig: () => void;
}

export function useConfig(
    initialConfig: PageConfig = defaultConfig,
    onConfigChange?: (config: PageConfig) => void
): UseConfigReturn {
    const [config, setConfigInternal] = useState<PageConfig>(initialConfig);

    const setConfig: React.Dispatch<React.SetStateAction<PageConfig>> = useCallback((action) => {
        setConfigInternal((prev) => {
            const next = typeof action === 'function' ? action(prev) : action;
            onConfigChange?.(next);
            return next;
        });
    }, [onConfigChange]);

    const updateConfig = useCallback((updates: Partial<PageConfig>) => {
        setConfig((prev) => ({ ...prev, ...updates }));
    }, [setConfig]);

    const setTheme = useCallback((theme: ThemeColor) => {
        setConfig((prev) => ({ ...prev, themeColor: theme }));
    }, [setConfig]);

    const setCustomColor = useCallback((color: string) => {
        setConfig((prev) => ({
            ...prev,
            themeColor: ThemeColor.CUSTOM,
            customThemeColor: color,
            customAccentColor: prev.useSingleCustomColor ? color : prev.customAccentColor,
        }));
    }, [setConfig]);

    const setLayout = useCallback((layout: CardLayout) => {
        setConfig((prev) => ({ ...prev, cardLayout: layout }));
    }, [setConfig]);

    const setLogo = useCallback((url: string | null) => {
        setConfig((prev) => ({ ...prev, logoUrl: url }));
    }, [setConfig]);

    const setBackground = useCallback((url: string | null) => {
        setConfig((prev) => ({ ...prev, backgroundImageUrl: url }));
    }, [setConfig]);

    const resetConfig = useCallback(() => {
        setConfig(defaultConfig);
    }, [setConfig]);

    return {
        config,
        setConfig,
        updateConfig,
        setTheme,
        setCustomColor,
        setLayout,
        setLogo,
        setBackground,
        resetConfig,
    };
}
