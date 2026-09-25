async function check() {
  const url = 'https://tdopkvmuovqxxaxmkoan.supabase.co/rest/v1/romo_live_tracking_history?recorded_at=gte.2026-09-24T00:00:00Z&select=*';
  const headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkb3Brdm11b3ZxeHhheG1rb2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDMxOTAsImV4cCI6MjA5MTY3OTE5MH0.lHpmidYL3cwkiq3EPrYf4Tu2OvKvvCj9zd9mnKX80t8',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkb3Brdm11b3ZxeHhheG1rb2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDMxOTAsImV4cCI6MjA5MTY3OTE5MH0.lHpmidYL3cwkiq3EPrYf4Tu2OvKvvCj9zd9mnKX80t8',
    'Range': '0-5000'
  };

  try {
    const res = await fetch(url, { headers });
    const data = await res.json();
    console.log("Points on Sept 24:", data.length);
    if (data && data.length > 0) {
      console.log("First point:", data[0].recorded_at);
      console.log("Last point:", data[data.length - 1].recorded_at);
    }
  } catch(e) {
    console.error(e);
  }
}

check();
