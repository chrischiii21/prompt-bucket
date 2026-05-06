import { supabase } from './src/lib/supabaseClient';

async function checkBucket() {
  console.log('Checking for bucket "prompt-images"...');
  
  const { data, error } = await supabase.storage.getBucket('prompt-images');
  
  if (error) {
    console.error('❌ Bucket "prompt-images" NOT FOUND:');
    console.error(JSON.stringify(error, null, 2));
    console.log('\nACTION REQUIRED:');
    console.log('1. Go to your Supabase Dashboard.');
    console.log('2. Click on "Storage" in the left sidebar.');
    console.log('3. Click "New Bucket" and name it "prompt-images".');
    console.log('4. Make sure to set it to PUBLIC.');
  } else {
    console.log('✅ Bucket "prompt-images" found!');
    console.log('Bucket status:', data.public ? 'Public' : 'Private');
  }
}

checkBucket();
