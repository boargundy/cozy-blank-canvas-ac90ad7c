import { supabase } from "./integrations/supabase/client";

export async function setupWebSocketConnection() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No session found');
    }

    const wsUrl = `wss://florxlmkxjzferdcavht.functions.supabase.co/functions/v1/realtime-chat`;
    const ws = new WebSocket(`${wsUrl}?jwt=${session.access_token}`);

    ws.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Received message:', message);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
    };

    return ws;
  } catch (error) {
    console.error('Error setting up WebSocket:', error);
    throw error;
  }
}

// Optional: Add reconnection logic
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export function setupWebSocketWithReconnect() {
  let ws: WebSocket;

  async function connect() {
    try {
      ws = await setupWebSocketConnection();
      reconnectAttempts = 0;
    } catch (error) {
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`Reconnecting... Attempt ${reconnectAttempts}`);
        setTimeout(connect, 1000 * Math.pow(2, reconnectAttempts)); // Exponential backoff
      }
    }
  }

  connect();
  return ws;
} 