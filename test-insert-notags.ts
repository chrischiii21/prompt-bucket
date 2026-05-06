import { supabase } from './src/lib/supabaseClient';

async function testInsertNoTags() {
  console.log('Testing insert with empty tags...');
  
  const testData = {
    prompt_text: 'Test No Tags ' + Date.now(),
    image_url: 'https://example.com/test.jpg',
    category: 'Realistic',
    tags: []
  };

  const { data, error } = await supabase
    .from('prompts')
    .insert([testData])
    .select();
  
  if (error) {
    console.error('❌ Insert FAILED:');
    console.error(JSON.stringify(error, null, 2));
  } else {
    console.log('✅ Insert SUCCESSFUL!');
  }
}

testInsertNoTags();
