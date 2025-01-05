/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />
/// <reference types="./deno.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable not set')
}

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

  // Connect to OpenAI's WebSocket with the correct endpoint and protocols
  console.log('Connecting to OpenAI WebSocket')
  const openaiWS = new WebSocket(
    'wss://api.openai.com/v1/audio-streaming',
    ['gpt-4-turbo-preview']
  )

  openaiWS.onopen = () => {
    console.log('Connected to OpenAI')
    openaiWS.send(JSON.stringify({
      type: 'auth',
      authorization: `Bearer ${OPENAI_API_KEY}`
    }))
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
        console.log('Sending Spanish tutor session configuration')
        const config = {
          type: 'config',
          settings: {
            language: 'es',
            model: 'gpt-4-turbo-preview',
            temperature: 0.7,
            system_message: 'You are a Spanish language tutor. Help the student practice Spanish through conversation. Speak in Spanish but explain grammar concepts in English when needed. Be patient and encouraging. Keep your responses concise and focused on helping the student learn.',
            audio: {
              input: {
                format: 'webm',
                sampleRate: 48000,
                channels: 1
              },
              output: {
                format: 'mp3',
                voice: 'alloy'
              }
            }
          }
        }
        openaiWS.send(JSON.stringify(config))
        sessionConfigSent = true;
        console.log('Session configuration sent')
      }
      
      // Send the audio data to OpenAI
      if (data.type === 'input_audio_buffer.append') {
        console.log('Forwarding audio data to OpenAI')
        // Convert the audio data to the correct format if needed
        const audioData = {
          type: 'audio',
          data: data.buffer,
          timestamp: Date.now()
        }
        openaiWS.send(JSON.stringify(audioData))
      }
    }
  }

  openaiWS.onmessage = (e) => {
    console.log('Received from OpenAI:', e.data)
    
    // Forward all OpenAI responses to the client
    if (clientSocket.readyState === WebSocket.OPEN) {
      clientSocket.send(e.data)
    }
  }

  // Handle errors and closures
  clientSocket.onerror = (e) => {
    console.error('Client socket error:', e)
    // Send error message to client
    if (clientSocket.readyState === WebSocket.OPEN) {
      clientSocket.send(JSON.stringify({
        type: 'error',
        message: 'Connection error occurred'
      }))
    }
  }

  openaiWS.onerror = (e) => {
    console.error('OpenAI socket error:', e)
    // Send error message to client
    if (clientSocket.readyState === WebSocket.OPEN) {
      clientSocket.send(JSON.stringify({
        type: 'error',
        message: 'OpenAI connection error'
      }))
    }
  }
  
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