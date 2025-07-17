import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAuth } from "@/hooks/use-auth";
import { type Message } from "@shared/schema";

interface MessageViewProps {
  groupId: number;
  onClose: () => void;
}

export function MessageView({ groupId, onClose }: MessageViewProps) {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { subscribe, unsubscribe, send } = useWebSocket();
  const queryClient = useQueryClient();

  const { data: groupData } = useQuery({
    queryKey: ["/api/notification/groups", groupId],
    queryFn: async () => {
      const response = await fetch(`/api/notification/groups/${groupId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("sessionToken")}`,
        },
      });
      return response.json();
    },
  });

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ["/api/notification/messages", groupId],
    queryFn: async () => {
      const response = await fetch(`/api/notification/messages/${groupId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("sessionToken")}`,
        },
      });
      return response.json();
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch("/api/notification/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("sessionToken")}`,
        },
        body: JSON.stringify({
          groupId,
          content,
        }),
      });
      return response.json();
    },
  });

  useEffect(() => {
    if (messagesData?.messages) {
      setMessages(messagesData.messages);
    }
  }, [messagesData]);

  useEffect(() => {
    const handleNewMessage = (data: any) => {
      if (data.groupId === groupId) {
        setMessages(prev => [...prev, data.message]);
      }
    };

    subscribe("new_message", handleNewMessage);

    return () => {
      unsubscribe("new_message");
    };
  }, [groupId, subscribe, unsubscribe]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      send({
        type: "send_message",
        groupId,
        content: newMessage,
      });
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {groupData?.group?.name || "Group Chat"}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <i className="fas fa-times"></i>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {messages.map((message: any, index: number) => {
            const isOwn = message.senderId === user?.employeeId;
            const prevMessage = messages[index - 1];
            const showDate = !prevMessage || 
              formatDate(message.createdAt) !== formatDate(prevMessage.createdAt);

            return (
              <div key={message.id}>
                {showDate && (
                  <div className="text-center text-xs text-muted-foreground py-2">
                    {formatDate(message.createdAt)}
                  </div>
                )}
                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {!isOwn && (
                      <div className="text-xs font-medium mb-1">
                        {message.senderName}
                      </div>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <div className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground/70'}`}>
                      {formatTime(message.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
            <i className="fas fa-paper-plane"></i>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
