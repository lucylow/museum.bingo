export const colors = {
  bg: '#070A14',
  bgElevated: '#11182C',
  bgCard: '#15203A',
  bgMuted: '#223052',
  textPrimary: '#F8FAFF',
  textSecondary: '#B7C4E4',
  textMuted: '#8794B3',
  borderSoft: '#2C3E69',
  borderStrong: '#4667AD',
  accent: '#53D0FF',
  accentWarm: '#FFB056',
  accentSuccess: '#61E294',
  accentWarning: '#FFD166',
  accentDanger: '#FF6B6B',
  info: '#8AB4FF',
  overlayDark: 'rgba(5, 9, 20, 0.74)',
  glowCyan: 'rgba(83, 208, 255, 0.42)',
  glowWarm: 'rgba(255, 176, 86, 0.36)',
  confettiPink: '#FF6EC7',
  confettiBlue: '#7FDBFF',
  confettiGold: '#FFD166',
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
};

export const typography = {
  hero: 34,
  title: 26,
  subtitle: 20,
  body: 15,
  caption: 12,
  overline: 11,
};

export const elevation = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    elevation: 12,
  },
};

export const motion = {
  quick: 160,
  normal: 240,
  slow: 420,
};

export const appTheme = {
  colors,
  spacing,
  radius,
  typography,
  elevation,
  motion,
} as const;

export type AppTheme = typeof appTheme;
