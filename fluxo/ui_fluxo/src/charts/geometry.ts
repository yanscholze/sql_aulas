export function domain(values: number[], zero = true) {
  const finite = values.filter(Number.isFinite);
  let min = Math.min(...finite, 0),
    max = Math.max(...finite, 0);
  if (!zero && finite.length) {
    min = Math.min(...finite);
    max = Math.max(...finite);
  }
  const range = max - min || 1;
  return {
    min: min < 0 ? min - range * 0.08 : min,
    max: max + range * 0.12,
    range: max + range * 0.12 - (min < 0 ? min - range * 0.08 : min) || 1,
  };
}
export function monotone(points: { x: number; y: number }[]) {
  if (!points.length) return "";
  let path = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i];
    const dx = (b.x - a.x) / 3;
    path += ` C${a.x + dx},${a.y} ${b.x - dx},${b.y} ${b.x},${b.y}`;
  }
  return path;
}
