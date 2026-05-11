create table public.demo_game_recaps (
  series_id text not null,
  game_number integer not null,
  source text not null default 'demo',
  summary text not null check (char_length(summary) <= 600),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (series_id, game_number, source)
);

alter table public.demo_game_recaps enable row level security;

create policy "Recaps are viewable by everyone"
  on public.demo_game_recaps for select using (true);

create policy "Admins can insert recaps"
  on public.demo_game_recaps for insert to authenticated
  with check (has_role(auth.uid(), 'admin'));

create policy "Admins can update recaps"
  on public.demo_game_recaps for update to authenticated
  using (has_role(auth.uid(), 'admin'))
  with check (has_role(auth.uid(), 'admin'));

create policy "Admins can delete recaps"
  on public.demo_game_recaps for delete to authenticated
  using (has_role(auth.uid(), 'admin'));

create trigger update_demo_game_recaps_updated_at
  before update on public.demo_game_recaps
  for each row execute function public.update_updated_at_column();