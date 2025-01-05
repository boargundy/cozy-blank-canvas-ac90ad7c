import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useState } from "react";

interface Message {
  id: number;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

const dummyMessages: Message[] = [
  {
    id: 1,
    content: "Hello! I'm your AI tutor. What would you like to learn about today?",
    sender: "ai",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
  },
  {
    id: 2,
    content: "I'd like to learn about React hooks. Can you explain useState?",
    sender: "user",
    timestamp: new Date(Date.now() - 1000 * 60 * 4), // 4 minutes ago
  },
  {
    id: 3,
    content: "useState is a React Hook that lets you add state variables to your components. It returns an array with two values: the current state and a function to update it. Would you like to see an example?",
    sender: "ai",
    timestamp: new Date(Date.now() - 1000 * 60 * 3), // 3 minutes ago
  },
  {
    id: 4,
    content: "Yes, please show me an example!",
    sender: "user",
    timestamp: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
  },
  {
    id: 5,
    content: "Here's a simple example:\n\nconst [count, setCount] = useState(0);\n\nThis creates a state variable called 'count' initialized to 0, and a function 'setCount' to update it. You can use it like this:\n\n<button onClick={() => setCount(count + 1)}>Count is {count}</button>",
    sender: "ai",
    timestamp: new Date(Date.now() - 1000 * 60), // 1 minute ago
  },
];

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>(dummyMessages);
  const [newMessage, setNewMessage] = useState("");

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
        </div>
      </ScrollArea>
      
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
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;