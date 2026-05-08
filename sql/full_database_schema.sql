-- # COMPLETE DATABASE SCHEMA FOR PROMPT BUCKET & DIRECTOR SUITE
-- Run this in your Supabase SQL Editor to ensure all features work correctly.

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create the Prompts table (The Library)
create table if not exists prompts (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  prompt_text text not null,
  image_url text,
  category text default 'Realistic',
  tags text[] default '{}',
  
  -- Video Production specific columns (The Blueprint)
  video_url text,
  character_anchor jsonb,
  frames jsonb,
  summary text,
  project_id uuid, -- Reference to the internal project if created via Director Suite
  history jsonb default '[]'::jsonb
);

-- 3. Create the Projects table (Director Suite Workspace)
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

-- 4. Enable Row Level Security (RLS)
alter table prompts enable row level security;
alter table projects enable row level security;

-- 5. Create Public Access Policies (Allowing everyone to read/write for this demo)
-- Note: In a production app, you would restrict these to authenticated users.

create policy "Allow public access to prompts" on prompts for all using (true);
create policy "Allow public access to projects" on projects for all using (true);

-- 6. Grant Permissions
grant all on table prompts to anon;
grant all on table prompts to authenticated;
grant all on table prompts to service_role;

grant all on table projects to anon;
grant all on table projects to authenticated;
grant all on table projects to service_role;

-- 7. Add columns to existing prompts table if they were missing (Migration Support)
alter table prompts add column if not exists summary text;
alter table prompts add column if not exists project_id uuid;
alter table prompts add column if not exists history jsonb default '[]'::jsonb;
alter table prompts add column if not exists video_url text;
alter table prompts add column if not exists character_anchor jsonb;
alter table prompts add column if not exists frames jsonb;
