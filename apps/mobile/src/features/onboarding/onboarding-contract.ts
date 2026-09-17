export const ONBOARDING_STORAGE_KEY = 'magina_onboarding_seen_v1' as const;

export type OnboardingSlideId = 'welcome' | 'routes' | 'discover' | 'rewards';

export type OnboardingSlide = Readonly<{
  id: OnboardingSlideId;
  title: string;
  body: string;
}>;

export const onboardingSlides: readonly OnboardingSlide[] = [
  {
    id: 'welcome',
    title: 'Bienvenido a Mágina Aventura',
    body: 'Explora rutas reales por Sierra Mágina con una experiencia que convierte cada recorrido en una aventura.',
  },
  {
    id: 'routes',
    title: 'Descubre rutas',
    body: 'Busca senderos, conoce su distancia, desnivel y dificultad y prepara tu aventura antes de salir.',
  },
  {
    id: 'discover',
    title: 'Camina y desbloquea',
    body: 'Sigue el recorrido con GPS y descubre patrimonio, naturaleza y lugares especiales mientras avanzas.',
  },
  {
    id: 'rewards',
    title: 'Construye tu progreso',
    body: 'Esta beta valida rutas y GPS. XP, aceitunas y recompensas se activarán después de validar cada actividad.',
  },
] as const;

export type FirstLaunchDestination = '/onboarding' | '/';

export function resolveFirstLaunchDestination(seen: boolean): FirstLaunchDestination {
  return seen ? '/' : '/onboarding';
}
