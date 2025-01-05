export interface Message {
  id: number;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  type: "text" | "audio" | "function_call";
}