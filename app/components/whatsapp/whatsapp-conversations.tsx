'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Send, User, MoreVertical, Phone, MessageSquare, Check, CheckCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  id: string;
  clientId: string;
  phone: string;
  status: string;
  lastMessageAt: string;
  client: {
    firstName: string;
    lastName: string;
    phone: string;
    profileImage?: string;
  };
  messages: Message[];
}

interface Message {
  id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  content: string;
  messageType: string;
  mediaUrl?: string;
  status: string;
  createdAt: string;
}

export default function WhatsAppConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/conversations');
      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las conversaciones',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}/messages`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    try {
      setIsSending(true);
      const response = await fetch(`/api/conversations/${selectedConversation.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });
      const data = await response.json();
      if (data.success) {
        setNewMessage('');
        fetchMessages(selectedConversation.id);
        fetchConversations(); // Update last message in list
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo enviar el mensaje',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    `${conv.client.firstName} ${conv.client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.phone.includes(searchTerm)
  );

  return (
    <div className="flex h-[calc(100vh-12rem)] bg-background border rounded-xl overflow-hidden shadow-sm">
      {/* Sidebar - Conversation List */}
      <div className="w-1/3 border-r flex flex-col bg-muted/10">
        <div className="p-4 border-b space-y-4 bg-background">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Conversaciones
            </h2>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente o teléfono..."
              className="pl-9 bg-muted/50 border-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="divide-y">
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-4 flex gap-3 cursor-pointer transition-colors hover:bg-muted/50 ${selectedConversation?.id === conv.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                >
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage src={conv.client.profileImage} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {conv.client.firstName[0]}{conv.client.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-semibold truncate">
                        {conv.client.firstName} {conv.client.lastName}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                      {conv.messages[0]?.direction === 'OUTBOUND' && <CheckCheck className="h-3 w-3" />}
                      {conv.messages[0]?.content || 'Sin mensajes'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p>No hay conversaciones disponibles</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex justify-between items-center bg-background z-10">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={selectedConversation.client.profileImage} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedConversation.client.firstName[0]}{selectedConversation.client.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold leading-none">
                    {selectedConversation.client.firstName} {selectedConversation.client.lastName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedConversation.phone}
                    </span>
                    <Badge variant="outline" className="text-[10px] h-4">CLIENTE</Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon"><User className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4 bg-muted/5">
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm relative ${
                      msg.direction === 'OUTBOUND'
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'bg-background border rounded-tl-none'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 ${
                        msg.direction === 'OUTBOUND' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        <span className="text-[10px]">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.direction === 'OUTBOUND' && (
                          msg.status === 'READ' ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t bg-background">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  placeholder="Escribe un mensaje..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-muted/50 border-none"
                  disabled={isSending}
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending}>
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
            <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">EscalaFin Chat Center</h3>
            <p className="max-w-xs text-center mt-2">
              Seleccione una conversación para comenzar a chatear con sus clientes por WhatsApp.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
