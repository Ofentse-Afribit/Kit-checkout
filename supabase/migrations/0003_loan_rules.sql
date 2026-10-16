-- Loans are append-only apart from ONE fill-in on return.
create function enforce_loan_return_only() returns trigger
language plpgsql as $$
begin
  if old.returned_at is not null then
    raise exception 'loan % is already closed and cannot change', old.id;
  end if;
  if new.returned_at is null then
    raise exception 'an update must close the loan (set returned_at)';
  end if;
  if (new.id, new.item_id, new.borrower_id, new.out_at, new.due_at,
      new.condition_out, new.photo_out_path, new.staff_out)
     is distinct from
     (old.id, old.item_id, old.borrower_id, old.out_at, old.due_at,
      old.condition_out, old.photo_out_path, old.staff_out) then
    raise exception 'only returned_at, condition_in, photo_in_path and staff_in may change';
  end if;
  return new;
end $$;

create trigger loans_return_only
  before update on loans
  for each row execute function enforce_loan_return_only();

-- Keep items.status in step with loans (desk staff cannot update items directly).
create function sync_item_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update items set status = 'out' where id = new.item_id;
  elsif tg_op = 'UPDATE' and old.returned_at is null and new.returned_at is not null then
    update items set status = 'available' where id = new.item_id and status = 'out';
  end if;
  return null;
end $$;

create trigger loans_sync_status
  after insert or update on loans
  for each row execute function sync_item_status();

-- Admin-only utilisation: loans per item over the last 30 days (never-borrowed = 0).
create function utilisation_30d()
returns table (item_id uuid, name text, category text, loans_30d bigint)
language sql stable security definer set search_path = public as $$
  select i.id, i.name, i.category, count(l.id)
  from items i
  left join loans l on l.item_id = i.id and l.out_at > now() - interval '30 days'
  where is_admin()
  group by i.id, i.name, i.category
  order by count(l.id) desc, i.name;
$$;

-- Realtime: dashboard subscribes to these.
alter publication supabase_realtime add table items, loans;
