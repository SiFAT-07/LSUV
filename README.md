# LSUV

Los Santos Used Vehicles static site (HTML, CSS, Vanilla JavaScript).

## Shared online data setup (GitHub Pages friendly)

By default, the site uses local browser storage.
To make car additions/removals visible to everyone online, connect Supabase.

### 1. Create Supabase project

1. Go to https://supabase.com and create a new project.
2. Open SQL Editor and run:

```sql
create extension if not exists "pgcrypto";

create table if not exists public.cars (
	id uuid primary key default gen_random_uuid(),
	image text not null,
	name text not null,
	price text not null,
	description text not null,
	created_at timestamptz not null default now()
);
```

### 2. Enable API access for public site

1. In Supabase Table Editor, open table `cars` and enable RLS.
2. Add policies for `anon` role:
	 - `select` policy: allow read
	 - `insert` policy: allow add
	 - `delete` policy: allow remove

Example policies:

```sql
create policy "Public read cars"
on public.cars
for select
to anon
using (true);

create policy "Public insert cars"
on public.cars
for insert
to anon
with check (true);

create policy "Public delete cars"
on public.cars
for delete
to anon
using (true);
```

### 3. Add Supabase keys in script.js

Open `script.js` and set these constants:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

When both values are set, site switches to shared online mode automatically.

## Discord webhook

Transfer requests are sent via Discord webhook from the browser.
The webhook URL is prefilled in `script.js` as `DEFAULT_WEBHOOK_URL`.

Security note: frontend webhook URLs are publicly visible to users.
If needed, rotate webhook and move request sending to a backend function.

