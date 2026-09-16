export type OliveTreeDashboardActionId =
  | 'rewards'
  | 'customize'
  | 'history'
  | 'achievements';

export interface OliveTreeDashboardAction {
  id: OliveTreeDashboardActionId;
  label: string;
  description: string;
}

export interface OliveTreeDashboardInput {
  treeName: string;
  level: number;
  levelName: string;
  stageName: string;
  progressPercentage: number;
  nextStageName: string | null;
  levelsToNextStage: number | null;
  availableOlives: number;
  reservedOlives: number;
  lifetimeGrantedOlives: number;
  ownedDigitalRewards: number;
}

export interface OliveTreeDashboardModel {
  title: string;
  stageLabel: string;
  levelLabel: string;
  progressPercentage: number;
  availableOlivesLabel: string;
  reservedOlivesLabel: string;
  nextMilestoneLabel: string;
  historyLabel: string;
  collectionLabel: string;
  actions: OliveTreeDashboardAction[];
}

const numberFormatter = new Intl.NumberFormat('es-ES', {
  maximumFractionDigits: 0,
});

const actions: OliveTreeDashboardAction[] = [
  {
    id: 'rewards',
    label: 'Recompensas',
    description: 'Canjea tus aceitunas por objetos y experiencias.',
  },
  {
    id: 'customize',
    label: 'Personalizar',
    description: 'Cambia el ambiente y los detalles de tu olivo.',
  },
  {
    id: 'history',
    label: 'Historia',
    description: 'Recorre el crecimiento permanente de tu olivo.',
  },
  {
    id: 'achievements',
    label: 'Logros',
    description: 'Consulta los hitos conseguidos en Mágina.',
  },
];

function nonNegativeInteger(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}

function formatNumber(value: number): string {
  return numberFormatter.format(nonNegativeInteger(value));
}

function progressPercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

function milestoneLabel(
  nextStageName: string | null,
  levelsToNextStage: number | null,
): string {
  const stage = nextStageName?.trim();

  if (!stage) {
    return 'Etapa máxima alcanzada';
  }

  const levels = nonNegativeInteger(levelsToNextStage ?? 0);
  if (levels <= 0) {
    return `${stage} · próximo hito`;
  }

  return `${stage} · dentro de ${levels} ${levels === 1 ? 'nivel' : 'niveles'}`;
}

export function buildOliveTreeDashboardModel(
  input: OliveTreeDashboardInput,
): OliveTreeDashboardModel {
  const level = Math.max(1, nonNegativeInteger(input.level));
  const treeName = input.treeName.trim();
  const levelName = input.levelName.trim() || 'Progreso de Mágina';
  const stageName = input.stageName.trim() || 'Brote';
  const reserved = nonNegativeInteger(input.reservedOlives);
  const owned = nonNegativeInteger(input.ownedDigitalRewards);

  return {
    title: treeName || 'Mi Olivo',
    stageLabel: stageName,
    levelLabel: `Nivel ${level} · ${levelName}`,
    progressPercentage: progressPercentage(input.progressPercentage),
    availableOlivesLabel: formatNumber(input.availableOlives),
    reservedOlivesLabel:
      reserved > 0 ? `${formatNumber(reserved)} reservadas` : 'Sin reservas',
    nextMilestoneLabel: milestoneLabel(
      input.nextStageName,
      input.levelsToNextStage,
    ),
    historyLabel: `${formatNumber(input.lifetimeGrantedOlives)} 🫒 ganadas en total`,
    collectionLabel: `${formatNumber(owned)} ${owned === 1 ? 'objeto desbloqueado' : 'objetos desbloqueados'}`,
    actions: actions.map((action) => ({ ...action })),
  };
}
