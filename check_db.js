import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tdopkvmuovqxxaxmkoan.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkb3Brdm11b3ZxeHhheG1rb2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDMxOTAsImV4cCI6MjA5MTY3OTE5MH0.lHpmidYL3cwkiq3EPrYf4Tu2OvKvvCj9zd9mnKX80t8'
);

async function check() {
  console.log("Checking romo_live_tracking...");
  const { data: trackData, error: trackErr } = await supabase.from('romo_live_tracking').select('*');
  console.log("Data:", trackData);
  if (trackErr) console.error("Error:", trackErr);
  
  console.log("Checking romo_live_tracking_history...");
  const { data: histData, error: histErr } = await supabase.from('romo_live_tracking_history').select('*').order('recorded_at', {ascending: false}).limit(1);
  console.log("Data:", histData);
  if (histErr) console.error("Error:", histErr);
}

check();
