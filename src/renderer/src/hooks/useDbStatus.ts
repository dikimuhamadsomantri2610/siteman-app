import { useState, useEffect } from 'react';

export function useDbStatus(pollIntervalMs = 30000) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    if (typeof window === 'undefined' || !window.electronAPI?.checkDbConnection) {
      setIsConnected(false);
      return;
    }
    setIsChecking(true);
    try {
      const res = await window.electronAPI.checkDbConnection();
      const ok = typeof res === 'boolean' ? res : Boolean((res as any)?.success);
      setIsConnected(ok);
    } catch {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, pollIntervalMs);
    return () => clearInterval(interval);
  }, [pollIntervalMs]);

  return { isConnected, isChecking, checkConnection };
}
