import React from 'react';

interface ChatMessageProps {
  role: string;
  content: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ role, content }) => {
  return (
    <div
      className={`p-3 rounded-lg ${
        role === 'user'
          ? 'bg-primary text-primary-foreground ml-auto'
          : 'bg-muted'
      } max-w-[80%] ${role === 'user' ? 'ml-auto' : 'mr-auto'}`}
    >
      {content}
    </div>
  );
};