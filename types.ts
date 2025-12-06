export interface Student {
  id: string;
  name: string;
  grade: string;
  imageUrl: string | null;
  year?: string;
  course?: string;
}

export interface PageConfig {
  schoolName: string;
  footerTitle: string;
  footerSubtitle: string;
  themeColor: ThemeColor;
  customThemeColor?: string;
  customAccentColor?: string;
  useSingleCustomColor: boolean;
  headerTitleColor?: string;
  footerTitleColor?: string;
  subtitleColor?: string;
  logoUrl?: string | null;
  backgroundImageUrl?: string | null;
  enableThemeOverlay: boolean;
  enableBackgroundBlur: boolean;
  applyThemeToAccents: boolean;
  cardLayout: CardLayout;
  darkCardMode: boolean;
  // Grid container background customization
  gridBackgroundColor?: string;
  gridBackgroundOpacity?: number;
  gridBackgroundPattern?: 'none' | 'dots' | 'grid' | 'diagonal' | 'radial';
  gridTintWithTheme?: boolean;
}

export enum ThemeColor {
  GREEN = 'green',
  BLUE = 'blue',
  RED = 'red',
  PURPLE = 'purple',
  BLACK = 'black',
  CUSTOM = 'custom',
}

export enum CardLayout {
  GRID_2X2 = '2x2',
  GRID_3X2 = '3x2',
  GRID_3X3 = '3x3',
}

export const LAYOUT_CONFIG = {
  [CardLayout.GRID_2X2]: { cols: 2, rows: 2, max: 4, label: '2×2 (4 alunos)' },
  [CardLayout.GRID_3X2]: { cols: 3, rows: 2, max: 6, label: '3×2 (6 alunos)' },
  [CardLayout.GRID_3X3]: { cols: 3, rows: 3, max: 9, label: '3×3 (9 alunos)' },
};

export interface FilterState {
  year: string | null;
  course: string | null;
}

export const SCHOOL_YEARS = ['1º', '2º', '3º'];

export const SCHOOL_COURSES = [
  'Administração',
  'Comércio',
  'Finanças',
  'Fruticultura',
  'Agronegócio',
  'Redes de Computadores',
  'Desenv. de Sistemas',
];
