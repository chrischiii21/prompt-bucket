import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanUrls() {
  console.log('Fetching projects to clean URLs...');
  const { data: projects } = await supabase.from('projects').select('*');

  if (projects) {
    for (const project of projects) {
      let updatedAnchor = { ...project.character_anchor };
      if (updatedAnchor.image_url && updatedAnchor.image_url.includes('&key=')) {
        updatedAnchor.image_url = updatedAnchor.image_url.split('&key=')[0];
        console.log(`Cleaning URL for project: ${project.project_name}`);
        await supabase.from('projects').update({ character_anchor: updatedAnchor }).eq('id', project.id);
      }
    }
  }

  console.log('Fetching prompts to clean URLs...');
  const { data: prompts } = await supabase.from('prompts').select('*');
  if (prompts) {
    for (const prompt of prompts) {
      if (!prompt.character_anchor) continue;
      let updatedAnchor = { ...prompt.character_anchor };
      if (updatedAnchor.image_url && updatedAnchor.image_url.includes('&key=')) {
        updatedAnchor.image_url = updatedAnchor.image_url.split('&key=')[0];
        console.log(`Cleaning URL for prompt: ${prompt.id}`);
        await supabase.from('prompts').update({ character_anchor: updatedAnchor }).eq('id', prompt.id);
      }
    }
  }

  console.log('Clean complete.');
}

cleanUrls();
