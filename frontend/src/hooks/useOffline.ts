import { useState, useEffect, useCallback } from 'react';
import { offlineStorage } from '../services/offlineStorage.service';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    // Écouter les changements de connexion
    const cleanup = offlineStorage.onConnectionChange((online) => {
      setIsOnline(online);
    });

    // Charger les données initiales
    setPendingCount(offlineStorage.getPendingCount());
    setLastSync(offlineStorage.getLastSync());

    return cleanup;
  }, []);

  const refreshPendingCount = useCallback(() => {
    setPendingCount(offlineStorage.getPendingCount());
  }, []);

  const updateLastSync = useCallback(() => {
    offlineStorage.updateLastSync();
    setLastSync(new Date());
  }, []);

  return {
    isOnline,
    pendingCount,
    lastSync,
    refreshPendingCount,
    updateLastSync,
    offlineStorage,
  };
}

export default useOffline;
