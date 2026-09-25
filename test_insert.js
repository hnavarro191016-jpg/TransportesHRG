import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tdopkvmuovqxxaxmkoan.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkb3Brdm11b3ZxeHhheG1rb2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDMxOTAsImV4cCI6MjA5MTY3OTE5MH0.lHpmidYL3cwkiq3EPrYf4Tu2OvKvvCj9zd9mnKX80t8'
);

async function testInsert() {
  console.log("Attempting to insert into romo_live_tracking_history...");
  const { data, error } = await supabase.from('romo_live_tracking_history').insert([
    {
      telegram_id: '12345',
      latitude: 25.0,
      longitude: -100.0,
      recorded_at: new Date().toISOString()
    }
  ]);
  
  if (error) {
    console.error("Insert Error:", error);
  } else {
    console.log("Insert Success:", data);
  }
}

testInsert();
