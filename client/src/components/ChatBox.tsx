import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@shared/schema';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

export function ChatBox({ messages, onSendMessage, disabled }: ChatBoxProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/90 backdrop-blur-xl border-l border-white/5 shadow-2xl">
      <div className="p-4 border-b border-white/5 bg-black/20">
        <h3 className="font-display font-bold text-lg tracking-tight">Chat</h3>
        <p className="text-xs text-muted-foreground">Messages are not saved</p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-2 opacity-50">
              <p>Say hello! 👋</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={`${msg.timestamp}-${idx}`}
              className={cn(
                "max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm break-words",
                msg.isSelf
                  ? "self-end bg-primary text-primary-foreground rounded-tr-sm"
                  : "self-start bg-zinc-800 text-zinc-100 rounded-tl-sm border border-white/5"
              )}
            >
              {msg.text}
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 bg-black/20 border-t border-white/5">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={disabled ? "Connect to chat..." : "Type a message..."}
            disabled={disabled}
            className="rounded-xl bg-zinc-800/50 border-white/10 focus:ring-primary/50 focus:border-primary/50 placeholder:text-muted-foreground/50"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={disabled || !input.trim()}
            className="rounded-xl bg-white text-black hover:bg-white/90 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
