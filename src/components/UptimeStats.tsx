import { cn } from '@/lib/utils';
import { ServerHistory } from '@/types/server';
import { Activity, Clock } from 'lucide-react';
import { useMemo } from 'react';

interface UptimeStatsProps {
  uptimeHistory: ServerHistory[];
  isOnline: boolean;
}

export const UptimeStats = ({ uptimeHistory, isOnline }: UptimeStatsProps) => {
  const stats = useMemo(() => {
    const now = new Date();
    
    // Get entries for different time periods
    const getEntriesInPeriod = (minutes: number) => {
      const cutoff = new Date(now.getTime() - minutes * 60 * 1000);
      return uptimeHistory.filter(entry => new Date(entry.timestamp) >= cutoff);
    };
    
    // Get uptime percentage for a set of entries
    const getUptimePercent = (entries: ServerHistory[]) => {
      if (entries.length === 0) return null;
      const onlineCount = entries.filter(e => e.status === 'online').length;
      return Math.round((onlineCount / entries.length) * 100 * 10) / 10;
    };
    
    // Calculate 24-hour uptime
    const last24h = getEntriesInPeriod(24 * 60);
    const uptime24h = getUptimePercent(last24h);
    
    // Calculate 30-day uptime (monthly)
    const last30d = getEntriesInPeriod(30 * 24 * 60);
    const uptime30d = getUptimePercent(last30d);
    
    // Recent status checks
    const last30sec = getEntriesInPeriod(0.5); // 30 seconds
    const last1min = getEntriesInPeriod(1);
    const last5min = getEntriesInPeriod(5);
    
    // Get the most recent status
    const lastEntry = uptimeHistory.length > 0 ? uptimeHistory[uptimeHistory.length - 1] : null;
    
    return {
      uptime24h,
      uptime30d,
      checks: {
        now: isOnline,
        sec30: last30sec.length > 0 ? last30sec[last30sec.length - 1]?.status === 'online' : null,
        min1: last1min.length > 0 ? last1min.every(e => e.status === 'online') : null,
        min5: last5min.length > 0 ? last5min.every(e => e.status === 'online') : null,
      },
      totalChecks24h: last24h.length,
      totalChecks30d: last30d.length,
      lastCheck: lastEntry?.timestamp
    };
  }, [uptimeHistory, isOnline]);

  const getStatusColor = (status: boolean | null) => {
    if (status === null) return 'bg-muted-foreground/30';
    return status ? 'bg-success' : 'bg-destructive';
  };

  const getUptimeColor = (uptime: number | null) => {
    if (uptime === null) return 'text-muted-foreground';
    if (uptime >= 99) return 'text-success';
    if (uptime >= 90) return 'text-success/80';
    if (uptime >= 70) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="minecraft-border rounded-xl bg-card p-4 sm:p-6 card-glow">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        <div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">Uptime Statistics</h3>
          <p className="text-xs text-muted-foreground">Real-time server availability</p>
        </div>
      </div>

      {/* Main Uptime Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-secondary/50 rounded-lg p-3 sm:p-4 text-center">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 sm:mb-2 text-muted-foreground" />
          <p className="text-xs sm:text-sm text-muted-foreground mb-1">24 Hour Uptime</p>
          <p className={cn("text-xl sm:text-2xl font-bold", getUptimeColor(stats.uptime24h))}>
            {stats.uptime24h !== null ? `${stats.uptime24h}%` : '--'}
          </p>
          {stats.totalChecks24h > 0 && (
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              {stats.totalChecks24h} checks
            </p>
          )}
        </div>
        
        <div className="bg-secondary/50 rounded-lg p-3 sm:p-4 text-center">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 sm:mb-2 text-muted-foreground" />
          <p className="text-xs sm:text-sm text-muted-foreground mb-1">30 Day Uptime</p>
          <p className={cn("text-xl sm:text-2xl font-bold", getUptimeColor(stats.uptime30d))}>
            {stats.uptime30d !== null ? `${stats.uptime30d}%` : '--'}
          </p>
          {stats.totalChecks30d > 0 && (
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              {stats.totalChecks30d} checks
            </p>
          )}
        </div>
      </div>

      {/* Recent Status Indicators */}
      <div className="border-t border-border pt-4">
        <p className="text-xs sm:text-sm text-muted-foreground mb-3">Recent Status</p>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <div className="text-center">
            <div className={cn(
              "w-3 h-3 sm:w-4 sm:h-4 rounded-full mx-auto mb-1",
              getStatusColor(stats.checks.min5),
              stats.checks.min5 !== null && "animate-pulse"
            )} />
            <p className="text-[10px] sm:text-xs text-muted-foreground">5 min ago</p>
          </div>
          <div className="text-center">
            <div className={cn(
              "w-3 h-3 sm:w-4 sm:h-4 rounded-full mx-auto mb-1",
              getStatusColor(stats.checks.min1),
              stats.checks.min1 !== null && "animate-pulse"
            )} />
            <p className="text-[10px] sm:text-xs text-muted-foreground">1 min ago</p>
          </div>
          <div className="text-center">
            <div className={cn(
              "w-3 h-3 sm:w-4 sm:h-4 rounded-full mx-auto mb-1",
              getStatusColor(stats.checks.sec30),
              stats.checks.sec30 !== null && "animate-pulse"
            )} />
            <p className="text-[10px] sm:text-xs text-muted-foreground">30 sec ago</p>
          </div>
          <div className="text-center">
            <div className={cn(
              "w-3 h-3 sm:w-4 sm:h-4 rounded-full mx-auto mb-1",
              getStatusColor(stats.checks.now),
              "animate-pulse"
            )} />
            <p className="text-[10px] sm:text-xs font-medium text-foreground">Now</p>
          </div>
        </div>
      </div>

      {/* Current Status */}
      <div className={cn(
        "mt-4 p-2 sm:p-3 rounded-lg flex items-center justify-center gap-2 sm:gap-3",
        isOnline ? "bg-success/10 border border-success/30" : "bg-destructive/10 border border-destructive/30"
      )}>
        <div className={cn(
          "w-2 h-2 sm:w-3 sm:h-3 rounded-full",
          isOnline ? "bg-success animate-pulse" : "bg-destructive animate-pulse"
        )} />
        <span className={cn(
          "font-medium text-sm sm:text-base",
          isOnline ? "text-success" : "text-destructive"
        )}>
          Server is {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
    </div>
  );
};
