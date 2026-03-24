import { useState, useEffect, useRef, useCallback } from 'react';
import { WEBSOCKET_URL } from '../constants'; // Correct import

// Determine WS URL from HTTP URL (http -> ws, https -> wss)
const WS_URL = WEBSOCKET_URL;

interface WebSocketMessage {
  type: string;
  data: any;
}

export const useWebSocket = () => {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | undefined>(undefined); // Fix: Add initial value and type

  const connect = useCallback(() => {
    // If already connecting or connected, skip
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    console.log('🔌 Connecting to WebSocket:', WS_URL);
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('✅ WebSocket Connected');
      setIsConnected(true);
      // Clear any pending reconnects
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };

    ws.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        setLastMessage(parsedData);
      } catch (err) {
        console.error('❌ Failed to parse WS message:', err);
      }
    };

    ws.onclose = () => {
      console.log('⚠️ WebSocket Disconnected');
      setIsConnected(false);
      socketRef.current = null;
      
      // Auto-reconnect after 3 seconds
      reconnectTimeoutRef.current = window.setTimeout(() => {
        console.log('🔄 Attempting Reconnect...');
        connect();
      }, 3000);
    };

    ws.onerror = (err) => {
      console.error('❌ WebSocket Error:', err);
      ws.close();
    };

    socketRef.current = ws;
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { lastMessage, isConnected };
};
