import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Mic, Square } from "lucide-react";

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: () => void;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
}

const MessageInput = ({
  newMessage,
  setNewMessage,
  handleSendMessage,
  isRecording,
  startRecording,
  stopRecording,
}: MessageInputProps) => {
  return (
    <div className="p-4 border-t mt-auto">
      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <Button onClick={handleSendMessage}>
          <Send className="h-4 w-4" />
        </Button>
        <Button
          variant={isRecording ? "destructive" : "default"}
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;