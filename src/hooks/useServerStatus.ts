import { useState, useEffect, useCallback, useRef } from 'react';
import { ServerStatus, StatusType, ServerHistory } from '@/types/server';
import { supabase } from '@/integrations/supabase/client';

// Using mcstatus.io API for accurate status - default ports
const JAVA_API_URL = 'https://api.mcstatus.io/v2/status/java/play.mcnpnetwork.com';
const BEDROCK_API_URL = 'https://api.mcstatus.io/v2/status/bedrock/play.mcnpnetwork.com';

// Email to receive status notifications
const NOTIFICATION_EMAIL = 'admin@mcnpnetwork.com';

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
  const [uptimeHistory, setUptimeHistory] = useState<ServerHistory[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const previousStatus = useRef<StatusType>('checking');
  const isFirstFetch = useRef(true);
  const emailSentRef = useRef<{ status: StatusType; timestamp: number } | null>(null);

  // Request notification permission
  const enableNotifications = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      return permission === 'granted';
    }
    return false;
  }, []);

  // Send browser notification
  const sendBrowserNotification = useCallback((title: string, body: string) => {
    if (notificationsEnabled && 'Notification' in window) {
      new Notification(title, {
        body,
        icon: '/favicon.png',
        badge: '/favicon.png',
      });
    }
  }, [notificationsEnabled]);

  // Send email notification via edge function
  const sendEmailNotification = useCallback(async (
    newStatus: 'online' | 'offline',
    playerCount?: number
  ) => {
    // Prevent duplicate emails within 5 minutes
    const now = Date.now();
    if (
      emailSentRef.current &&
      emailSentRef.current.status === newStatus &&
      now - emailSentRef.current.timestamp < 5 * 60 * 1000
    ) {
      console.log('Skipping duplicate email notification');
      return;
    }

    try {
      const response = await supabase.functions.invoke('send-status-notification', {
        body: {
          email: NOTIFICATION_EMAIL,
          serverName: 'MCNP Network',
          status: newStatus,
          timestamp: new Date().toISOString(),
          playerCount
        }
      });

      if (response.error) {
        console.error('Failed to send email notification:', response.error);
      } else {
        console.log('Email notification sent successfully');
        emailSentRef.current = { status: newStatus, timestamp: now };
      }
    } catch (err) {
      console.error('Error sending email notification:', err);
    }
  }, []);

  // Save status to database
  const saveStatusToDatabase = useCallback(async (
    isOnline: boolean,
    javaPlayers: number,
    javaMaxPlayers: number,
    bedrockOnline: boolean,
    ping: number | null
  ) => {
    try {
      await supabase
        .from('server_status_history')
        .insert({
          is_online: isOnline,
          java_players: javaPlayers,
          java_max_players: javaMaxPlayers,
          bedrock_online: bedrockOnline,
          ping_ms: ping
        });
    } catch (err) {
      console.error('Failed to save status to database:', err);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      // Measure ping time
      const startTime = performance.now();
      
      const [javaResponse, bedrockResponse] = await Promise.all([
        fetch(JAVA_API_URL, { cache: 'no-store' }),
        fetch(BEDROCK_API_URL, { cache: 'no-store' })
      ]);

      const endTime = performance.now();
      const measuredPing = Math.round(endTime - startTime);
      setPingMs(measuredPing);

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
      const isOnline = transformedJava.online;
      // Only count Java players
      const javaPlayers = transformedJava.players?.online || 0;
      const javaMaxPlayers = transformedJava.players?.max || 0;
      const newStatus: StatusType = isOnline ? 'online' : 'offline';
      
      // Save to database for accurate historical tracking
      await saveStatusToDatabase(
        isOnline,
        javaPlayers,
        javaMaxPlayers,
        transformedBedrock.online,
        measuredPing
      );
      
      // Check for status change and send notifications
      if (!isFirstFetch.current && previousStatus.current !== 'checking' && previousStatus.current !== newStatus) {
        if (newStatus === 'online') {
          sendBrowserNotification('🟢 MCNP Network is Online!', 'The server is now online. Join now!');
          // Send email notification
          sendEmailNotification('online', javaPlayers);
        } else {
          sendBrowserNotification('🔴 MCNP Network is Offline', 'The server has gone offline.');
          // Send email notification
          sendEmailNotification('offline');
        }
      }
      
      previousStatus.current = newStatus;
      setStatus(newStatus);
      setLastChecked(new Date());
      
      // Update local uptime history for real-time display
      setUptimeHistory(prev => {
        const newEntry: ServerHistory = {
          timestamp: new Date(),
          status: isOnline ? 'online' : 'offline',
          players: javaPlayers
        };
        // Keep only last 100 entries in memory
        const updated = [...prev, newEntry].slice(-100);
        return updated;
      });

      setError(null);
    } catch (err) {
      console.error('Failed to fetch server status:', err);
      setError('Failed to fetch server status');
      setPingMs(null);
      
      // Don't change status on network error, keep previous
      if (isFirstFetch.current) {
        setStatus('offline');
      }
      
      // Still save failed check to database
      await saveStatusToDatabase(false, 0, 0, false, null);
    } finally {
      setIsLoading(false);
      isFirstFetch.current = false;
    }
  }, [sendBrowserNotification, sendEmailNotification, saveStatusToDatabase]);

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
    pingMs,
    refetch: fetchStatus
  };
};
