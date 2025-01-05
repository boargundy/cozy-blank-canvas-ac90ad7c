import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Message } from "@/types/chat";

interface MessageListProps {
  messages: Message[];
  currentTranscript: string;
}

const MessageList = ({ messages, currentTranscript }: MessageListProps) => {
  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`flex gap-3 max-w-[80%] ${
                message.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <Avatar className="h-8 w-8">
                <div className={`h-full w-full flex items-center justify-center ${
                  message.sender === "user" ? "bg-primary" : "bg-secondary"
                }`}>
                  {message.sender === "user" ? "U" : "AI"}
                </div>
              </Avatar>
              <div
                className={`rounded-lg p-4 ${
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <span className="text-xs opacity-70 mt-2 block">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        ))}
        {currentTranscript && (
          <div className="flex justify-end">
            <div className="bg-muted rounded-lg p-4 max-w-[80%]">
              <p className="italic">{currentTranscript}</p>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default MessageList;