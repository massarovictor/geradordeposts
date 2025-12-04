
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
    border_color: 'border-emerald-100/50',
    pill_text: 'text-emerald-700',
    pill_border: 'border-emerald-200',
    pill_dot: 'bg-emerald-500',
  },
  [ThemeColor.BLUE]: {
    bg_solid: 'bg-blue-700',
    text_dark: 'text-blue-900',
    border_color: 'border-blue-100/50',
    pill_text: 'text-blue-700',
    pill_border: 'border-blue-200',
    pill_dot: 'bg-blue-500',
  },
  [ThemeColor.RED]: {
    bg_solid: 'bg-red-700',
    text_dark: 'text-red-900',
    border_color: 'border-red-100/50',
    pill_text: 'text-red-700',
    pill_border: 'border-red-200',
    pill_dot: 'bg-red-500',
  },
  [ThemeColor.PURPLE]: {
    bg_solid: 'bg-purple-700',
    text_dark: 'text-purple-900',
    border_color: 'border-purple-100/50',
    pill_text: 'text-purple-700',
    pill_border: 'border-purple-200',
    pill_dot: 'bg-purple-500',
  },
  [ThemeColor.BLACK]: {
    bg_solid: 'bg-gray-900',
    text_dark: 'text-gray-900',
    border_color: 'border-gray-500/50',
    pill_text: 'text-gray-900',
    pill_border: 'border-gray-300',
    pill_dot: 'bg-gray-900',
  },
  [ThemeColor.CUSTOM]: {
    bg_solid: '',
    text_dark: 'text-gray-900',
    border_color: 'border-gray-300/50',
    pill_text: '',
    pill_border: '',
    pill_dot: '',
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
        nameSize: 'text-[0.9rem]',
        gradeSize: 'text-[0.7rem]',
        maxWidth: 'max-w-[9rem]',
        gap: 'gap-x-4 gap-y-4',
      };
    case CardLayout.GRID_3X2:
      return {
        gridClass: 'grid-cols-3 grid-rows-2',
        avatarSize: 'w-[4.2rem] h-[4.2rem]',
        avatarMargin: 'mb-1.5',
        nameSize: 'text-[0.8rem]',
        gradeSize: 'text-[0.65rem]',
        maxWidth: 'max-w-[8rem]',
        gap: 'gap-x-3 gap-y-3',
      };
    case CardLayout.GRID_3X3:
    default:
      return {
        gridClass: 'grid-cols-3 grid-rows-3',
        avatarSize: 'w-[3.8rem] h-[3.8rem]',
        avatarMargin: 'mb-1.5',
        nameSize: 'text-[0.75rem]',
        gradeSize: 'text-[0.6rem]',
        maxWidth: 'max-w-[7.25rem]',
        gap: 'gap-x-2.5 gap-y-3',
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

  // Determine Background Logic
  const showImage = !!config.backgroundImageUrl;
  const showOverlay = !showImage || config.enableThemeOverlay;
  const showBlur = config.enableBackgroundBlur;

  // Custom Color Logic
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

  // Styles for the new Pill design
  const pillContainerStyle = isCustom && useAccents ? { borderColor: customAccentColor } : {};
  const pillTextStyle = isCustom && useAccents ? { color: customAccentColor } : {};
  const pillDotStyle = isCustom && useAccents ? { backgroundColor: customAccentColor } : {};
  const studentNameStyle = isCustom && useAccents ? { color: customAccentColor } : {};
  const neutralBorder = 'border-gray-200/70';
  const neutralPillBorder = 'border-gray-200';
  const neutralPillText = 'text-gray-700';
  const neutralPillDot = 'bg-gray-300';

  return (
    <div
      ref={ref}
      className={`relative w-full aspect-instagram flex flex-col p-6 overflow-hidden`}
      style={{ minWidth: '400px', maxWidth: '400px' }}
    >
      {/* BACKGROUND LAYERS */}

      {/* 1. Base Image (if exists) */}
      {showImage && (
        <div className="absolute inset-0 z-0">
          <img
            src={config.backgroundImageUrl!}
            alt="Background"
            className={`w-full h-full object-cover transform scale-105 ${showBlur ? 'blur-[2px]' : ''}`}
          />
        </div>
      )}

      {/* 2. Theme Color Overlay */}
      <div
        className={`absolute inset-0 z-0 transition-opacity duration-300
          ${!isCustom ? theme.bg_solid : ''}
          ${!showImage ? 'opacity-100' : (showOverlay ? 'opacity-90 mix-blend-multiply' : 'opacity-0')}
        `}
        style={showImage ? overlayStyle : backgroundStyle}
      ></div>

      {/* 3. Subtle Vignette */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/10 via-transparent to-black/30 pointer-events-none"></div>


      {/* CONTENT */}

      {/* Header: Logo & School Name (side by side) */}
      <div className="h-[72px] flex-shrink-0 text-center z-10 flex items-center justify-center gap-3 relative">
        {config.logoUrl && (
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center p-1.5 backdrop-blur-md shadow-lg ring-1 ring-white/40">
            <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain drop-shadow-sm" />
          </div>
        )}

        {/* NEW PILL DESIGN: White bg, Color Border, Color Dot, Color Text */}
        <div
          className={`inline-flex items-center gap-2.5 bg-white rounded-full px-5 py-2 shadow-sm border ${useAccents && !isCustom ? theme.pill_border : neutralPillBorder
            }`}
          style={pillContainerStyle}
        >
          {/* Dot */}
          <div
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${useAccents && !isCustom ? theme.pill_dot : neutralPillDot}`}
            style={pillDotStyle}
          ></div>
          {/* Text - Regular weight (font-medium) */}
          <h1
            className={`font-medium text-sm leading-none tracking-wide ${useAccents && !isCustom ? theme.pill_text : neutralPillText}`}
            style={{ ...pillTextStyle, ...(headerTextColor ? { color: headerTextColor } : {}) }}
          >
            {config.schoolName || 'Escola'}
          </h1>
        </div>
      </div>

      {/* Center Liquid Glass Card */}
      <div className="flex-1 min-h-0 bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.4)] overflow-hidden px-4 py-4 relative z-10 border border-white/60 ring-1 ring-black/5">

        {/* Shine effect on top right */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/50 rounded-full blur-3xl pointer-events-none mix-blend-soft-light"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/40 rounded-full blur-2xl pointer-events-none mix-blend-soft-light"></div>

        {/* Inner Border */}
        <div className={`absolute inset-3 border ${useAccents && !isCustom ? theme.border_color : neutralBorder} rounded-[1.5rem] pointer-events-none opacity-50`}></div>

        <div className={`grid ${layoutStyles.gridClass} auto-rows-fr ${layoutStyles.gap} h-full place-items-center relative z-10`}>
          {slots.map((student) => (
            <div key={student.id} className="flex flex-col items-center group">
              {/* Image Container */}
              <div className={`${layoutStyles.avatarSize} ${layoutStyles.avatarMargin} relative group-hover:scale-105 transition-transform duration-300`}>
                <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-white shadow-lg bg-gray-50 relative z-10">
                  {student.imageUrl ? (
                    <img
                      src={student.imageUrl}
                      alt={student.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  )}
                </div>
                {/* Shadow below avatar */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-2 bg-black/20 blur-md rounded-full"></div>
              </div>

              {/* Text Info */}
              <div className={`text-center w-full px-0.5 ${layoutStyles.maxWidth}`}>
                <h2
                  className={`${layoutStyles.nameSize} font-bold leading-tight mb-0.5 truncate ${useAccents && !isCustom ? theme.text_dark : ''}`}
                  style={studentNameStyle}
                >
                  {student.name || 'Nome do Aluno'}
                </h2>
                <p className={`${layoutStyles.gradeSize} font-medium text-gray-500 truncate`}>
                  {student.grade || 'Série / Curso'}
                </p>
              </div>
            </div>
          ))}

          {/* Spacers for alignment */}
          {Array.from({ length: Math.max(0, maxSlots - slots.length) }).map((_, i) => (
            <div key={`empty-${i}`} className={layoutStyles.avatarSize}></div>
          ))}
        </div>
      </div>

      {/* Footer: Row Layout with Pill */}
      <div className="pt-6 pb-2 z-10 relative flex items-center justify-center gap-3">
        {/* Title - Plain Text with Shadow - Regular weight (font-medium) */}
        <h3
          className="font-medium text-[0.75rem] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] tracking-wide"
          style={{ color: footerTitleColor }}
        >
          {config.footerTitle || 'Destaques'}
        </h3>

        {/* Subtitle - New Pill Design - Regular weight (font-medium) */}
        {config.footerSubtitle && (
          <div
            className={`inline-flex items-center gap-1.5 bg-white rounded-full px-3 py-1 shadow-sm border ${useAccents && !isCustom ? theme.pill_border : neutralPillBorder
              }`}
            style={pillContainerStyle}
          >
            {/* Dot */}
            <div
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${useAccents && !isCustom ? theme.pill_dot : neutralPillDot}`}
              style={pillDotStyle}
            ></div>
            <p
              className={`text-[0.6rem] font-medium leading-none ${useAccents && !isCustom ? theme.pill_text : neutralPillText}`}
              style={{ ...pillTextStyle, ...(subtitleColor ? { color: subtitleColor } : {}) }}
            >
              {config.footerSubtitle}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

ClassGrid.displayName = 'ClassGrid';
