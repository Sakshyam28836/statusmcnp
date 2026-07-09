import { useState, useEffect, useCallback, useRef } from 'react';
import { ServerStatus, StatusType, ServerHistory } from '@/types/server';
import { supabase } from '@/integrations/supabase/client';

// Using mcstatus.io API for accurate status - default ports
const JAVA_API_URL = 'https://api.mcstatus.io/v2/status/java/mcnp.network:1667';
const BEDROCK_API_URL = 'https://api.mcsrvstat.us/bedrock/3/bedrock.mcnp.network:1667';

// Transform mcstatus.io response to our ServerStatus format
// Transform mcstatus.io Java response
const transformJavaResponse = (data: any): ServerStatus => {
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
    port: 1109,
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
  };
};

// Transform mcsrvstat.us Bedrock response
const transformBedrockResponse = (data: any): ServerStatus => {
  return {
    online: data.online === true,
    ip: data.ip || '',
    port: data.port || 1109,
    hostname: data.hostname || 'bedrock.mcnpnetwork.com',
    version: data.version || undefined,
    // Bedrock shares the same proxy as Java, so player count is identical
    // Don't show separate player count to avoid confusion
    players: undefined,
    motd: data.motd ? {
      raw: Array.isArray(data.motd.raw) ? data.motd.raw : [data.motd.raw || ''],
      clean: Array.isArray(data.motd.clean) ? data.motd.clean : [data.motd.clean || ''],
      html: Array.isArray(data.motd.html) ? data.motd.html : [data.motd.html || '']
    } : undefined,
    gamemode: data.gamemode || undefined,
  };
};

export interface LastCheckDetails {
  timestamp: Date;
  java: { ok: boolean; httpStatus?: number; errorType?: string };
  bedrock: { ok: boolean; httpStatus?: number; errorType?: string };
  durationMs: number;
}

export const useServerStatus = (refreshInterval = 10000) => {
  // All useState hooks first - in consistent order
  const [javaStatus, setJavaStatus] = useState<ServerStatus | null>(null);
  const [bedrockStatus, setBedrockStatus] = useState<ServerStatus | null>(null);
  const [status, setStatus] = useState<StatusType>('checking');
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [lastCheckDetails, setLastCheckDetails] = useState<LastCheckDetails | null>(null);

  const [uptimeHistory, setUptimeHistory] = useState<ServerHistory[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [pingMs, setPingMs] = useState<number | null>(null);
  
  // All useRef hooks
  const previousStatus = useRef<StatusType>('checking');
  const isFirstFetch = useRef(true);
  const discordSentRef = useRef<{ status: StatusType; timestamp: number } | null>(null);
  const lastStatsUpdateRef = useRef<number>(0);

  // Request notification permission
  const enableNotifications = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setNotificationsEnabled(granted);
      
      if (granted) {
        new Notification('🔔 MCNP Alerts Enabled!', {
          body: 'You will now receive notifications when the server status changes.',
          icon: '/favicon.png',
        });
      }
      
      return granted;
    } catch (err) {
      console.error('Failed to request notification permission:', err);
      return false;
    }
  }, []);

  // Send browser notification
  const sendBrowserNotification = useCallback((title: string, body: string) => {
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.png',
        badge: '/favicon.png',
      });
    }
  }, [notificationsEnabled]);

  // Send Discord webhook notification for status change
  const sendDiscordStatusNotification = useCallback(async (
    newStatus: 'online' | 'offline',
    playerCount?: number,
    maxPlayers?: number
  ) => {
    const now = Date.now();
    if (
      discordSentRef.current &&
      discordSentRef.current.status === newStatus &&
      now - discordSentRef.current.timestamp < 5 * 60 * 1000
    ) {
      return;
    }

    try {
      const response = await supabase.functions.invoke('discord-status-webhook', {
        body: {
          type: 'status_change',
          serverName: 'MCNP Network',
          status: newStatus,
          playerCount,
          maxPlayers,
          timestamp: new Date().toISOString()
        }
      });

      if (!response.error) {
        discordSentRef.current = { status: newStatus, timestamp: now };
      }
    } catch (err) {
      console.error('Error sending Discord notification:', err);
    }
  }, []);

  // Send email notification on status change
  const sendEmailNotification = useCallback(async (
    newStatus: 'online' | 'offline',
    playerCount?: number
  ) => {
    try {
      await supabase.functions.invoke('send-status-notification', {
        body: {
          email: 'admin@mcnpnetwork.com',
          serverName: 'MCNP Network',
          status: newStatus,
          timestamp: new Date().toISOString(),
          playerCount
        }
      });
      console.log('Email notification sent');
    } catch (err) {
      console.error('Error sending email notification:', err);
    }
  }, []);

  // Send Discord webhook for player stats (every 10 minutes)
  const sendDiscordStatsUpdate = useCallback(async (
    playerCount: number,
    maxPlayers: number,
    uptime24h?: number,
    avgPing?: number
  ) => {
    const now = Date.now();
    if (now - lastStatsUpdateRef.current < 5 * 60 * 1000) {
      return;
    }

    try {
      const response = await supabase.functions.invoke('discord-status-webhook', {
        body: {
          type: 'player_stats',
          serverName: 'MCNP Network',
          playerCount,
          maxPlayers,
          uptime24h,
          avgPing,
          timestamp: new Date().toISOString()
        }
      });

      if (!response.error) {
        lastStatsUpdateRef.current = now;
      }
    } catch (err) {
      console.error('Error sending Discord stats:', err);
    }
  }, []);

  // Status is saved by server-side cron job only (every minute)
  // Frontend no longer writes to server_status_history to avoid
  // false offline records from client-side API failures/rate limits

  // Fetch uptime stats for Discord updates
  const fetchUptimeStats = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_uptime_stats', { hours_back: 24 });
      if (error || !data || data.length === 0) return null;
      return {
        uptime: Number(data[0].uptime_percentage),
        avgPing: data[0].avg_ping ? Number(data[0].avg_ping) : undefined
      };
    } catch {
      return null;
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const pingStart = performance.now();
      const [javaRes, bedrockRes] = await Promise.allSettled([
        fetch(JAVA_API_URL, { cache: 'no-store' }),
        fetch(BEDROCK_API_URL, { cache: 'no-store' }),
      ]);
      const pingEnd = performance.now();

      const rawPing = Math.round(pingEnd - pingStart);
      setPingMs(Math.min(rawPing, 500));

      let transformedJava: ServerStatus | null = null;
      let transformedBedrock: ServerStatus | null = null;

      const javaDetail: LastCheckDetails['java'] = { ok: false };
      const bedrockDetail: LastCheckDetails['bedrock'] = { ok: false };

      if (javaRes.status === 'fulfilled') {
        javaDetail.httpStatus = javaRes.value.status;
        if (javaRes.value.ok) {
          try {
            const data = await javaRes.value.json();
            transformedJava = transformJavaResponse(data);
            javaDetail.ok = true;
          } catch (e) {
            javaDetail.errorType = 'JSON parse error';
            console.warn('Java parse failed', e);
          }
        } else {
          javaDetail.errorType = `HTTP ${javaRes.value.status} ${javaRes.value.statusText || ''}`.trim();
        }
      } else {
        const reason = javaRes.reason;
        javaDetail.errorType = reason instanceof Error
          ? `${reason.name}: ${reason.message}`
          : 'Network error';
      }

      if (bedrockRes.status === 'fulfilled') {
        bedrockDetail.httpStatus = bedrockRes.value.status;
        if (bedrockRes.value.ok) {
          try {
            const data = await bedrockRes.value.json();
            transformedBedrock = transformBedrockResponse(data);
            bedrockDetail.ok = true;
          } catch (e) {
            bedrockDetail.errorType = 'JSON parse error';
            console.warn('Bedrock parse failed', e);
          }
        } else {
          bedrockDetail.errorType = `HTTP ${bedrockRes.value.status} ${bedrockRes.value.statusText || ''}`.trim();
        }
      } else {
        const reason = bedrockRes.reason;
        bedrockDetail.errorType = reason instanceof Error
          ? `${reason.name}: ${reason.message}`
          : 'Network error';
      }

      setLastCheckDetails({
        timestamp: new Date(),
        java: javaDetail,
        bedrock: bedrockDetail,
        durationMs: rawPing,
      });


      // Keep previous state if a fetch fails - don't blank the UI
      if (transformedJava) setJavaStatus(transformedJava);
      if (transformedBedrock) setBedrockStatus(transformedBedrock);

      // Use whatever we have for status determination; if both failed, keep previous status
      const effectiveJava = transformedJava ?? javaStatus;
      if (!effectiveJava && !transformedBedrock) {
        // Total failure: don't crash, just mark check time
        setLastChecked(new Date());
        setError('Status APIs unreachable. Both Java and Bedrock status endpoints failed to respond.');
        return;
      }

      const isOnline = effectiveJava?.online ?? false;
      const javaPlayers = effectiveJava?.players?.online || 0;
      const javaMaxPlayers = effectiveJava?.players?.max || 0;
      const newStatus: StatusType = isOnline ? 'online' : 'offline';

      if (!isFirstFetch.current && previousStatus.current !== 'checking' && previousStatus.current !== newStatus) {
        if (newStatus === 'online') {
          sendBrowserNotification('🟢 MCNP Network is Online!', 'The server is now online. Join now!');
        } else {
          sendBrowserNotification('🔴 MCNP Network is Offline', 'The server has gone offline.');
        }
        sendDiscordStatusNotification(newStatus, javaPlayers, javaMaxPlayers);
        sendEmailNotification(newStatus, javaPlayers);
      }

      if (isOnline) {
        const stats = await fetchUptimeStats();
        sendDiscordStatsUpdate(javaPlayers, javaMaxPlayers, stats?.uptime, stats?.avgPing);
      }

      previousStatus.current = newStatus;
      setStatus(newStatus);
      const nowTs = new Date();
      setLastChecked(nowTs);
      setLastSuccess(nowTs);

      setUptimeHistory(prev => {
        const newEntry: ServerHistory = {
          timestamp: nowTs,
          status: isOnline ? 'online' : 'offline',
          players: javaPlayers,
        };
        return [...prev, newEntry].slice(-100);
      });

      setError(null);
    } catch (err) {
      console.error('Failed to fetch server status:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to fetch server status: ${msg}`);
      // Do NOT flip to offline on transient client errors
    } finally {
      setIsLoading(false);
      isFirstFetch.current = false;
    }
  }, [javaStatus, sendBrowserNotification, sendDiscordStatusNotification, sendDiscordStatsUpdate, sendEmailNotification, fetchUptimeStats]);

  useEffect(() => {
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
    lastSuccess,
    lastCheckDetails,
    isLoading,
    error,
    uptimeHistory,
    notificationsEnabled,
    enableNotifications,
    pingMs,
    refetch: fetchStatus
  };

};
