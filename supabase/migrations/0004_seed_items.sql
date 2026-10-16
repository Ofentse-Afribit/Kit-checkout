-- 30 starter items.
insert into items (name, category, qr_code)
select 'Camera ' || n,    'Camera',    'CAM' || lpad(n::text, 3, '0') from generate_series(1, 6) n
union all
select 'Tripod ' || n,    'Tripod',    'TRI' || lpad(n::text, 3, '0') from generate_series(1, 8) n
union all
select 'Drill ' || n,     'Drill',     'DRL' || lpad(n::text, 3, '0') from generate_series(1, 6) n
union all
select 'Projector ' || n, 'Projector', 'PRJ' || lpad(n::text, 3, '0') from generate_series(1, 5) n
union all
select 'Laptop ' || n,    'Laptop',    'LAP' || lpad(n::text, 3, '0') from generate_series(1, 5) n;
