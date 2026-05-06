import { supabase } from './src/lib/supabaseClient';

async function testInsert() {
  console.log('Testing insert into "prompts" table...');
  
  const testData = {
    prompt_text: 'Test Prompt ' + Date.now(),
    image_url: 'https://example.com/test.jpg',
    category: 'Realistic',
    tags: ['test', 'debug']
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
    console.log('Inserted data:', data);
  }
}

testInsert();
