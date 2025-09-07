// supabase/functions/iot-alert/index.ts

// Supabase Edge Functions types.
// FIX: Corrected the types reference to use the recommended npm specifier.
/// <reference types="npm:@supabase/functions-js@2" />

// FIX: Declare the Deno global to satisfy TypeScript in non-Deno environments (like local editors).
declare global {
  const Deno: {
    env: {
      get: (key: string) => string | undefined;
    };
  };
}

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log('IoT Alert function initialized');

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate that the request is a POST request
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      });
    }

    // --- Step 1: Read and validate the JSON body ---
    let payload;
    try {
      payload = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    // Check for the 'type' property which we expect from our IoT devices
    if (!payload.type || (payload.type !== 'fire' && payload.type !== 'seismic')) {
        return new Response(JSON.stringify({ error: "Invalid payload: 'type' must be 'fire' or 'seismic'" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // --- Step 2: Initialize the Supabase client ---
    // Make sure to set these environment variables in your Supabase project settings
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // --- Step 3: Broadcast the payload on a Realtime channel ---
    // We'll name the channel 'alerts'
    const channel = supabaseClient.channel('alerts');
    
    const broadcastStatus = await channel.send({
      type: 'broadcast',
      event: 'new-alert', // This is a custom event name
      payload: { 
        type: payload.type,
        timestamp: new Date().toISOString()
      },
    });

    if (broadcastStatus !== 'ok') {
      console.error('Supabase broadcast failed:', broadcastStatus);
      throw new Error('Failed to broadcast the alert via Supabase Realtime.');
    }
    
    console.log(`Successfully broadcasted '${payload.type}' alert.`);

    // --- Step 4: Return a success response ---
    return new Response(JSON.stringify({ message: 'Alert broadcasted successfully', received: payload }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('An error occurred:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})