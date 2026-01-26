import { useState, useEffect, useCallback, useRef } from 'react';
import { ServerStatus, StatusType, ServerHistory } from '@/types/server';

const JAVA_API_URL = 'https://api.mcsrvstat.us/3/play.mcnpnetwork.com';
const BEDROCK_API_URL = 'https://api.mcsrvstat.us/bedrock/3/play.mcnpnetwork.com:8188';

export const useServerStatus = (refreshInterval = 10000) => {
  const [javaStatus, setJavaStatus] = useState<ServerStatus | null>(null);
  const [bedrockStatus, setBedrockStatus] = useState<ServerStatus | null>(null);
  const [status, setStatus] = useState<StatusType>('checking');
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uptimeHistory, setUptimeHistory] = useState<ServerHistory[]>([]);
  const isFirstFetch = useRef(true);

  const fetchStatus = useCallback(async () => {
    if (!isFirstFetch.current) {
      setIsLoading(false);
    }

    try {
      const [javaResponse, bedrockResponse] = await Promise.all([
        fetch(JAVA_API_URL),
        fetch(BEDROCK_API_URL)
      ]);

      const javaData = await javaResponse.json();
      const bedrockData = await bedrockResponse.json();

      setJavaStatus(javaData);
      setBedrockStatus(bedrockData);
      
      const isOnline = javaData.online || bedrockData.online;
      const totalPlayers = (javaData.players?.online || 0) + (bedrockData.players?.online || 0);
      
      setStatus(isOnline ? 'online' : 'offline');
      setLastChecked(new Date());
      
      // Update uptime history
      setUptimeHistory(prev => {
        const newEntry: ServerHistory = {
          timestamp: new Date(),
          status: isOnline ? 'online' : 'offline',
          players: totalPlayers
        };
        const updated = [...prev, newEntry].slice(-30); // Keep last 30 entries
        return updated;
      });

      setError(null);
    } catch (err) {
      setError('Failed to fetch server status');
      setStatus('offline');
      setUptimeHistory(prev => {
        const newEntry: ServerHistory = {
          timestamp: new Date(),
          status: 'offline',
          players: 0
        };
        return [...prev, newEntry].slice(-30);
      });
    } finally {
      setIsLoading(false);
      isFirstFetch.current = false;
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchStatus, refreshInterval]);

  return {
    javaStatus,
    bedrockStatus,
    status,
    lastChecked,
    isLoading,
    error,
    uptimeHistory,
    refetch: fetchStatus
  };
};
