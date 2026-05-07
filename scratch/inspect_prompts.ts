import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectPrompts() {
  const { data: prompts } = await supabase.from('prompts').select('id, prompt_text, character_anchor');
  console.log('Prompts:', JSON.stringify(prompts, null, 2));
}

inspectPrompts();
