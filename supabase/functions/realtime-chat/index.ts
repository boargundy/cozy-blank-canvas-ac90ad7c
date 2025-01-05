import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  const upgrade = req.headers.get('upgrade') || ''
  if (upgrade.toLowerCase() != 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 400 })
  }

  // Get JWT from URL params for authentication
  const url = new URL(req.url)
  const jwt = url.searchParams.get('jwt')
  if (!jwt) {
    console.error('Auth token not provided')
    return new Response('Auth token not provided', { status: 403 })
  }

  console.log('Upgrading to WebSocket connection')
  const { socket: clientSocket, response } = Deno.upgradeWebSocket(req)

  // Connect to OpenAI's WebSocket
  console.log('Connecting to OpenAI WebSocket')
  const openaiWS = new WebSocket(
    'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01',
    ['realtime', `openai-insecure-api-key.${OPENAI_API_KEY}`, 'openai-beta.realtime-v1']
  )

  openaiWS.onopen = () => {
    console.log('Connected to OpenAI')
  }

  // Track if we've sent the session configuration
  let sessionConfigSent = false;

  // Relay messages between client and OpenAI
  clientSocket.onmessage = (e) => {
    if (openaiWS.readyState === 1) {
      console.log('Received from client:', e.data)
      const data = JSON.parse(e.data);
      
      // If we receive session.created and haven't sent config yet, send it
      if (data.type === 'session.created' && !sessionConfigSent) {
        console.log('Sending session configuration')
        const config = {
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: 'You are a Spanish language tutor. Help the student practice Spanish through conversation. Speak in Spanish but explain grammar concepts in English when needed. Be patient and encouraging.',
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 1000
            }
          }
        }
        openaiWS.send(JSON.stringify(config))
        sessionConfigSent = true;
      }
      
      openaiWS.send(e.data)
    }
  }

  openaiWS.onmessage = (e) => {
    console.log('Received from OpenAI:', e.data)
    clientSocket.send(e.data)
  }

  // Handle errors and closures
  clientSocket.onerror = (e) => console.error('Client socket error:', e)
  openaiWS.onerror = (e) => console.error('OpenAI socket error:', e)
  
  clientSocket.onclose = () => {
    console.log('Client disconnected')
    openaiWS.close()
  }
  
  openaiWS.onclose = () => {
    console.log('OpenAI disconnected')
    clientSocket.close()
  }

  return response
})