-- Run this in your Supabase SQL Editor to update prompts table

-- 1. Support detailed production blueprints in the gallery
alter table prompts add column if not exists character_anchor jsonb;
alter table prompts add column if not exists frames jsonb;
alter table prompts add column if not exists video_url text;

-- 2. Projects table (already defined previously, but ensuring columns)
create table if not exists projects (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  project_name text not null,
  total_duration text not null,
  status text default 'Draft' check (status in ('Draft', 'Approved')),
  character_anchor jsonb not null,
  frames jsonb not null,
  video_url text
);

-- Enable RLS
alter table projects enable row level security;

-- Create policy to allow public access (adjust if you want auth)
create policy "Allow public access to projects"
on projects for all
using (true);

-- Explicitly grant permissions if needed for some Supabase setups
grant all on table projects to anon;
grant all on table projects to authenticated;
grant all on table projects to service_role;
