-- # CONSOLIDATED DATABASE SCHEMA FOR PROMPT BUCKET
-- Run this in your Supabase SQL Editor.

-- 1. Enable Extensions
create extension if not exists "uuid-ossp";

-- 2. Create the Prompts table (Library)
create table if not exists prompts (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  prompt_text text not null,
  summary text,
  image_url text,
  category text default 'Video',
  tags text[] default '{}',
  video_url text,
  character_anchor jsonb,
  frames jsonb,
  project_id uuid,
  history jsonb default '[]'::jsonb
);

-- 3. Create the Projects table (Director Suite)
create table if not exists projects (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  project_name text not null,
  total_duration text default '30',
  status text default 'Draft' check (status in ('Draft', 'Approved')),
  character_anchor jsonb not null,
  frames jsonb not null,
  video_url text,
  summary text,
  history jsonb default '[]'::jsonb
);

-- 4. Security & Access
alter table prompts enable row level security;
alter table projects enable row level security;

create policy "Allow public access to prompts" on prompts for all using (true);
create policy "Allow public access to projects" on projects for all using (true);

grant all on table prompts to anon, authenticated, service_role;
grant all on table projects to anon, authenticated, service_role;
