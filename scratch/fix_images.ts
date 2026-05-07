import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixImages() {
  console.log('Fetching projects...');
  const { data: projects, error } = await supabase.from('projects').select('*');

  if (error) {
    console.error('Error fetching projects:', error);
    return;
  }

  for (const project of projects) {
    let updatedAnchor = { ...project.character_anchor };
    let changed = false;

    const name = project.project_name.toLowerCase();
    const desc = updatedAnchor.description.toLowerCase();

    if ((name.includes('turbo') || desc.includes('driver')) && !updatedAnchor.image_url?.includes('photo-1500648767791')) {
      updatedAnchor.image_url = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800'; // Male driver
      changed = true;
    } else if (name.includes('whisker') && !updatedAnchor.image_url?.includes('photo-1514888286974')) {
      updatedAnchor.image_url = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800'; // Cat
      changed = true;
    }

    if (changed) {
      console.log(`Updating project: ${project.project_name}...`);
      await supabase
        .from('projects')
        .update({ character_anchor: updatedAnchor })
        .eq('id', project.id);
    }
  }

  // Also update prompts table
  console.log('Fetching prompts...');
  const { data: prompts } = await supabase.from('prompts').select('*');
  if (prompts) {
    for (const prompt of prompts) {
      if (!prompt.character_anchor) continue;
      
      let updatedAnchor = { ...prompt.character_anchor };
      let changed = false;

      const text = prompt.prompt_text.toLowerCase();
      const desc = updatedAnchor.description?.toLowerCase() || '';

      if ((text.includes('turbo') || desc.includes('driver')) && !updatedAnchor.image_url?.includes('photo-1500648767791')) {
        updatedAnchor.image_url = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800';
        changed = true;
      } else if (text.includes('whisker') && !updatedAnchor.image_url?.includes('photo-1514888286974')) {
        updatedAnchor.image_url = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800';
        changed = true;
      }

      if (changed) {
        console.log(`Updating prompt: ${prompt.id}...`);
        await supabase
          .from('prompts')
          .update({ character_anchor: updatedAnchor })
          .eq('id', prompt.id);
      }
    }
  }

  console.log('Fix complete.');
}

fixImages();
