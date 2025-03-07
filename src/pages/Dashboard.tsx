import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AudioRecorder } from "@/components/audio/AudioRecorder";
import { AudioQueue } from "@/components/audio/AudioQueue";
import { RecordingControls } from "@/components/chat/RecordingControls";
import { ChatPanel } from "@/components/chat/ChatPanel";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      }
    });
  }, [navigate]);

  const startChat = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "Please sign in to start a chat",
          variant: "destructive",
        });
        return;
      }

      // Create a new chat session
      const { data: chatSession, error: chatError } = await supabase
        .from('chat_sessions')
        .insert([
          { user_id: session.user.id, tutor_type: 'spanish' }
        ])
        .select()
        .single();

      if (chatError) {
        throw chatError;
      }

      // Initialize WebSocket connection with JWT for authentication
      const ws = new WebSocket(
        `wss://florxlmkxjzferdcavht.functions.supabase.co/realtime-chat?jwt=${session.access_token}`
      );

      ws.onopen = () => {
        console.log('WebSocket connected');
        toast({
          title: "Connected",
          description: "Chat session started",
        });
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);
        
        if (data.type === 'response.audio.delta') {
          const binaryString = atob(data.delta);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          if (!audioQueueRef.current) {
            if (!audioContextRef.current) {
              audioContextRef.current = new AudioContext();
            }
            audioQueueRef.current = new AudioQueue(audioContextRef.current);
          }
          
          await audioQueueRef.current.addToQueue(bytes);
        } else if (data.type === 'response.audio_transcript.delta') {
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              // Update the last message's content
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                ...lastMessage,
                content: lastMessage.content + data.delta
              };
              return newMessages;
            } else {
              // Create a new message
              return [...prev, { role: 'assistant', content: data.delta }];
            }
          });
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "Error",
          description: "Connection error occurred",
          variant: "destructive",
        });
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        wsRef.current = null;
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: "Error",
        description: "Failed to start chat session",
        variant: "destructive",
      });
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      if (!wsRef.current) {
        await startChat();
      }
      
      recorderRef.current = new AudioRecorder((audioData) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const event = {
            type: 'input_audio_buffer.append',
            audio: btoa(String.fromCharCode.apply(null, audioData as unknown as number[]))
          };
          wsRef.current.send(JSON.stringify(event));
        }
      });
      
      try {
        await recorderRef.current.start();
        setIsRecording(true);
        toast({
          title: "Recording",
          description: "Speak now",
        });
      } catch (error) {
        console.error('Error starting recording:', error);
        toast({
          title: "Error",
          description: "Could not access microphone",
          variant: "destructive",
        });
      }
    } else {
      recorderRef.current?.stop();
      setIsRecording(false);
      toast({
        title: "Stopped",
        description: "Recording stopped",
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Spanish Tutor</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecordingControls 
          isRecording={isRecording}
          onToggleRecording={toggleRecording}
        />
        <ChatPanel messages={messages} />
      </div>
    </div>
  );
};

export default Dashboard;
