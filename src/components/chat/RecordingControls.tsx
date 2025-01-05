import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";

interface RecordingControlsProps {
  isRecording: boolean;
  onToggleRecording: () => void;
}

export const RecordingControls = ({ isRecording, onToggleRecording }: RecordingControlsProps) => {
  return (
    <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
      <h2 className="text-2xl font-semibold mb-4">Start Conversation</h2>
      <p className="text-muted-foreground mb-4">
        Practice Spanish with an AI tutor using voice chat.
      </p>
      <Button 
        onClick={onToggleRecording} 
        className="w-full"
        variant={isRecording ? "destructive" : "default"}
      >
        {isRecording ? (
          <>
            <MicOff className="mr-2 h-4 w-4" />
            Stop Recording
          </>
        ) : (
          <>
            <Mic className="mr-2 h-4 w-4" />
            Start Chatting
          </>
        )}
      </Button>
    </div>
  );
};