import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

interface SocketOptions {
  autoConnect?: boolean;
}

type EventHandler = (...args: unknown[]) => void;

export const useMultiplayerSocket = (options: SocketOptions = { autoConnect: true }) => {
  const { user, getIdToken } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const autoConnect = options.autoConnect ?? true;

  useEffect(() => {
    if (!user || !autoConnect) {
      return;
    }

    let isActive = true;

    const initSocket = async () => {
      const token = await getIdToken();
      if (!isActive) {
        return;
      }

      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
      const newSocket = io(backendUrl, {
        auth: { token },
        transports: ['websocket'],
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      newSocket.on('connect', () => setIsConnected(true));
      newSocket.on('disconnect', () => setIsConnected(false));
      newSocket.on('connect_error', () => setIsConnected(false));
    };

    initSocket();

    return () => {
      isActive = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [autoConnect, getIdToken, user]);

  const emit = useCallback(
    (event: string, data?: unknown, ack?: (...args: unknown[]) => void) => {
      socketRef.current?.emit(event, data, ack);
    },
    []
  );

  const on = useCallback((event: string, handler: EventHandler) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  }, []);

  return useMemo(
    () => ({
      socket,
      isConnected,
      emit,
      on,
    }),
    [emit, isConnected, on, socket]
  );
};
