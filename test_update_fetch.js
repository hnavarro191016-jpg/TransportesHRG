async function testUpdate() {
  const url = 'https://tdopkvmuovqxxaxmkoan.supabase.co/rest/v1/romo_live_tracking?telegram_id=eq.7975323175';
  const headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkb3Brdm11b3ZxeHhheG1rb2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDMxOTAsImV4cCI6MjA5MTY3OTE5MH0.lHpmidYL3cwkiq3EPrYf4Tu2OvKvvCj9zd9mnKX80t8',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkb3Brdm11b3ZxeHhheG1rb2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDMxOTAsImV4cCI6MjA5MTY3OTE5MH0.lHpmidYL3cwkiq3EPrYf4Tu2OvKvvCj9zd9mnKX80t8',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const body = {
    latitude: 25.710000,
    longitude: -100.224000,
    last_updated: new Date().toISOString()
  };

  try {
    const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(body) });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e);
  }
}

testUpdate();
