-- Run in Supabase SQL editor
create table if not exists public.notes (
  id text primary key,
  title text,
  content text,
  updated_at timestamptz,
  attachments jsonb default '[]'::jsonb
);

-- Create storage bucket for note attachments
-- Run this in Supabase Dashboard > Storage or via SQL:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create a new bucket named "note-attachments"
-- 3. Set it to public or configure RLS policies as needed

-- Optional: Add index on updated_at for faster sync queries
create index if not exists notes_updated_at_idx on public.notes(updated_at);
