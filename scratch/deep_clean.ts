import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function deepClean() {
  console.log('--- DEEP CLEAN START ---');
  
  // 1. Clean Projects
  const { data: projects } = await supabase.from('projects').select('*');
  if (projects) {
    console.log(`Checking ${projects.length} projects...`);
    for (const project of projects) {
      let anchor = project.character_anchor;
      if (anchor && anchor.image_url && anchor.image_url.includes('pollinations')) {
        // Aggressively strip everything after the prompt
        const baseUrl = anchor.image_url.split('?')[0];
        const newUrl = `${baseUrl}?width=1024&height=1024&nologo=true&enhance=true&seed=${Math.floor(Math.random() * 1000000)}`;
        
        console.log(`Fixing Project [${project.project_name}]: ${newUrl.substring(0, 50)}...`);
        await supabase.from('projects').update({ character_anchor: { ...anchor, image_url: newUrl } }).eq('id', project.id);
      }
    }
  }

  // 2. Clean Prompts
  const { data: prompts } = await supabase.from('prompts').select('*');
  if (prompts) {
    console.log(`Checking ${prompts.length} prompts...`);
    for (const prompt of prompts) {
      let anchor = prompt.character_anchor;
      if (anchor && anchor.image_url && anchor.image_url.includes('pollinations')) {
        const baseUrl = anchor.image_url.split('?')[0];
        const newUrl = `${baseUrl}?width=1024&height=1024&nologo=true&enhance=true&seed=${Math.floor(Math.random() * 1000000)}`;
        
        console.log(`Fixing Prompt [${prompt.id}]: ${newUrl.substring(0, 50)}...`);
        await supabase.from('prompts').update({ character_anchor: { ...anchor, image_url: newUrl } }).eq('id', prompt.id);
      }
    }
  }

  console.log('--- DEEP CLEAN COMPLETE ---');
}

deepClean();
