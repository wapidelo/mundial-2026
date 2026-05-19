-- ============================================================
-- Quiniela Mundial 2026
-- Migration 001: Initial schema, RLS policies, trigger
-- ============================================================

-- Grupos (A–L, 12 grupos)
create table if not exists groups (
  id   serial primary key,
  name char(1) not null unique
);

-- Equipos (48 en total)
create table if not exists teams (
  id         serial primary key,
  name       text    not null,
  flag_emoji text    not null default '🏳',
  group_id   integer references groups(id)
);

-- Partidos de fase de grupos (72 partidos)
create table if not exists matches (
  id             serial primary key,
  match_number   integer not null,
  home_team_id   integer not null references teams(id),
  away_team_id   integer not null references teams(id),
  group_id       integer not null references groups(id),
  scheduled_at   timestamptz not null,
  home_score     integer,
  away_score     integer,
  status         text not null default 'scheduled',
  constraint status_check check (status in ('scheduled', 'finished'))
);

-- Perfiles de usuario
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at   timestamptz default now()
);

-- Predicciones (una por usuario por partido)
create table if not exists predictions (
  id                    uuid default gen_random_uuid() primary key,
  user_id               uuid not null references auth.users(id) on delete cascade,
  match_id              integer not null references matches(id),
  predicted_home_score  integer not null check (predicted_home_score >= 0),
  predicted_away_score  integer not null check (predicted_away_score >= 0),
  points                integer,
  created_at            timestamptz default now(),
  unique(user_id, match_id)
);

-- Predicciones bonus (campeón + 3er lugar)
create table if not exists bonus_predictions (
  id                   uuid default gen_random_uuid() primary key,
  user_id              uuid not null references auth.users(id) on delete cascade unique,
  champion_team_id     integer references teams(id),
  third_place_team_id  integer references teams(id),
  champion_points      integer not null default 0,
  third_place_points   integer not null default 0,
  created_at           timestamptz default now()
);

-- ============================================================
-- Vista leaderboard
-- ============================================================
create view leaderboard
  with (security_invoker = true)
as
select
  p.id           as user_id,
  p.display_name,
  coalesce(sum(pr.points), 0)
    + coalesce(bp.champion_points, 0)
    + coalesce(bp.third_place_points, 0) as total_points,
  count(case when pr.points = 3 then 1 end)  as exact_scores,
  count(case when pr.points = 2 then 1 end)  as winner_results,
  count(case when pr.points = 1 then 1 end)  as draw_results,
  count(case when pr.points > 0 then 1 end)  as total_correct,
  count(pr.id)                               as total_predictions
from profiles p
left join predictions pr       on pr.user_id = p.id
left join bonus_predictions bp on bp.user_id = p.id
group by p.id, p.display_name, bp.champion_points, bp.third_place_points
order by total_points desc;

-- ============================================================
-- RLS
-- ============================================================
alter table groups  enable row level security;
alter table teams   enable row level security;
alter table matches enable row level security;
alter table profiles enable row level security;
alter table predictions enable row level security;
alter table bonus_predictions enable row level security;

-- grupos y equipos: solo lectura pública
create policy "groups_select"  on groups  for select using (true);
create policy "teams_select"   on teams   for select using (true);
create policy "matches_select" on matches for select using (true);

-- profiles: lectura pública, escritura solo el propio usuario
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- predictions: cada usuario gestiona las suyas
create policy "predictions_select" on predictions for select using (auth.uid() = user_id);
create policy "predictions_insert" on predictions for insert with check (auth.uid() = user_id);
create policy "predictions_update" on predictions for update using (auth.uid() = user_id);

-- bonus_predictions: cada usuario gestiona las suyas
create policy "bonus_select" on bonus_predictions for select using (auth.uid() = user_id);
create policy "bonus_insert" on bonus_predictions for insert with check (auth.uid() = user_id);
create policy "bonus_update" on bonus_predictions for update using (auth.uid() = user_id);

-- ============================================================
-- Trigger: recalcular puntos cuando admin ingresa resultado
-- ============================================================
create or replace function recalculate_match_points()
returns trigger language plpgsql security definer
set search_path = ''
as $$
declare
  actual_sign integer;
begin
  if new.home_score is null or new.away_score is null then
    return new;
  end if;

  actual_sign := sign(new.home_score::numeric - new.away_score::numeric)::integer;

  update public.predictions
  set points = case
    when predicted_home_score = new.home_score
         and predicted_away_score = new.away_score then 3
    when sign(predicted_home_score::numeric - predicted_away_score::numeric)::integer = actual_sign
         and actual_sign != 0 then 2
    when sign(predicted_home_score::numeric - predicted_away_score::numeric)::integer = actual_sign
         and actual_sign = 0 then 1
    else 0
  end
  where match_id = new.id;

  return new;
end;
$$;

create trigger on_match_result_entered
  after update on public.matches
  for each row
  when (
    old.home_score is distinct from new.home_score
    or old.away_score is distinct from new.away_score
  )
  execute function recalculate_match_points();

-- Trigger: auto-crear perfil al registrar usuario
create or replace function handle_new_user()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
