import { useEffect, useRef, useState } from "react";
import { wsManager, type WebSocketMessage, type MessageHandler } from "../lib/websocket";

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const handlersRef = useRef<Map<string, MessageHandler>>(new Map());

  useEffect(() => {
    const authHandler = (message: WebSocketMessage) => {
      if (message.type === "authenticated") {
        setIsConnected(true);
      } else if (message.type === "auth_error") {
        setIsConnected(false);
      }
    };

    wsManager.on("authenticated", authHandler);
    wsManager.on("auth_error", authHandler);

    return () => {
      wsManager.off("authenticated", authHandler);
      wsManager.off("auth_error", authHandler);
    };
  }, []);

  const subscribe = (type: string, handler: MessageHandler) => {
    handlersRef.current.set(type, handler);
    wsManager.on(type, handler);
  };

  const unsubscribe = (type: string) => {
    const handler = handlersRef.current.get(type);
    if (handler) {
      wsManager.off(type, handler);
      handlersRef.current.delete(type);
    }
  };

  const send = (message: WebSocketMessage) => {
    wsManager.send(message);
  };

  useEffect(() => {
    return () => {
      // Clean up all handlers on unmount
      handlersRef.current.forEach((handler, type) => {
        wsManager.off(type, handler);
      });
      handlersRef.current.clear();
    };
  }, []);

  return {
    isConnected,
    subscribe,
    unsubscribe,
    send,
  };
}
