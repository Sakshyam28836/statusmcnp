import { useState, useEffect, useCallback, useRef } from 'react';
import { ServerStatus, StatusType, ServerHistory } from '@/types/server';

// Using mcstatus.io API for accurate status - default ports
const JAVA_API_URL = 'https://api.mcstatus.io/v2/status/java/play.mcnpnetwork.com';
const BEDROCK_API_URL = 'https://api.mcstatus.io/v2/status/bedrock/play.mcnpnetwork.com';

// Local storage keys for persistent history
const STORAGE_KEY_HISTORY = 'mcnp_uptime_history_v2';

const loadStoredHistory = (): ServerHistory[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((entry: { timestamp: string; status: 'online' | 'offline'; players?: number }) => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      }));
    }
  } catch {
    console.log('No stored history found');
  }
  return [];
};

const saveHistory = (history: ServerHistory[]) => {
  try {
    // Keep last 24 hours worth of data (8640 entries at 10 second intervals)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const filtered = history.filter(entry => entry.timestamp > cutoff);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(filtered.slice(-8640)));
  } catch {
    console.log('Failed to save history');
  }
};

// Transform mcstatus.io response to our ServerStatus format
const transformMcStatusResponse = (data: any, isBedrock: boolean = false): ServerStatus => {
  // Extract player names from the API response
  const playerList: string[] = [];
  if (data.players?.list && Array.isArray(data.players.list)) {
    data.players.list.forEach((p: any) => {
      const name = p.name_clean || p.name_raw || p.name || null;
      if (name && name !== 'Anonymous Player') {
        playerList.push(name);
      }
    });
  }

  return {
    online: data.online === true,
    ip: data.ip_address || data.host || '',
    port: isBedrock ? 19132 : 25565,
    hostname: data.host,
    version: data.version?.name_clean || data.version?.name || undefined,
    players: data.online ? {
      online: data.players?.online || 0,
      max: data.players?.max || 0,
      list: playerList
    } : undefined,
    motd: data.motd ? {
      raw: [data.motd.raw || ''],
      clean: [data.motd.clean || ''],
      html: [data.motd.html || '']
    } : undefined,
    icon: data.icon || undefined,
    gamemode: data.gamemode || undefined,
  };
};

export const useServerStatus = (refreshInterval = 10000) => {
  const [javaStatus, setJavaStatus] = useState<ServerStatus | null>(null);
  const [bedrockStatus, setBedrockStatus] = useState<ServerStatus | null>(null);
  const [status, setStatus] = useState<StatusType>('checking');
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uptimeHistory, setUptimeHistory] = useState<ServerHistory[]>(loadStoredHistory);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const previousStatus = useRef<StatusType>('checking');
  const isFirstFetch = useRef(true);

  // Request notification permission
  const enableNotifications = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      return permission === 'granted';
    }
    return false;
  }, []);

  // Send notification
  const sendNotification = useCallback((title: string, body: string) => {
    if (notificationsEnabled && 'Notification' in window) {
      new Notification(title, {
        body,
        icon: '/favicon.png',
        badge: '/favicon.png',
      });
    }
  }, [notificationsEnabled]);

  const fetchStatus = useCallback(async () => {
    try {
      const [javaResponse, bedrockResponse] = await Promise.all([
        fetch(JAVA_API_URL, { cache: 'no-store' }),
        fetch(BEDROCK_API_URL, { cache: 'no-store' })
      ]);

      if (!javaResponse.ok || !bedrockResponse.ok) {
        throw new Error('API request failed');
      }

      const javaData = await javaResponse.json();
      const bedrockData = await bedrockResponse.json();

      // Transform with proper flag for bedrock
      const transformedJava = transformMcStatusResponse(javaData, false);
      const transformedBedrock = transformMcStatusResponse(bedrockData, true);

      setJavaStatus(transformedJava);
      setBedrockStatus(transformedBedrock);
      
      // Server status is based on Java being online (primary server)
      // Bedrock is just for display, not counted
      const isOnline = transformedJava.online;
      // Only count Java players
      const javaPlayers = transformedJava.players?.online || 0;
      const newStatus: StatusType = isOnline ? 'online' : 'offline';
      
      // Check for status change and send notification
      if (!isFirstFetch.current && previousStatus.current !== 'checking' && previousStatus.current !== newStatus) {
        if (newStatus === 'online') {
          sendNotification('🟢 MCNP Network is Online!', 'The server is now online. Join now!');
        } else {
          sendNotification('🔴 MCNP Network is Offline', 'The server has gone offline.');
        }
      }
      
      previousStatus.current = newStatus;
      setStatus(newStatus);
      setLastChecked(new Date());
      
      // Update uptime history - only count Java players
      setUptimeHistory(prev => {
        const newEntry: ServerHistory = {
          timestamp: new Date(),
          status: isOnline ? 'online' : 'offline',
          players: javaPlayers
        };
        const updated = [...prev, newEntry];
        saveHistory(updated);
        return updated;
      });

      setError(null);
    } catch (err) {
      console.error('Failed to fetch server status:', err);
      setError('Failed to fetch server status');
      
      // Don't change status on network error, keep previous
      if (isFirstFetch.current) {
        setStatus('offline');
      }
      
      setUptimeHistory(prev => {
        const newEntry: ServerHistory = {
          timestamp: new Date(),
          status: 'offline',
          players: 0
        };
        const updated = [...prev, newEntry];
        saveHistory(updated);
        return updated;
      });
    } finally {
      setIsLoading(false);
      isFirstFetch.current = false;
    }
  }, [sendNotification]);

  useEffect(() => {
    // Check if notifications are already granted
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }

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
    notificationsEnabled,
    enableNotifications,
    refetch: fetchStatus
  };
};
