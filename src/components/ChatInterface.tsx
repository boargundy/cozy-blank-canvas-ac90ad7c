import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AudioRecorder, encodeAudioForAPI } from "@/lib/audio";
import MessageList from "./chat/MessageList";
import MessageInput from "./chat/MessageInput";
import { Message } from "@/types/chat";

class AudioQueue {
  private queue: Uint8Array[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;

  constructor() {
    this.audioContext = new AudioContext({ sampleRate: 24000 });
  }

  async addToQueue(audioData: Uint8Array) {
    this.queue.push(audioData);
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioData = this.queue.shift()!;

    try {
      const audioBuffer = await this.audioContext.decodeAudioData(audioData.buffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.onended = () => this.playNext();
      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
      this.playNext();
    }
  }
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);

  useEffect(() => {
    audioQueueRef.current = new AudioQueue();
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const setupWebSocket = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Use the correct WebSocket URL with the project ID
    const ws = new WebSocket(`wss://florxlmkxjzferdcavht.functions.supabase.co/realtime-chat`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to chat server');
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
        await audioQueueRef.current?.addToQueue(bytes);
      } else if (data.type === 'response.audio_transcript.delta') {
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.sender === 'ai') {
            return [
              ...prev.slice(0, -1),
              { ...lastMessage, content: lastMessage.content + data.delta }
            ];
          } else {
            return [
              ...prev,
              {
                id: prev.length + 1,
                content: data.delta,
                sender: 'ai',
                timestamp: new Date()
              }
            ];
          }
        });
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from chat server');
    };

    return ws;
  };

  const startRecording = async () => {
    try {
      const ws = await setupWebSocket();
      if (!ws) return;

      audioRecorderRef.current = new AudioRecorder((audioData: Float32Array) => {
        if (ws.readyState === WebSocket.OPEN) {
          const base64Audio = encodeAudioForAPI(audioData);
          ws.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64Audio
          }));
        }
      });

      await audioRecorderRef.current.start();
      setIsRecording(true);
      setCurrentTranscript("");

      // Send session configuration after connection is established
      ws.addEventListener('open', () => {
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ["text", "audio"],
            instructions: "You are a helpful AI assistant. Your responses should be clear and concise.",
            voice: "alloy",
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            input_audio_transcription: {
              model: "whisper-1"
            },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 1000
            }
          }
        }));
      });
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = async () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
    }
    setIsRecording(false);
    wsRef.current?.close();
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: messages.length + 1,
      content: newMessage,
      sender: "user",
      timestamp: new Date(),
    };
    
    setMessages([...messages, message]);
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">Chat with AI Tutor</h1>
      </div>
      
      <MessageList messages={messages} currentTranscript={currentTranscript} />
      
      <MessageInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
        isRecording={isRecording}
        startRecording={startRecording}
        stopRecording={stopRecording}
      />
    </div>
  );
};

export default ChatInterface;