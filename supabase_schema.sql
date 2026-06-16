-- =============================================
-- Запусти этот файл в Supabase → SQL Editor
-- =============================================

-- Избранное
create table if not exists route_favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  route_id   int  references routes(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, route_id)
);

-- Рейтинг (1-5)
create table if not exists route_ratings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  route_id   int  references routes(id) on delete cascade not null,
  rating     int  check (rating between 1 and 5) not null,
  created_at timestamptz default now(),
  unique(user_id, route_id)
);

-- Top / Flash
create table if not exists route_achievements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  route_id    int  references routes(id) on delete cascade not null,
  achievement text check (achievement in ('top', 'flash')) not null,
  created_at  timestamptz default now(),
  unique(user_id, route_id)
);

-- Уровень от пользователя
create table if not exists route_user_levels (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  route_id   int  references routes(id) on delete cascade not null,
  level      text not null,
  created_at timestamptz default now(),
  unique(user_id, route_id)
);

-- Комментарии (user_email сохраняем сразу, чтобы не джойнить auth.users)
create table if not exists route_comments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  user_email text not null,
  route_id   int  references routes(id) on delete cascade not null,
  text       text not null,
  created_at timestamptz default now()
);

-- =============================================
-- RLS (Row Level Security)
-- =============================================

alter table route_favorites    enable row level security;
alter table route_ratings      enable row level security;
alter table route_achievements enable row level security;
alter table route_user_levels  enable row level security;
alter table route_comments     enable row level security;

-- Все могут читать
create policy "read favorites"    on route_favorites    for select using (true);
create policy "read ratings"      on route_ratings      for select using (true);
create policy "read achievements" on route_achievements for select using (true);
create policy "read user_levels"  on route_user_levels  for select using (true);
create policy "read comments"     on route_comments     for select using (true);

-- Писать/менять/удалять только свои
create policy "own favorites"    on route_favorites    for all using (auth.uid() = user_id);
create policy "own ratings"      on route_ratings      for all using (auth.uid() = user_id);
create policy "own achievements" on route_achievements for all using (auth.uid() = user_id);
create policy "own user_levels"  on route_user_levels  for all using (auth.uid() = user_id);
create policy "own comments"     on route_comments     for all using (auth.uid() = user_id);

-- =============================================
-- Запусти отдельно в Supabase → SQL Editor
-- Добавляет created_by к таблице routes
-- =============================================

alter table routes add column if not exists created_by uuid references auth.users;

-- RLS для таблицы routes
alter table routes enable row level security;

create policy "read routes"        on routes for select using (true);
create policy "insert routes"      on routes for insert with check (auth.uid() = created_by);
create policy "update own routes"  on routes for update using (auth.uid() = created_by);
create policy "delete own routes"  on routes for delete using (auth.uid() = created_by);
