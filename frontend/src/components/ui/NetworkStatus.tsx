import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useOffline } from '../../hooks/useOffline';

export function NetworkStatus() {
  const { isOnline, pendingCount, lastSync } = useOffline();

  if (isOnline && pendingCount === 0) {
    return null; // Ne rien afficher si tout va bien
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg ${
      isOnline ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
    }`}>
      {isOnline ? (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">
            {pendingCount} ticket(s) en attente de sync
          </span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">
            Mode hors-ligne
            {pendingCount > 0 && ` (${pendingCount} en attente)`}
          </span>
        </>
      )}
    </div>
  );
}

export function OnlineIndicator() {
  const { isOnline } = useOffline();

  return (
    <div className={`flex items-center gap-1 text-xs ${
      isOnline ? 'text-green-600' : 'text-red-600'
    }`}>
      {isOnline ? (
        <Wifi className="w-3 h-3" />
      ) : (
        <WifiOff className="w-3 h-3" />
      )}
      <span>{isOnline ? 'En ligne' : 'Hors-ligne'}</span>
    </div>
  );
}

export default NetworkStatus;
