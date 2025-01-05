export interface Message {
  id: number;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}