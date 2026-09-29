export type DiscoveryCategory =
  | 'Historia'
  | 'Naturaleza'
  | 'Fauna'
  | 'Flora'
  | 'Geología'
  | 'Patrimonio'
  | 'Secreto'
  | 'Mirador';

export interface MockDiscovery {
  id: string;
  category: DiscoveryCategory;
  title: string;
  description: string;
  xp: number;
  icon: string;
}

export interface MockCheckpoint {
  id: string;
  title: string;
  subtitle: string;
}

export interface MockRouteStep {
  id: string;
  label: string;
  kind: 'start' | 'checkpoint' | 'discovery' | 'reward' | 'finish';
}

export const MOCK_ROUTE = {
  id: 'demo-maginas-secret',
  title: 'El secreto de Mágina',
  subtitle: 'Ruta piloto ficticia · solo para QA',
  disclosure: 'MOCK / DEMO FICTICIO — este recorrido y todos sus relatos son inventados para probar la interfaz. No representan hechos históricos ni recomendaciones de senderismo.',
  checkpoints: [
    { id: 'gate', title: 'Umbral de piedra', subtitle: 'Checkpoint de demostración' },
    { id: 'ridge', title: 'Loma de la bruma', subtitle: 'Checkpoint de demostración' },
    { id: 'summit', title: 'Mirador del horizonte', subtitle: 'Checkpoint final de demostración' },
  ] satisfies MockCheckpoint[],
  steps: [
    { id: 'start', label: 'Inicio', kind: 'start' },
    { id: 'gate', label: 'Checkpoint 1', kind: 'checkpoint' },
    { id: 'fern', label: 'Descubrimiento natural', kind: 'discovery' },
    { id: 'ridge', label: 'Checkpoint 2', kind: 'checkpoint' },
    { id: 'echo', label: 'Relato ficticio', kind: 'discovery' },
    { id: 'vista', label: 'Mirador demo', kind: 'discovery' },
    { id: 'secret', label: 'Secreto demo', kind: 'discovery' },
    { id: 'summit', label: 'Checkpoint final', kind: 'checkpoint' },
    { id: 'reward', label: 'Recompensa', kind: 'finish' },
  ] satisfies MockRouteStep[],
} as const;

export const MOCK_DISCOVERIES: readonly MockDiscovery[] = [
  {
    id: 'fern',
    category: 'Naturaleza',
    title: 'El helecho de la sombra',
    description: 'Una escena botánica ficticia creada para probar una tarjeta de descubrimiento.',
    xp: 100,
    icon: '❧',
  },
  {
    id: 'echo',
    category: 'Historia',
    title: 'El eco del molino',
    description: 'Relato completamente inventado para QA; no es una afirmación histórica real.',
    xp: 100,
    icon: '◌',
  },
  {
    id: 'vista',
    category: 'Mirador',
    title: 'Ventana al horizonte',
    description: 'Punto panorámico ficticio de la ruta demo, sin coordenadas ni indicaciones reales.',
    xp: 100,
    icon: '⌁',
  },
  {
    id: 'secret',
    category: 'Secreto',
    title: 'La piedra que guarda silencio',
    description: 'Secreto narrativo inventado para comprobar la recompensa especial.',
    xp: 200,
    icon: '✦',
  },
  {
    id: 'feather',
    category: 'Fauna',
    title: 'Huellas entre la niebla',
    description: 'Escena de fauna ficticia para QA; no identifica especies ni señales reales.',
    xp: 100,
    icon: '⌁',
  },
  {
    id: 'leaf',
    category: 'Flora',
    title: 'La hoja viajera',
    description: 'Elemento botánico imaginario, sin valor de guía de campo.',
    xp: 100,
    icon: '❧',
  },
  {
    id: 'stone',
    category: 'Geología',
    title: 'El círculo mineral',
    description: 'Formación de fantasía utilizada únicamente como contenido de interfaz demo.',
    xp: 100,
    icon: '◈',
  },
  {
    id: 'arch',
    category: 'Patrimonio',
    title: 'El arco imaginado',
    description: 'Elemento patrimonial inventado; no describe un bien cultural existente.',
    xp: 100,
    icon: '⌂',
  },
];

export const MOCK_BADGES = [
  { id: 'first-adventure', title: 'Primera aventura', description: 'Insignia de prueba', icon: '⌖' },
  { id: 'first-discovery', title: 'Primer descubrimiento', description: 'Insignia de prueba', icon: '✧' },
  { id: 'five-routes', title: 'Cinco rutas', description: 'Insignia de prueba', icon: '△' },
  { id: 'magina-explorer', title: 'Explorador de Mágina', description: 'Insignia de prueba', icon: '◈' },
  { id: 'naturalist', title: 'Naturalista', description: 'Insignia de prueba', icon: '❧' },
  { id: 'historian', title: 'Historiador', description: 'Insignia de prueba', icon: '◌' },
  { id: 'secret-hunter', title: 'Cazador de secretos', description: 'Insignia de prueba', icon: '✦' },
] as const;

export const MOCK_CHALLENGES = [
  { id: 'first-trail', title: 'Abre el sendero', description: 'Reto de interfaz simulado' },
  { id: 'spot-the-secret', title: 'Busca lo inesperado', description: 'Reto de interfaz simulado' },
] as const;

export const MOCK_COLLECTIBLES = [
  { id: 'olive-leaf', title: 'Hoja de olivo', family: 'Coleccionable ficticio', icon: '❧' },
  { id: 'stone-mark', title: 'Marca de piedra', family: 'Coleccionable ficticio', icon: '◈' },
] as const;
