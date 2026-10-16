-- Run in the Supabase SQL editor AFTER you have signed up one user (so a profile exists).
-- Expected result: NOTICE "PASS: second open loan was rejected".
do $$
declare
  staff uuid := (select id from profiles limit 1);
  it    uuid := (select id from items where qr_code = 'TRI003');
  b1    uuid := gen_random_uuid();
  b2    uuid := gen_random_uuid();
begin
  insert into borrowers (id, name) values (b1, 'Test John'), (b2, 'Test Sarah');

  insert into loans (id, item_id, borrower_id, due_at, condition_out, staff_out)
  values (gen_random_uuid(), it, b1, now() + interval '1 day', 'good', staff);

  begin
    insert into loans (id, item_id, borrower_id, due_at, condition_out, staff_out)
    values (gen_random_uuid(), it, b2, now() + interval '1 day', 'good', staff);
    raise exception 'FAIL: double lending was allowed!';
  exception when unique_violation then
    raise notice 'PASS: second open loan was rejected';
  end;

  -- clean up the test data
  delete from loans where item_id = it;
  delete from borrowers where id in (b1, b2);
  update items set status = 'available' where id = it;
end $$;
