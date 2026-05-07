import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectData() {
  const { data: projects } = await supabase.from('projects').select('project_name, character_anchor');
  console.log('Projects:', JSON.stringify(projects, null, 2));
}

inspectData();
