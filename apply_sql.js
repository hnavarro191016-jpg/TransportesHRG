import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function apply() {
  const { data, error } = await supabase.rpc('exec_sql', { sql: 'alter table public.romo_users add column if not exists must_change_password boolean default false;' });
  console.log(error || 'Success if no RPC, but we probably dont have exec_sql.');
}
apply();
