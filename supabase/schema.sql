-- UrbanIQ maps onto the EXISTING public schema. Do not create
-- traffic_snapshots / detections — they collide with tables already in use.
--
-- Existing tables
--   traffic_realtime   TomTom flow (written by Flask with the secret key)
--   road_damage        pothole / garbage / vehicle detections (browser insert OK)
--   road_damage_events hazard events (RLS blocks anon insert)
--   vehicle_density    per-frame vehicle counts (RLS blocks anon)
--   ai_incidents       rash-motion / plate candidates (RLS blocks anon)
--   incidents          civic incidents (RLS blocks anon)
--   buses              fleet positions (anon can insert — keep this locked down)
--
-- Optional: let the browser also read traffic history directly.
-- create policy "anon read traffic_realtime" on public.traffic_realtime
--   for select using (true);

create index if not exists traffic_realtime_recorded_at_idx
  on public.traffic_realtime (recorded_at desc);

create index if not exists road_damage_created_at_idx
  on public.road_damage (created_at desc);
