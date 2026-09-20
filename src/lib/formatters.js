export function describeBaseline(result) {
  const baseline = result.baseline;
  if (!baseline) {
    return result.baseline_vehicle_count == null
      ? "no observed baseline"
      : `observed baseline ${result.baseline_vehicle_count}`;
  }
  if (baseline.status === "live") {
    const frames = baseline.sample_size === 1 ? "frame" : "frames";
    return `recent camera average ${baseline.vehicle_count} vehicles/frame (${baseline.sample_size} ${frames})`;
  }
  if (baseline.status === "stale") {
    return `last observed ${baseline.vehicle_count} vehicles/frame, ${baseline.age_minutes} min old`;
  }
  return "no camera observations recorded yet";
}

export function getDetectionBox(detection) {
  if (!Array.isArray(detection?.box) || detection.box.length !== 4) return null;
  const box = detection.box.map(Number);
  return box.every(Number.isFinite) ? box : null;
}

export function formatDetectionCount(kind, count) {
  const numericCount = Number(count);
  if (kind === "garbage") {
    return `${numericCount} garbage ${numericCount === 1 ? "item" : "items"}`;
  }
  return `${numericCount} ${kind}${numericCount === 1 ? "" : "s"}`;
}
