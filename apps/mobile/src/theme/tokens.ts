export const colors = {
  olive900: '#2F4A2E',
  olive700: '#526A45',
  olive500: '#7D9366',
  aoveGold: '#D4AF37',
  earth: '#8A6648',
  limestone: '#E7E1D6',
  warmBackground: '#FAF9F6',
  ink: '#172019',
  sky: '#7FB3D9',
  white: '#FFFFFF',
  muted: '#6B746D',
  border: '#E5DED2',
  oliveWash: '#EEF1E8',
  goldWash: '#F6EFD8',
} as const;

export const spacing = {
  4: 4,
  8: 8,
  10: 10,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  28: 28,
  32: 32,
  40: 40,
  48: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 30,
  pill: 999,
} as const;

export const typography = {
  display: 32,
  title: 24,
  section: 20,
  body: 16,
  caption: 13,
  metric: 15,
} as const;

export const shadow = {
  card: {
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  floating: {
    shadowColor: colors.ink,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
} as const;
