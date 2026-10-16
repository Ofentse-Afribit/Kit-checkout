-- Row level security on EVERY table. Nothing is readable until a policy says so.
create function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid());
$$;

create function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

alter table profiles       enable row level security;
alter table items          enable row level security;
alter table borrowers      enable row level security;
alter table loans          enable row level security;
alter table loan_conflicts enable row level security;

-- profiles: staff can read; nobody edits roles through the API.
create policy profiles_read on profiles for select using (is_staff());

-- items: staff read, admin write.
create policy items_read   on items for select using (is_staff());
create policy items_insert on items for insert with check (is_admin());
create policy items_update on items for update using (is_admin()) with check (is_admin());

-- borrowers (includes phone numbers): staff only.
create policy borrowers_read   on borrowers for select using (is_staff());
create policy borrowers_insert on borrowers for insert with check (is_staff());

-- loans: staff read + create (as themselves). Update is allowed by policy but
-- narrowed to the return fill-in by a trigger in 0003. No delete policy at all.
create policy loans_read   on loans for select using (is_staff());
create policy loans_insert on loans for insert with check (is_staff() and staff_out = auth.uid());
create policy loans_return on loans for update using (is_staff() and returned_at is null)
                                              with check (is_staff());

-- loan_conflicts: append-only evidence. Insert + select only.
create policy conflicts_read   on loan_conflicts for select using (is_staff());
create policy conflicts_insert on loan_conflicts for insert
  with check (is_staff() and attempted_by = auth.uid());
