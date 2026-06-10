-- Settings table for phase-based round control
create table if not exists settings (
  key   text primary key,
  value jsonb not null
);

alter table settings enable row level security;

-- Anyone can read settings (needed for predictions page)
create policy "settings_select" on settings for select using (true);

-- Only service role can modify (admin actions use service client)

-- Default: no knockout rounds open yet
insert into settings (key, value)
values ('open_rounds', '[]'::jsonb)
on conflict (key) do nothing;
