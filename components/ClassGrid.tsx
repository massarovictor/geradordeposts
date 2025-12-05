
import React, { forwardRef } from 'react';
import { Student, PageConfig, ThemeColor, CardLayout, LAYOUT_CONFIG } from '../types';

interface ClassGridProps {
  students: Student[];
  config: PageConfig;
}

const ThemeStyles = {
  [ThemeColor.GREEN]: {
    bg_solid: 'bg-emerald-700',
    text_dark: 'text-emerald-900',
    border_color: 'border-emerald-100/30',
    pill_text: 'text-emerald-700',
    pill_border: 'border-emerald-200/50',
  },
  [ThemeColor.BLUE]: {
    bg_solid: 'bg-blue-700',
    text_dark: 'text-blue-900',
    border_color: 'border-blue-100/30',
    pill_text: 'text-blue-700',
    pill_border: 'border-blue-200/50',
  },
  [ThemeColor.RED]: {
    bg_solid: 'bg-red-700',
    text_dark: 'text-red-900',
    border_color: 'border-red-100/30',
    pill_text: 'text-red-700',
    pill_border: 'border-red-200/50',
  },
  [ThemeColor.PURPLE]: {
    bg_solid: 'bg-purple-700',
    text_dark: 'text-purple-900',
    border_color: 'border-purple-100/30',
    pill_text: 'text-purple-700',
    pill_border: 'border-purple-200/50',
  },
  [ThemeColor.BLACK]: {
    bg_solid: 'bg-gray-900',
    text_dark: 'text-gray-900',
    border_color: 'border-gray-400/30',
    pill_text: 'text-gray-800',
    pill_border: 'border-gray-300/50',
  },
  [ThemeColor.CUSTOM]: {
    bg_solid: '',
    text_dark: 'text-gray-900',
    border_color: 'border-gray-300/30',
    pill_text: '',
    pill_border: '',
  }
};

// Layout-specific configurations
const getLayoutStyles = (layout: CardLayout) => {
  switch (layout) {
    case CardLayout.GRID_2X2:
      return {
        gridClass: 'grid-cols-2 grid-rows-2',
        avatarSize: 'w-[5rem] h-[5rem]',
        avatarMargin: 'mb-2',
        nameSize: 'text-[0.85rem]',
        gradeSize: 'text-[0.65rem]',
        maxWidth: 'max-w-[9rem]',
        gap: 'gap-x-4 gap-y-4',
      };
    case CardLayout.GRID_3X2:
      return {
        gridClass: 'grid-cols-3 grid-rows-2',
        avatarSize: 'w-[4.2rem] h-[4.2rem]',
        avatarMargin: 'mb-1.5',
        nameSize: 'text-[0.75rem]',
        gradeSize: 'text-[0.6rem]',
        maxWidth: 'max-w-[8rem]',
        gap: 'gap-x-3 gap-y-3',
      };
    case CardLayout.GRID_3X3:
    default:
      return {
        gridClass: 'grid-cols-3 grid-rows-3',
        avatarSize: 'w-[3.8rem] h-[3.8rem]',
        avatarMargin: 'mb-1.5',
        nameSize: 'text-[0.7rem]',
        gradeSize: 'text-[0.55rem]',
        maxWidth: 'max-w-[7.25rem]',
        gap: 'gap-x-2.5 gap-y-2.5',
      };
  }
};

export const ClassGrid = forwardRef<HTMLDivElement, ClassGridProps>(({ students, config }, ref) => {
  const theme = ThemeStyles[config.themeColor];
  const layout = config.cardLayout || CardLayout.GRID_3X3;
  const layoutConfig = LAYOUT_CONFIG[layout];
  const layoutStyles = getLayoutStyles(layout);
  const maxSlots = layoutConfig.max;
  const slots = [...students].slice(0, maxSlots);
  const isDark = config.darkCardMode;

  // Background
  const showImage = !!config.backgroundImageUrl;
  const showOverlay = !showImage || config.enableThemeOverlay;
  const showBlur = config.enableBackgroundBlur;

  // Custom Colors
  const isCustom = config.themeColor === ThemeColor.CUSTOM;
  const customBaseColor = config.customThemeColor || '#000000';
  const customAccentColor = config.useSingleCustomColor
    ? customBaseColor
    : (config.customAccentColor || customBaseColor);
  const useAccents = config.applyThemeToAccents;
  const headerTextColor = config.headerTitleColor || (useAccents ? (isCustom ? customAccentColor : undefined) : undefined);
  const footerTitleColor = config.footerTitleColor || '#ffffff';
  const subtitleColor = config.subtitleColor || (useAccents ? (isCustom ? customAccentColor : undefined) : undefined);

  const backgroundStyle = isCustom && !showImage
    ? { backgroundColor: customBaseColor }
    : {};

  const overlayStyle = isCustom && showOverlay && showImage
    ? { backgroundColor: customBaseColor }
    : {};

  // Minimal styles
  const pillContainerStyle = isCustom && useAccents ? { borderColor: `${customAccentColor}40` } : {};
  const pillTextStyle = isCustom && useAccents ? { color: customAccentColor } : {};
  const studentNameStyle = isCustom && useAccents ? { color: customAccentColor } : {};

  return (
    <div
      ref={ref}
      className="relative w-full aspect-instagram flex flex-col p-5 overflow-hidden"
      style={{ minWidth: '400px', maxWidth: '400px' }}
    >
      {/* BACKGROUND */}
      {showImage && (
        <div className="absolute inset-0 z-0">
          <img
            src={config.backgroundImageUrl!}
            alt="Background"
            className="w-full h-full object-cover"
            style={{
              filter: showBlur ? 'blur(4px)' : 'none',
              transform: showBlur ? 'scale(1.05)' : 'none',
            }}
          />
        </div>
      )}

      {/* Theme Overlay */}
      <div
        className={`absolute inset-0 z-0 transition-opacity duration-300
          ${!isCustom ? theme.bg_solid : ''}
          ${!showImage ? 'opacity-100' : (showOverlay ? 'opacity-85' : 'opacity-0')}
        `}
        style={showImage ? overlayStyle : backgroundStyle}
      />

      {/* Subtle gradient */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/5 via-transparent to-black/20 pointer-events-none" />

      {/* HEADER */}
      <div className="h-[72px] flex-shrink-0 z-10 flex flex-col items-center justify-center gap-2">
        {/* Title - Neulis font */}
        <h1
          className="font-display font-bold text-xl tracking-normal"
          style={{
            color: headerTextColor || '#ffffff',
          }}
        >
          {config.schoolName || 'Escola'}
        </h1>

        {/* Gradient line */}
        <div className="w-24 h-1 rounded-full bg-gradient-to-r from-emerald-400 via-yellow-400 to-orange-400" />
      </div>

      {/* MAIN CARD - Liquid Glass */}
      <div className={`flex-1 min-h-0 backdrop-blur-2xl rounded-3xl overflow-hidden p-4 relative z-10 ring-1 ${isDark
        ? 'bg-black/40 ring-white/10'
        : 'bg-white/60 ring-white/40'
        }`}>

        {/* Subtle inner glow */}
        <div className={`absolute inset-0 rounded-3xl pointer-events-none ${isDark
          ? 'shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
          : 'shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]'
          }`} />

        <div className={`grid ${layoutStyles.gridClass} auto-rows-fr ${layoutStyles.gap} h-full place-items-center relative z-10`}>
          {slots.map((student) => (
            <div key={student.id} className="flex flex-col items-center">
              {/* Avatar */}
              <div className={`${layoutStyles.avatarSize} ${layoutStyles.avatarMargin} relative`}>
                <div className={`w-full h-full rounded-full overflow-hidden ring-2 ${isDark
                  ? 'ring-white/20 bg-gray-800'
                  : 'ring-white/60 bg-white'
                  }`}>
                  {student.imageUrl ? (
                    <img
                      src={student.imageUrl}
                      alt={student.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-300'
                      }`}>
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Name & Grade */}
              <div className={`text-center w-full px-0.5 ${layoutStyles.maxWidth}`}>
                <h2
                  className={`${layoutStyles.nameSize} font-semibold leading-tight mb-0.5 truncate ${isDark
                    ? 'text-white'
                    : (useAccents && !isCustom ? theme.text_dark : 'text-gray-800')
                    }`}
                  style={isDark ? {} : studentNameStyle}
                >
                  {student.name || 'Nome do Aluno'}
                </h2>
                <p className={`${layoutStyles.gradeSize} font-normal truncate ${isDark ? 'text-white/60' : 'text-gray-500'
                  }`}>
                  {student.grade || 'Série / Curso'}
                </p>
              </div>
            </div>
          ))}

          {/* Spacers */}
          {Array.from({ length: Math.max(0, maxSlots - slots.length) }).map((_, i) => (
            <div key={`empty-${i}`} className={layoutStyles.avatarSize} />
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="pt-5 pb-2 z-10 flex items-center justify-center gap-2.5">
        {/* Logo */}
        {config.logoUrl && (
          <img src={config.logoUrl} alt="Logo" className="w-7 h-7 object-contain" />
        )}

        {/* Footer Title - Neulis font */}
        <h3
          className="font-display font-semibold text-sm tracking-wide"
          style={{ color: footerTitleColor, textShadow: '0 2px 6px rgba(0,0,0,0.4)' }}
        >
          {config.footerTitle || 'Destaques'}
        </h3>

        {/* Subtitle - Refined pill style */}
        {config.footerSubtitle && (
          <div className="flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-full px-2.5 py-1 border border-white/20">
            <span className="font-display text-[10px] text-white/90 font-normal tracking-wide">
              {config.footerSubtitle}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

ClassGrid.displayName = 'ClassGrid';
