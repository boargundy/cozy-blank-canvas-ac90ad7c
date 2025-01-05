import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const upgrade = req.headers.get('upgrade') || '';
    if (upgrade.toLowerCase() != 'websocket') {
      return new Response('Expected websocket', { status: 400 });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      socket.close(4000, 'Missing authorization header');
      return response;
    }

    const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (error || !user) {
      socket.close(4001, 'Unauthorized');
      return response;
    }

    // Connect to OpenAI's WebSocket
    const openAIWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01');
    
    openAIWs.onopen = () => {
      console.log('Connected to OpenAI WebSocket');
    };

    openAIWs.onmessage = (event) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(event.data);
      }
    };

    socket.onmessage = (event) => {
      if (openAIWs.readyState === WebSocket.OPEN) {
        openAIWs.send(event.data);
      }
    };

    socket.onclose = () => {
      console.log('Client disconnected');
      openAIWs.close();
    };

    openAIWs.onclose = () => {
      console.log('OpenAI connection closed');
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };

    return response;
  } catch (err) {
    console.error('Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});