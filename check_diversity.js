async function check() {
  const url = 'https://tdopkvmuovqxxaxmkoan.supabase.co/rest/v1/romo_live_tracking_history?recorded_at=gte.2026-09-24T00:00:00Z&select=latitude,longitude';
  const headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkb3Brdm11b3ZxeHhheG1rb2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDMxOTAsImV4cCI6MjA5MTY3OTE5MH0.lHpmidYL3cwkiq3EPrYf4Tu2OvKvvCj9zd9mnKX80t8',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkb3Brdm11b3ZxeHhheG1rb2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDMxOTAsImV4cCI6MjA5MTY3OTE5MH0.lHpmidYL3cwkiq3EPrYf4Tu2OvKvvCj9zd9mnKX80t8'
  };

  let allData = [];
  for (let i = 0; i < 9000; i += 1000) {
    const res = await fetch(url, { headers: { ...headers, 'Range': `${i}-${i+999}` } });
    const data = await res.json();
    if (data.length === 0) break;
    allData = allData.concat(data);
  }

  console.log("Total points fetched:", allData.length);
  
  let minLat = 90, maxLat = -90;
  let minLon = 180, maxLon = -180;
  
  allData.forEach(p => {
    if (p.latitude < minLat) minLat = p.latitude;
    if (p.latitude > maxLat) maxLat = p.latitude;
    if (p.longitude < minLon) minLon = p.longitude;
    if (p.longitude > maxLon) maxLon = p.longitude;
  });
  
  console.log("Bounding Box:");
  console.log(`Lat: ${minLat} to ${maxLat}`);
  console.log(`Lon: ${minLon} to ${maxLon}`);
  
  const unique = new Set(allData.map(p => `${p.latitude},${p.longitude}`));
  console.log("Unique coordinates:", unique.size);
}

check();
