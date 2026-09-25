import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tdopkvmuovqxxaxmkoan.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkb3Brdm11b3ZxeHhheG1rb2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDMxOTAsImV4cCI6MjA5MTY3OTE5MH0.lHpmidYL3cwkiq3EPrYf4Tu2OvKvvCj9zd9mnKX80t8'
);

async function check() {
  const { data, count, error } = await supabase
    .from('romo_live_tracking_history')
    .select('*', { count: 'exact', head: false })
    .gte('recorded_at', '2026-09-24T00:00:00Z');
  
  if (error) console.error(error);
  console.log("Points on Sept 24:", count);
  if (data && data.length > 0) {
    console.log("First point:", data[0].recorded_at);
    console.log("Last point:", data[data.length - 1].recorded_at);
  }
}
check();
