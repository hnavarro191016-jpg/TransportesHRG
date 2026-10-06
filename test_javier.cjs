const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://tdopkvmuovqxxaxmkoan.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkb3Brdm11b3ZxeHhheG1rb2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDMxOTAsImV4cCI6MjA5MTY3OTE5MH0.lHpmidYL3cwkiq3EPrYf4Tu2OvKvvCj9zd9mnKX80t8');
async function run() {
  const { data } = await supabase.from('romo_live_tracking').select('*').ilike('driver_name', '%Javier Garcia%');
  console.log(JSON.stringify(data, null, 2));
}
run();
