import { useMemo } from 'react';
import { CalendarCheck, CheckCircle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface DailyUptime {
  date: string;
  dayName: string;
  totalChecks: number;
  onlineChecks: number;
  uptimePercent: number;
  avgPlayers: number;
  avgPing: number | null;
}

export const DailyUptimeHistory = () => {
  // Fetch last 7 days of uptime data grouped by day
  const { data: dailyUptime, isLoading } = useQuery({
    queryKey: ['daily-uptime-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('server_status_history')
        .select('timestamp, is_online, java_players, ping_ms')
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: true });
      
      if (error) throw error;
      
      // Group by Nepal date
      const dailyData = new Map<string, { 
        total: number; 
        online: number; 
        players: number; 
        pings: number[];
      }>();
      
      (data || []).forEach((entry) => {
        const date = new Date(entry.timestamp);
        const nepalDate = date.toLocaleDateString('en-CA', { 
          timeZone: 'Asia/Kathmandu'
        });
        
        const existing = dailyData.get(nepalDate) || { 
          total: 0, 
          online: 0, 
          players: 0,
          pings: []
        };
        
        existing.total += 1;
        if (entry.is_online) existing.online += 1;
        existing.players += entry.java_players;
        if (entry.ping_ms) existing.pings.push(entry.ping_ms);
        
        dailyData.set(nepalDate, existing);
      });

      // Convert to array and sort by date
      const result: DailyUptime[] = Array.from(dailyData.entries())
        .map(([dateStr, stats]) => {
          const date = new Date(dateStr + 'T00:00:00');
          const avgPing = stats.pings.length > 0 
            ? Math.round(stats.pings.reduce((a, b) => a + b, 0) / stats.pings.length)
            : null;
            
          return {
            date: dateStr,
            dayName: date.toLocaleDateString('en-US', { 
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              timeZone: 'Asia/Kathmandu'
            }),
            totalChecks: stats.total,
            onlineChecks: stats.online,
            uptimePercent: stats.total > 0 
              ? Math.round((stats.online / stats.total) * 10000) / 100 
              : 0,
            avgPlayers: Math.round(stats.players / stats.total),
            avgPing
          };
        })
        .sort((a, b) => b.date.localeCompare(a.date)); // Most recent first

      return result;
    },
    refetchInterval: 60000,
  });

  const weeklyAverage = useMemo(() => {
    if (!dailyUptime || dailyUptime.length === 0) return 0;
    const sum = dailyUptime.reduce((acc, d) => acc + d.uptimePercent, 0);
    return Math.round(sum / dailyUptime.length * 100) / 100;
  }, [dailyUptime]);

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 99) return 'text-success';
    if (uptime >= 95) return 'text-success/80';
    if (uptime >= 90) return 'text-warning';
    return 'text-destructive';
  };

  const getUptimeBg = (uptime: number) => {
    if (uptime >= 99) return 'bg-success/10';
    if (uptime >= 95) return 'bg-success/5';
    if (uptime >= 90) return 'bg-warning/10';
    return 'bg-destructive/10';
  };

  if (isLoading) {
    return (
      <div className="minecraft-border rounded-xl bg-card p-4 sm:p-6 card-glow">
        <div className="flex items-center gap-3 mb-4">
          <CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <h3 className="text-base sm:text-lg font-bold text-foreground">Daily Uptime History</h3>
        </div>
        <div className="h-48 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading history...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="minecraft-border rounded-xl bg-card p-4 sm:p-6 card-glow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">Daily Uptime History</h3>
            <p className="text-xs text-muted-foreground">Last 7 days breakdown • Nepal Time</p>
          </div>
        </div>
        
        {/* Weekly Average Badge */}
        <div className={cn(
          "px-3 py-1.5 rounded-full text-sm font-semibold",
          getUptimeBg(weeklyAverage),
          getUptimeColor(weeklyAverage)
        )}>
          Weekly Avg: {weeklyAverage}%
        </div>
      </div>

      {dailyUptime && dailyUptime.length > 0 ? (
        <div className="space-y-2">
          {dailyUptime.map((day) => (
            <div 
              key={day.date} 
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border border-border/50 transition-colors hover:bg-secondary/20",
                getUptimeBg(day.uptimePercent)
              )}
            >
              <div className="flex items-center gap-3">
                {day.uptimePercent >= 99 ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : day.uptimePercent >= 90 ? (
                  <CheckCircle className="w-5 h-5 text-warning" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
                <div>
                  <p className="font-medium text-foreground text-sm">{day.dayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {day.onlineChecks}/{day.totalChecks} checks online
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-muted-foreground">Avg Players</p>
                  <p className="text-sm font-medium text-primary">{day.avgPlayers}</p>
                </div>
                {day.avgPing && (
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground">Avg Ping</p>
                    <p className="text-sm font-medium text-warning">{day.avgPing}ms</p>
                  </div>
                )}
                <div className={cn(
                  "text-lg sm:text-xl font-bold min-w-[70px] text-right",
                  getUptimeColor(day.uptimePercent)
                )}>
                  {day.uptimePercent}%
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center text-muted-foreground">
          <p className="text-sm">No uptime history available yet.</p>
        </div>
      )}
    </div>
  );
};
