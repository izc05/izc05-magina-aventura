export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function sceneState(progress, sceneIndex, sceneCount) {
  const count = Math.max(1, sceneCount);
  const segment = 1 / count;
  const start = sceneIndex * segment;
  const local = clamp((progress - start) / segment);
  const center = start + segment / 2;
  const distance = Math.abs(progress - center) / segment;
  let visibility = clamp(1 - Math.max(0, distance - 0.15) * 1.7);

  if (sceneIndex === 0 && progress <= center) visibility = 1;
  if (sceneIndex === count - 1 && progress >= center) visibility = 1;

  const active = progress >= start && (sceneIndex === count - 1 ? progress <= 1 : progress < start + segment);
  return { local, visibility, active };
}

export function layerTransform(localProgress, depth, compact) {
  const p = clamp(localProgress);
  const d = Math.max(0, Number(depth) || 0);
  const centered = p - 0.5;
  const travel = compact ? 42 : 82;
  const horizontal = compact ? 6 : 14;
  const zoom = compact ? 0.022 : 0.045;
  return {
    translateY: centered * travel * d,
    translateX: centered * horizontal * d,
    scale: 1 + p * zoom * d,
  };
}
