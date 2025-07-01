
'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, X, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { chat, type ChatInput } from '@/ai/flows/drivergy-chat-flow';

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: "Hello! I'm the Drivergy assistant. How can I help you today?" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => setIsOpen(!isOpen);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const userMessage = inputValue.trim();
    if (!userMessage) return;

    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const input: ChatInput = { query: userMessage };
      const result = await chat(input);
      if (result?.response) {
        setMessages(prev => [...prev, { sender: 'bot', text: result.response }]);
      } else {
         setMessages(prev => [...prev, { sender: 'bot', text: "Sorry, I couldn't process that. Please try again." }]);
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages(prev => [...prev, { sender: 'bot', text: "I'm having some trouble right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Bubble Button */}
      <Button
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl z-50 flex items-center justify-center animate-pulse-subtle"
        aria-label="Open chat"
      >
        <MessageSquare className="h-8 w-8" />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className={cn(
          "fixed bottom-24 right-6 w-full max-w-sm h-[60vh] z-50 flex flex-col shadow-2xl rounded-xl",
          "transition-all duration-300 ease-in-out",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        )}>
          <CardHeader className="flex flex-row items-center justify-between border-b bg-primary text-primary-foreground p-4">
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6" />
              <CardTitle className="text-lg font-semibold">Drivergy Assistant</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleOpen} className="h-8 w-8 hover:bg-primary/80">
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 p-0">
             <ScrollArea className="h-full p-4" ref={scrollAreaRef as any}>
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div key={index} className={cn(
                    "flex items-start gap-3",
                    msg.sender === 'user' ? "justify-end" : "justify-start"
                  )}>
                    {msg.sender === 'bot' && (
                      <div className="p-2 bg-muted rounded-full">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[80%] rounded-xl px-4 py-2 text-sm break-all",
                      msg.sender === 'user' ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    )}>
                      {msg.text}
                    </div>
                     {msg.sender === 'user' && (
                      <div className="p-2 bg-muted rounded-full">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </div>
                ))}
                 {isLoading && (
                  <div className="flex items-start gap-3 justify-start">
                    <div className="p-2 bg-muted rounded-full">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div className="bg-muted text-foreground max-w-[80%] rounded-xl px-4 py-2 text-sm flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="p-4 border-t">
            <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about courses, prices..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
