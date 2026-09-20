export const LEVEL_THRESHOLDS = [
  { level: 1, name: 'Caminante', xp: 0 },
  { level: 5, name: 'Senderista', xp: 500 },
  { level: 10, name: 'Explorador', xp: 1500 },
  { level: 20, name: 'Montañero', xp: 4000 },
  { level: 30, name: 'Guardián de Mágina', xp: 8000 },
  { level: 40, name: 'Maestro de la Sierra', xp: 14000 },
  { level: 50, name: 'Leyenda de Mágina', xp: 22000 },
] as const;

export function levelForXp(xp: number) {
  const normalizedXp = Math.max(0, xp);
  return LEVEL_THRESHOLDS.reduce((current, threshold) => threshold.xp <= normalizedXp ? threshold : current, LEVEL_THRESHOLDS[0]);
}

export function progressionForXp(xp: number) {
  const current = levelForXp(xp);
  const next = LEVEL_THRESHOLDS.find((threshold) => threshold.xp > current.xp) ?? null;
  const progress = next
    ? Math.round(((xp - current.xp) / (next.xp - current.xp)) * 100)
    : 100;

  return {
    current,
    next,
    progress: Math.max(0, Math.min(100, progress)),
  };
}
