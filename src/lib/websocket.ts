import { supabase } from "@/integrations/supabase/client";

export const setupWebSocketConnection = async () => {
  console.log('Setting up WebSocket connection...');
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error('No active session found');
    return null;
  }

  try {
    console.log('Creating WebSocket connection with authentication...');
    const ws = new WebSocket(
      `wss://florxlmkxjzferdcavht.functions.supabase.co/functions/v1/realtime-chat?jwt=${session.access_token}`
    );
    
    ws.onopen = () => {
      console.log('WebSocket connection established');
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
    return null;
  }
};