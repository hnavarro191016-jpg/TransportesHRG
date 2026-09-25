async function check() {
  const url1 = 'https://tdopkvmuovqxxaxmkoan.supabase.co/rest/v1/romo_live_tracking?select=*';
  const url2 = 'https://tdopkvmuovqxxaxmkoan.supabase.co/rest/v1/romo_live_tracking_history?select=*&order=recorded_at.desc&limit=1';
  
  const headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkb3Brdm11b3ZxeHhheG1rb2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDMxOTAsImV4cCI6MjA5MTY3OTE5MH0.lHpmidYL3cwkiq3EPrYf4Tu2OvKvvCj9zd9mnKX80t8',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkb3Brdm11b3ZxeHhheG1rb2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDMxOTAsImV4cCI6MjA5MTY3OTE5MH0.lHpmidYL3cwkiq3EPrYf4Tu2OvKvvCj9zd9mnKX80t8'
  };

  try {
    const res1 = await fetch(url1, { headers });
    const data1 = await res1.json();
    console.log("romo_live_tracking:", JSON.stringify(data1, null, 2));

    const res2 = await fetch(url2, { headers });
    const data2 = await res2.json();
    console.log("romo_live_tracking_history:", JSON.stringify(data2, null, 2));
  } catch(e) {
    console.error(e);
  }
}

check();
