import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { useMultiplayerSocket } from './useMultiplayerSocket';

type SyncState = {
  room?: unknown;
  leaderboard?: unknown[];
};

export const useMultiplayerSync = (roomId: string, userId: string) => {
  const { on, emit } = useMultiplayerSocket();
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastState, setLastState] = useState<SyncState | null>(null);

  useEffect(() => {
    const onDisconnect = () => {
      setIsReconnecting(true);
      void AsyncStorage.setItem(
        `room_${roomId}_state`,
        JSON.stringify({ roomId, userId, timestamp: Date.now() })
      );
    };

    const onReconnect = () => {
      setIsReconnecting(false);
      emit('request-sync', { roomId, userId });
    };

    const onStateSync = (fullState: unknown) => {
      setLastState((fullState || null) as SyncState | null);
    };

    const unsubDisconnect = on('disconnect', onDisconnect);
    const unsubReconnect = on('reconnect', onReconnect);
    const unsubStateSync = on('state-sync', onStateSync);

    return () => {
      unsubDisconnect();
      unsubReconnect();
      unsubStateSync();
    };
  }, [emit, on, roomId, userId]);

  return { isReconnecting, lastState };
};
