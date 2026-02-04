-- Enable PostGIS if available (for future use), though we use float lat/lng for simplicity in this demo
create extension if not exists postgis;

-- PROFILES
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  live_location geography(Point),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone" on profiles
  for select using (true);

create policy "Users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- EVENTS
create table events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  lat double precision not null,
  lng double precision not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  organizer_id uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table events enable row level security;

create policy "Events are viewable by everyone" on events
  for select using (true);

create policy "Organizers can create events" on events
  for insert with check (auth.uid() = organizer_id);

-- RSVPS
create table rsvps (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  event_id uuid references events(id) on delete cascade not null,
  checked_in_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, event_id)
);

alter table rsvps enable row level security;

create policy "Users can view their own RSVPs" on rsvps
  for select using (auth.uid() = user_id);

create policy "Organizers can view RSVPs for their events" on rsvps
  for select using (
    exists (
      select 1 from events
      where events.id = rsvps.event_id
      and events.organizer_id = auth.uid()
    )
  );

create policy "Users can create their own RSVP" on rsvps
  for insert with check (auth.uid() = user_id);

create policy "Organizers can update RSVPs (Check-in)" on rsvps
  for update using (
     exists (
      select 1 from events
      where events.id = rsvps.event_id
      and events.organizer_id = auth.uid()
    )
  );

-- HANDLE NEW USER trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- SEED DATA
-- (Optional: Add some events manually or via UI)
