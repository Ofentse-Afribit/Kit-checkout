-- Tables. RLS is switched on in 0002.
create type user_role   as enum ('desk', 'admin');
create type item_status as enum ('available', 'out', 'maintenance');
create type condition   as enum ('good', 'marked', 'damaged');

create table profiles (
  id        uuid primary key references auth.users (id) on delete cascade,
  role      user_role not null default 'desk',
  full_name text not null default ''
);

create table items (
  id       uuid primary key default gen_random_uuid(),
  name     text not null,
  category text not null,
  qr_code  text not null unique,
  status   item_status not null default 'available',
  notes    text
);

create table borrowers (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  phone        text,
  organisation text,
  id_verified  boolean not null default false
);

create table loans (
  id             uuid primary key,               -- generated on the phone
  item_id        uuid not null references items (id),
  borrower_id    uuid not null references borrowers (id),
  out_at         timestamptz not null default now(),
  due_at         timestamptz not null,
  returned_at    timestamptz,                    -- null while the item is out
  condition_out  condition not null,
  condition_in   condition,
  photo_out_path text,
  photo_in_path  text,
  staff_out      uuid not null references profiles (id),
  staff_in       uuid references profiles (id),
  check (due_at > out_at),
  check (returned_at is null or returned_at >= out_at)
);

-- THE KEY RULE: one open loan per item, enforced by the database itself.
create unique index loans_one_open_per_item
  on loans (item_id)
  where returned_at is null;

create index loans_item_idx     on loans (item_id, out_at desc);
create index loans_open_due_idx on loans (due_at) where returned_at is null;

-- Append-only log of rejected (conflicting) checkouts, for admin review.
create table loan_conflicts (
  id                uuid primary key default gen_random_uuid(),
  item_id           uuid not null references items (id),
  attempted_loan_id uuid not null,
  attempted_by      uuid not null references profiles (id),
  winning_loan_id   uuid references loans (id),
  created_at        timestamptz not null default now()
);

-- Every new auth user gets a 'desk' profile. Promote admins by hand in SQL.
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
