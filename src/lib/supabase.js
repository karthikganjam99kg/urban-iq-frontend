import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const supabaseEnabled = Boolean(supabase);

const KIND_TO_DAMAGE = {
  pothole: "pothole",
  garbage: "garbage",
  vehicle: "vehicle_cluster",
  plate: "plate",
};

function asPercent(value) {
  if (typeof value !== "number") return null;
  return value <= 1 ? value * 100 : value;
}

export async function recordTrafficSnapshot() {
  // traffic_realtime is written by the Flask API with the service role.
}

export async function recordDetection({ kind, count, confidence }) {
  if (!supabase) return;

  const { error } = await supabase.from("road_damage").insert({
    detection_id: `UIQ-${kind}-${Date.now()}`,
    damage_type: KIND_TO_DAMAGE[kind] ?? kind,
    confidence: asPercent(confidence) ?? count ?? 0,
    source: `UrbanIQ-web:${count ?? 0}`,
    status: "DETECTED",
  });

  if (error) console.warn("Supabase detection failed:", error.message);
}

function normalizeDamageRow(row) {
  const source = row.source ?? "";
  const countMatch = /:(\d+)$/.exec(source);
  const kind = (row.damage_type ?? "pothole").replace("vehicle_cluster", "vehicle");
  return {
    id: `road_damage-${row.id}`,
    kind,
    count: countMatch ? Number(countMatch[1]) : 1,
    confidence: asPercent(Number(row.confidence)),
    detected_at: row.timestamp ?? row.created_at,
  };
}

export async function fetchRecentDetections(limit = 8) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("road_damage")
    .select("id, damage_type, confidence, source, timestamp, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("Supabase detections failed:", error.message);
    return [];
  }

  return (data ?? []).map(normalizeDamageRow);
}

export function subscribeToDetections(onInsert) {
  if (!supabase) return () => {};

  const channel = supabase
    .channel("road-damage-feed")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "road_damage" },
      (payload) => onInsert(normalizeDamageRow(payload.new))
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
