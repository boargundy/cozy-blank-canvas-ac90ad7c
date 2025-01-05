import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { StandardWebSocketClient } from "https://deno.land/x/websocket@v0.1.4/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if it's a WebSocket upgrade request
    const upgrade = req.headers.get('upgrade') || '';
    if (upgrade.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { 
        status: 426,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify authentication
    const url = new URL(req.url);
    const jwt = url.searchParams.get('jwt');
    if (!jwt) {
      return new Response('Authentication required', { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify JWT token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response('Invalid authentication', { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Upgrade the HTTP request to a WebSocket connection
    const { socket, response } = Deno.upgradeWebSocket(req);
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      socket.close(1011, 'OpenAI API key not found');
      return response;
    }

    console.log('Creating OpenAI WebSocket connection...');

    // Create WebSocket connection to OpenAI
    const openAIWs = new StandardWebSocketClient(
      'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01',
      {
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
        },
      }
    );

    // Forward messages from client to OpenAI
    socket.onmessage = async (event) => {
      try {
        if (openAIWs.readyState === openAIWs.OPEN) {
          console.log('Forwarding message to OpenAI:', event.data);
          openAIWs.send(event.data);
        } else {
          console.error('OpenAI WebSocket not ready:', openAIWs.readyState);
          socket.send(JSON.stringify({
            type: 'error',
            message: 'OpenAI connection not ready'
          }));
        }
      } catch (error) {
        console.error('Error processing client message:', error);
        socket.send(JSON.stringify({
          type: 'error',
          message: error.message
        }));
      }
    };

    // Forward messages from OpenAI to client
    openAIWs.on('message', (message) => {
      try {
        console.log('Received from OpenAI:', message);
        socket.send(message);
      } catch (error) {
        console.error('Error forwarding OpenAI message:', error);
      }
    });

    // Handle WebSocket errors
    openAIWs.on('error', (error) => {
      console.error('OpenAI WebSocket error:', error);
      socket.send(JSON.stringify({
        type: 'error',
        message: 'OpenAI connection error'
      }));
    });

    socket.onerror = (error) => {
      console.error('Client WebSocket error:', error);
    };

    // Handle connection close
    socket.onclose = () => {
      console.log('Client disconnected');
      openAIWs.close();
    };

    openAIWs.on('close', () => {
      console.log('OpenAI connection closed');
      socket.close();
    });

    return response;
  } catch (error) {
    console.error('Error in WebSocket handler:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});