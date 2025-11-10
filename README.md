# Noterra

Your notes, everywhere. Online or off.

Noterra is a minimal note-taking app built with Vite + React + TypeScript + Tailwind that stores notes locally (IndexedDB) and syncs them across devices via Supabase when online.

## Features

- Create notes offline
- Notes saved locally in IndexedDB
- Sync notes to Supabase when back online or when you press **Sync now**
- Shows `synced` / `unsynced` badge per note
- Multi-device sync via Supabase (you must provide Supabase project info)

## Setup

1. Install dependencies:

```bash
npm install
# or
yarn
```

2. Create a `.env` file in project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. Supabase table:

Run the SQL in Supabase SQL editor to create `notes` table:

```sql
create table if not exists public.notes (
  id text primary key,
  content text,
  updated_at timestamptz
);
```

4. Enable Supabase Realtime:

In your Supabase project dashboard, go to Database > Replication and enable real-time for the `notes` table to receive push updates.

5. Run dev server:

```bash
npm run dev
```

## How sync works

- Local notes are stored in IndexedDB via `idb-keyval`.
- When online, the app:
  - Pushes unsynced local notes to Supabase via upsert.
  - Pulls remote notes updated since the last pull and saves them locally.
  - **Real-time updates**: Subscribes to Supabase real-time changes to receive instant push notifications when notes are created, updated, or deleted on other devices (no polling).
- Conflict resolution: last-write-wins by `updated_at` (simple merge).

## Notes / Improvements

- Production apps should authenticate users; this example uses anon key for simplicity.
- Add user-specific `user_id` column to `notes` and filter by user.
- Add optimistic UI, edit/delete support, background sync/service worker for robust offline behavior.
