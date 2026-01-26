import { useState, useEffect, useCallback } from 'react';
import { ServerStatus, StatusType } from '@/types/server';

const JAVA_API_URL = 'https://api.mcsrvstat.us/3/play.mcnpnetwork.com';
const BEDROCK_API_URL = 'https://api.mcsrvstat.us/bedrock/3/play.mcnpnetwork.com:8188';

export const useServerStatus = (refreshInterval = 30000) => {
  const [javaStatus, setJavaStatus] = useState<ServerStatus | null>(null);
  const [bedrockStatus, setBedrockStatus] = useState<ServerStatus | null>(null);
  const [status, setStatus] = useState<StatusType>('checking');
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [javaResponse, bedrockResponse] = await Promise.all([
        fetch(JAVA_API_URL),
        fetch(BEDROCK_API_URL)
      ]);

      const javaData = await javaResponse.json();
      const bedrockData = await bedrockResponse.json();

      setJavaStatus(javaData);
      setBedrockStatus(bedrockData);
      
      // Server is online if either Java or Bedrock is online
      const isOnline = javaData.online || bedrockData.online;
      setStatus(isOnline ? 'online' : 'offline');
      setLastChecked(new Date());
    } catch (err) {
      setError('Failed to fetch server status');
      setStatus('offline');
    } finally {
      setIsLoading(false);
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
    refetch: fetchStatus
  };
};
