import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { WebSocketClient } from "https://deno.land/x/websocket@v0.1.4/mod.ts";

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
    // Upgrade the HTTP request to a WebSocket connection
    const { socket, response } = Deno.upgradeWebSocket(req);
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    // Create WebSocket connection to OpenAI
    const openAIWs = new WebSocketClient('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01');
    
    openAIWs.on('open', () => {
      console.log('Connected to OpenAI WebSocket');
    });

    // Forward messages from client to OpenAI
    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received from client:', data);
        openAIWs.send(JSON.stringify({
          ...data,
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
          },
        }));
      } catch (error) {
        console.error('Error processing client message:', error);
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

    // Handle connection close
    socket.onclose = () => {
      console.log('Client disconnected');
      openAIWs.close();
    };

    return response;
  } catch (error) {
    console.error('Error in WebSocket handler:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});