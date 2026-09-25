import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Read Telegram Webhook body
    const update = await req.json();

    // Telegram live locations come as "edited_message"
    const message = update.edited_message || update.message;

    if (message && message.location) {
      const telegram_id = message.from?.id?.toString();
      const latitude = message.location.latitude;
      const longitude = message.location.longitude;

      if (telegram_id) {
        // Obtener el nombre directamente del perfil de Telegram del chofer
        const firstName = message.from?.first_name || '';
        const lastName = message.from?.last_name || '';
        const driverName = `${firstName} ${lastName}`.trim() || 'Desconocido';

        const payload = {
          telegram_id: telegram_id,
          driver_name: driverName, // <- Se guarda automáticamente su nombre
          latitude: latitude,
          longitude: longitude,
          last_updated: new Date().toISOString()
        };

        // We try to UPSERT the location
        const { error } = await supabase
          .from('romo_live_tracking')
          .upsert(payload, { onConflict: 'telegram_id' });

        if (error) {
          console.error('Supabase Upsert Error:', error);
          return new Response(JSON.stringify({ error: error.message }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          });
        }
      }
    }

    // Always respond 200 OK to Telegram so it stops retrying
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook Error:', error);
    // Even on error, respond 200 to Telegram so it doesn't queue infinitely
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
