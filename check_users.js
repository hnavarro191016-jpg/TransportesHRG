import 'dotenv/config';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

async function checkUsers() {
  const endpoint = `${url}/rest/v1/romo_users?select=*`;
  const res = await fetch(endpoint, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  const data = await res.json();
  console.log('ROMO_USERS count:', data?.length);
  console.log('ROMO_USERS:', JSON.stringify(data, null, 2));
}

checkUsers();
