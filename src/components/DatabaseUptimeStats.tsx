import { cn } from '@/lib/utils';
import { Activity, Clock, Zap, Users, Globe } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PingIndicator } from './PingIndicator';
import { useMemo } from 'react';

interface DatabaseUptimeStatsProps {
  isOnline: boolean;
  currentPing: number | null;
}

interface UptimeData {
  period: string;
  label: string;
  hours: number;
  uptime: number | null;
  checks: number;
  avgPlayers: number;
  avgPing: number | null;
}

// Nepal timezone offset: UTC+5:45
const getNepalTime = () => {
  return new Date().toLocaleString('en-US', { 
    timeZone: 'Asia/Kathmandu',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true 
  });
};

const getNepalDate = () => {
  return new Date().toLocaleDateString('en-US', { 
    timeZone: 'Asia/Kathmandu',
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

export const DatabaseUptimeStats = ({ isOnline, currentPing }: DatabaseUptimeStatsProps) => {
  // Fetch uptime stats for different periods
  const { data: stats, isLoading } = useQuery({
    queryKey: ['uptime-stats'],
    queryFn: async () => {
      const periods = [
        { name: '24h', label: 'Daily (24h)', hours: 24 },
        { name: '7d', label: 'Weekly (7d)', hours: 168 },
        { name: '30d', label: 'Monthly (30d)', hours: 720 },
      ];

      const results: UptimeData[] = [];

      for (const period of periods) {
        const { data, error } = await supabase
          .rpc('get_uptime_stats', { hours_back: period.hours });

        if (error) {
          console.error('Error fetching uptime stats:', error);
          results.push({
            period: period.name,
            label: period.label,
            hours: period.hours,
            uptime: null,
            checks: 0,
            avgPlayers: 0,
            avgPing: null
          });
        } else if (data && data.length > 0) {
          results.push({
            period: period.name,
            label: period.label,
            hours: period.hours,
            uptime: Number(data[0].uptime_percentage),
            checks: Number(data[0].total_checks),
            avgPlayers: Number(data[0].avg_players) || 0,
            avgPing: data[0].avg_ping ? Number(data[0].avg_ping) : null
          });
        }
      }

      return results;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch recent status for the timeline
  const { data: recentChecks } = useQuery({
    queryKey: ['recent-status-checks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('server_status_history')
        .select('timestamp, is_online')
        .order('timestamp', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000,
  });

  const nepalTime = useMemo(() => getNepalTime(), []);
  const nepalDate = useMemo(() => getNepalDate(), []);

  const getUptimeColor = (uptime: number | null) => {
    if (uptime === null) return 'text-muted-foreground';
    if (uptime >= 99) return 'text-success';
    if (uptime >= 95) return 'text-success/80';
    if (uptime >= 90) return 'text-warning';
    return 'text-destructive';
  };

  const getUptimeLabel = (uptime: number | null) => {
    if (uptime === null) return 'No data';
    if (uptime >= 99.9) return 'Excellent';
    if (uptime >= 99) return 'Great';
    if (uptime >= 95) return 'Good';
    if (uptime >= 90) return 'Fair';
    return 'Poor';
  };

  const getRecentStatus = (secondsAgo: number) => {
    if (!recentChecks || recentChecks.length === 0) return null;
    
    const cutoff = new Date(Date.now() - secondsAgo * 1000);
    const relevantChecks = recentChecks.filter(check => 
      new Date(check.timestamp) >= cutoff
    );
    
    if (relevantChecks.length === 0) return null;
    return relevantChecks[0].is_online;
  };

  const getStatusColor = (status: boolean | null) => {
    if (status === null) return 'bg-muted-foreground/30';
    return status ? 'bg-success' : 'bg-destructive';
  };

  return (
    <div className="minecraft-border rounded-xl bg-card p-4 sm:p-6 card-glow">
      {/* Header with Nepal Time */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">Uptime Statistics</h3>
            <p className="text-xs text-muted-foreground">Database-backed accurate tracking</p>
          </div>
        </div>
        
        {/* Nepal Time Display */}
        <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
          <Globe className="w-4 h-4 text-primary" />
          <div className="text-xs">
            <p className="text-muted-foreground">Nepal Time (UTC+5:45)</p>
            <p className="font-semibold text-foreground">{nepalDate} • {nepalTime}</p>
          </div>
        </div>
      </div>

      {/* Ping Indicator - Prominent Position */}
      <div className="mb-4 sm:mb-6">
        <PingIndicator pingMs={currentPing} isOnline={isOnline} />
      </div>

      {/* Main Uptime Stats Grid - Enhanced */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-secondary/50 rounded-lg p-3 sm:p-4 text-center animate-pulse">
                <div className="h-4 bg-muted-foreground/20 rounded mb-2 mx-auto w-12" />
                <div className="h-6 bg-muted-foreground/20 rounded mx-auto w-16" />
              </div>
            ))}
          </>
        ) : (
          stats?.map((stat) => (
            <div key={stat.period} className="bg-secondary/50 rounded-lg p-2 sm:p-4 text-center border border-border/50">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1 font-medium">
                {stat.label}
              </p>
              <p className={cn("text-xl sm:text-3xl font-bold", getUptimeColor(stat.uptime))}>
                {stat.uptime !== null ? `${stat.uptime.toFixed(2)}%` : '--'}
              </p>
              <p className={cn("text-[10px] sm:text-xs mt-1", getUptimeColor(stat.uptime))}>
                {getUptimeLabel(stat.uptime)}
              </p>
              {stat.checks > 0 && (
                <p className="text-[8px] sm:text-[10px] text-muted-foreground mt-0.5 sm:mt-1">
                  {stat.checks.toLocaleString()} checks
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Additional Stats - Average Players & Ping */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 bg-secondary/30 rounded-lg p-2 sm:p-3 border border-border/30">
            <Users className="w-4 h-4 text-primary" />
            <div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Avg Players (24h)</p>
              <p className="text-sm sm:text-base font-semibold">{stats[0]?.avgPlayers || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-secondary/30 rounded-lg p-2 sm:p-3 border border-border/30">
            <Zap className="w-4 h-4 text-warning" />
            <div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Avg Ping (24h)</p>
              <p className="text-sm sm:text-base font-semibold">
                {stats[0]?.avgPing ? `${stats[0].avgPing}ms` : '--'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Status Timeline */}
      <div className="border-t border-border pt-4">
        <p className="text-xs sm:text-sm text-muted-foreground mb-3 font-medium">Recent Status Timeline</p>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <div className="text-center p-2 bg-secondary/20 rounded-lg">
            <div className={cn(
              "w-3 h-3 sm:w-4 sm:h-4 rounded-full mx-auto mb-1",
              getStatusColor(getRecentStatus(300)),
              getRecentStatus(300) !== null && "animate-pulse"
            )} />
            <p className="text-[10px] sm:text-xs text-muted-foreground">5 min ago</p>
          </div>
          <div className="text-center p-2 bg-secondary/20 rounded-lg">
            <div className={cn(
              "w-3 h-3 sm:w-4 sm:h-4 rounded-full mx-auto mb-1",
              getStatusColor(getRecentStatus(60)),
              getRecentStatus(60) !== null && "animate-pulse"
            )} />
            <p className="text-[10px] sm:text-xs text-muted-foreground">1 min ago</p>
          </div>
          <div className="text-center p-2 bg-secondary/20 rounded-lg">
            <div className={cn(
              "w-3 h-3 sm:w-4 sm:h-4 rounded-full mx-auto mb-1",
              getStatusColor(getRecentStatus(30)),
              getRecentStatus(30) !== null && "animate-pulse"
            )} />
            <p className="text-[10px] sm:text-xs text-muted-foreground">30 sec ago</p>
          </div>
          <div className="text-center p-2 bg-primary/10 rounded-lg border border-primary/30">
            <div className={cn(
              "w-3 h-3 sm:w-4 sm:h-4 rounded-full mx-auto mb-1",
              getStatusColor(isOnline),
              "animate-pulse"
            )} />
            <p className="text-[10px] sm:text-xs font-medium text-primary">Now</p>
          </div>
        </div>
      </div>

      {/* Current Status Banner */}
      <div className={cn(
        "mt-4 p-3 sm:p-4 rounded-lg flex items-center justify-center gap-2 sm:gap-3",
        isOnline ? "bg-success/10 border border-success/30" : "bg-destructive/10 border border-destructive/30"
      )}>
        <div className={cn(
          "w-3 h-3 sm:w-4 sm:h-4 rounded-full",
          isOnline ? "bg-success animate-pulse" : "bg-destructive animate-pulse"
        )} />
        <span className={cn(
          "font-bold text-base sm:text-lg",
          isOnline ? "text-success" : "text-destructive"
        )}>
          Server is {isOnline ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>
    </div>
  );
};