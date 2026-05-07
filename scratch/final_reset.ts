import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function finalReset() {
  console.log('--- FINAL RESET START ---');
  
  const { data: projects } = await supabase.from('projects').select('*');
  if (projects) {
    for (const project of projects) {
      let anchor = project.character_anchor;
      if (anchor && anchor.image_url && anchor.image_url.includes('pollinations')) {
        // Use the most stable URL format: no query params, just the prompt
        const promptPart = anchor.image_url.split('/prompt/')[1]?.split('?')[0];
        if (promptPart) {
           const newUrl = `https://image.pollinations.ai/prompt/${promptPart}`;
           console.log(`Resetting ${project.project_name} to: ${newUrl}`);
           await supabase.from('projects').update({ character_anchor: { ...anchor, image_url: newUrl } }).eq('id', project.id);
        }
      }
    }
  }

  console.log('--- FINAL RESET COMPLETE ---');
}

finalReset();
