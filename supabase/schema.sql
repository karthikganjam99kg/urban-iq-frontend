-- UrbanIQ Supabase schema.
-- Run this in Supabase Studio -> SQL Editor, then enable Realtime on both tables.

create table if not exists public.traffic_snapshots (
  id uuid primary key default gen_random_uuid(),
  city text not null default 'Hyderabad',
  current_speed numeric,
  free_flow_speed numeric,
  congestion_score numeric,
  congestion_level text,
  confidence numeric,
  road_closure boolean,
  captured_at timestamptz not null default now()
);

create index if not exists traffic_snapshots_captured_at_idx
  on public.traffic_snapshots (captured_at desc);

create table if not exists public.detections (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('pothole', 'garbage', 'vehicle', 'plate')),
  count integer not null default 0,
  confidence numeric,
  meta jsonb,
  detected_at timestamptz not null default now()
);

create index if not exists detections_detected_at_idx
  on public.detections (detected_at desc);

alter table public.traffic_snapshots enable row level security;
alter table public.detections enable row level security;

-- Public demo dashboard: anonymous clients may read history and append new rows,
-- but never update or delete existing records.
create policy "public read traffic" on public.traffic_snapshots
  for select using (true);

create policy "public insert traffic" on public.traffic_snapshots
  for insert with check (true);

create policy "public read detections" on public.detections
  for select using (true);

create policy "public insert detections" on public.detections
  for insert with check (true);

alter publication supabase_realtime add table public.detections;
alter publication supabase_realtime add table public.traffic_snapshots;
