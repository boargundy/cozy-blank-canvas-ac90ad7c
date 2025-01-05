import { supabase } from "@/integrations/supabase/client";

export const setupWebSocketConnection = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error('No active session found');
    return null;
  }

  try {
    console.log('Attempting to connect to WebSocket server...');
    const ws = new WebSocket(
      `wss://florxlmkxjzferdcavht.functions.supabase.co/functions/v1/realtime-chat?jwt=${session.access_token}`
    );
    
    ws.onopen = () => {
      console.log('Connected to chat server');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = (event) => {
      console.log('Disconnected from chat server:', event.code, event.reason);
    };

    return ws;
  } catch (error) {
    console.error('Error setting up WebSocket:', error);
    return null;
  }
};