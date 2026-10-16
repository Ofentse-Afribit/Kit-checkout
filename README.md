# KitCheckout

QR-based equipment lending for Thuto Labs: an Expo desk app and a React dashboard sharing one Supabase backend.

## Setup
1. `node -v` must be 20.19.4 or newer.
2. `npm install` in the repo root (npm workspaces).
3. Create a free Supabase project. Run `supabase/migrations/0001` to `0004` in order in the SQL editor.
4. Copy `.env.example` values into `apps/dashboard/.env` and `apps/mobile/.env` (anon key only).
5. Dashboard: `npm run dashboard`. Phone: `npm run mobile`, then scan the QR with Expo Go.

## Data model
profiles, items, borrowers, loans, loan_conflicts. See `supabase/migrations/0001_init.sql`.

## How we prevent double lending
A partial unique index `loans_one_open_per_item` on `loans (item_id) where returned_at is null`
lets an item have only one open loan. The database enforces it, so it holds even when an app is
offline or out of date. The second insert fails with `unique_violation`; the phone shows a conflict card.

## Loans are append-only
No delete policy exists. A trigger (`enforce_loan_return_only`, migration 0003) allows exactly one
update per loan: filling in `returned_at`, `condition_in`, `photo_in_path` and `staff_in`.
