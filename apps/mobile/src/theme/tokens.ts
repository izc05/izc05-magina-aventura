export const colors = {
  olive900: '#203A2B',
  olive700: '#476A45',
  olive500: '#789A64',
  aoveGold: '#C89A3D',
  earth: '#8A6648',
  limestone: '#E7E1D4',
  warmBackground: '#F7F4ED',
  ink: '#172019',
  sky: '#8FB8C8',
  white: '#FFFFFF',
  muted: '#6B746D',
  border: '#DDD6C8',
} as const;

export const spacing = {
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
  40: 40,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
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
} as const;
