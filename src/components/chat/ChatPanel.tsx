import { ChatMessage } from "./ChatMessage";

interface ChatPanelProps {
  messages: { role: string; content: string }[];
}

export const ChatPanel = ({ messages }: ChatPanelProps) => {
  return (
    <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
      <h2 className="text-2xl font-semibold mb-4">Chat</h2>
      <div className="h-[300px] overflow-y-auto space-y-4">
        {messages.map((message, index) => (
          <ChatMessage key={index} role={message.role} content={message.content} />
        ))}
      </div>
    </div>
  );
};