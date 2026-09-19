import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const supabaseEnabled = Boolean(supabase);

// Traffic polls every 5s, but one stored snapshot per minute is enough history.
const SNAPSHOT_INTERVAL_MS = 60_000;
let lastSnapshotAt = 0;

export async function recordTrafficSnapshot(traffic) {
  if (!supabase || !traffic) return;

  const now = Date.now();
  if (now - lastSnapshotAt < SNAPSHOT_INTERVAL_MS) return;
  lastSnapshotAt = now;

  const { error } = await supabase.from("traffic_snapshots").insert({
    city: traffic.city ?? "Hyderabad",
    current_speed: traffic.current_speed,
    free_flow_speed: traffic.free_flow_speed,
    congestion_score: traffic.congestion_score,
    congestion_level: traffic.congestion_level,
    confidence: traffic.confidence,
    road_closure: traffic.road_closure,
  });

  if (error) console.warn("Supabase snapshot failed:", error.message);
}

export async function recordDetection({ kind, count, confidence, meta }) {
  if (!supabase) return;

  const { error } = await supabase.from("detections").insert({
    kind,
    count,
    confidence,
    meta: meta ?? null,
  });

  if (error) console.warn("Supabase detection failed:", error.message);
}

export async function fetchTrafficHistory(limit = 30) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("traffic_snapshots")
    .select("congestion_score, congestion_level, current_speed, captured_at")
    .order("captured_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("Supabase history failed:", error.message);
    return [];
  }

  return (data ?? []).reverse();
}

export async function fetchRecentDetections(limit = 8) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("detections")
    .select("id, kind, count, confidence, detected_at")
    .order("detected_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("Supabase detections failed:", error.message);
    return [];
  }

  return data ?? [];
}

export function subscribeToDetections(onInsert) {
  if (!supabase) return () => {};

  const channel = supabase
    .channel("detections-feed")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "detections" },
      (payload) => onInsert(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
