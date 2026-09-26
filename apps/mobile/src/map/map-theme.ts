import { colors } from '../theme/tokens';
import type { MapThemeId } from './map-layers';

export interface MapThemeConfig {
  id: MapThemeId;
  name: string;
  description: string;
  backgroundColor: string;
  trackColor: string;
  trackWidth: number;
  trackGlowColor: string;
  checkpointColor: string;
  checkpointBorderColor: string;
  poiColors: Record<string, string>;
  parkBoundaryFill: string;
  parkBoundaryLine: string;
  hikerColor: string;
  cardBackground: string;
  textColor: string;
}

export const MAP_THEMES: Record<MapThemeId, MapThemeConfig> = {
  olive: {
    id: 'olive',
    name: 'Sierra Mágina (Oliva)',
    description: 'Paleta natural basada en olivares, caliza y sol de Jaén',
    backgroundColor: colors.limestone,
    trackColor: colors.olive700,
    trackWidth: 5,
    trackGlowColor: 'rgba(71, 106, 69, 0.25)',
    checkpointColor: colors.aoveGold,
    checkpointBorderColor: colors.white,
    poiColors: {
      flora: '#4A7C59',
      fauna: '#D97706',
      heritage: '#8A6648',
      olive: '#65A30D',
      tradition: '#B91C1C',
      landscape: '#2563EB',
    },
    parkBoundaryFill: 'rgba(120, 154, 100, 0.12)',
    parkBoundaryLine: colors.olive500,
    hikerColor: '#E11D48',
    cardBackground: colors.white,
    textColor: colors.ink,
  },

  topo: {
    id: 'topo',
    name: 'Topográfico Clásico',
    description: 'Estilo plano técnico militar y senderista de alta legibilidad',
    backgroundColor: '#FDFBF7',
    trackColor: '#B85042',
    trackWidth: 6,
    trackGlowColor: 'rgba(184, 80, 66, 0.2)',
    checkpointColor: '#2C3531',
    checkpointBorderColor: '#FFFFFF',
    poiColors: {
      flora: '#116466',
      fauna: '#D9B48F',
      heritage: '#2C3531',
      olive: '#A2C523',
      tradition: '#B85042',
      landscape: '#4E6E58',
    },
    parkBoundaryFill: 'rgba(17, 100, 102, 0.10)',
    parkBoundaryLine: '#116466',
    hikerColor: '#E76F51',
    cardBackground: '#FFFFFF',
    textColor: '#1A252C',
  },

  satellite: {
    id: 'satellite',
    name: 'Satélite & Relieve',
    description: 'Capa híbrida contrastada para exploración en exterior intenso',
    backgroundColor: '#1E293B',
    trackColor: '#39FF14',
    trackWidth: 6,
    trackGlowColor: 'rgba(57, 255, 20, 0.4)',
    checkpointColor: '#00F0FF',
    checkpointBorderColor: '#0F172A',
    poiColors: {
      flora: '#00FF9D',
      fauna: '#FFB800',
      heritage: '#FF007A',
      olive: '#9DFF00',
      tradition: '#FF5500',
      landscape: '#00E5FF',
    },
    parkBoundaryFill: 'rgba(0, 240, 255, 0.15)',
    parkBoundaryLine: '#00F0FF',
    hikerColor: '#FF0055',
    cardBackground: '#0F172A',
    textColor: '#F8FAFC',
  },

  night: {
    id: 'night',
    name: 'Nocturno Estelar',
    description: 'Diseño para baja luminosidad, observación astronómica y rutas nocturnas',
    backgroundColor: '#090D16',
    trackColor: '#10B981',
    trackWidth: 5,
    trackGlowColor: 'rgba(16, 185, 129, 0.35)',
    checkpointColor: '#F59E0B',
    checkpointBorderColor: '#090D16',
    poiColors: {
      flora: '#34D399',
      fauna: '#FBBF24',
      heritage: '#F472B6',
      olive: '#A3E635',
      tradition: '#FB923C',
      landscape: '#38BDF8',
    },
    parkBoundaryFill: 'rgba(16, 185, 129, 0.08)',
    parkBoundaryLine: '#059669',
    hikerColor: '#EC4899',
    cardBackground: '#111827',
    textColor: '#F3F4F6',
  },
};

export function getMapTheme(themeId: MapThemeId): MapThemeConfig {
  return MAP_THEMES[themeId] ?? MAP_THEMES.olive;
}
