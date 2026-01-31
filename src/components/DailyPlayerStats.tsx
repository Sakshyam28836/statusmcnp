import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { CalendarDays, TrendingUp, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DailyStats {
  date: string;
  dayName: string;
  avgPlayers: number;
  peakPlayers: number;
  checks: number;
}

export const DailyPlayerStats = () => {
  // Fetch last 7 days of player data grouped by day
  const { data: dailyStats, isLoading } = useQuery({
    queryKey: ['daily-player-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('server_status_history')
        .select('timestamp, java_players')
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: true });
      
      if (error) throw error;
      
      // Group by Nepal date
      const dailyData = new Map<string, { total: number; count: number; max: number }>();
      
      (data || []).forEach((entry) => {
        const date = new Date(entry.timestamp);
        const nepalDate = date.toLocaleDateString('en-CA', { 
          timeZone: 'Asia/Kathmandu'
        }); // YYYY-MM-DD format
        
        const existing = dailyData.get(nepalDate) || { total: 0, count: 0, max: 0 };
        dailyData.set(nepalDate, {
          total: existing.total + entry.java_players,
          count: existing.count + 1,
          max: Math.max(existing.max, entry.java_players)
        });
      });

      // Convert to array and sort by date
      const result: DailyStats[] = Array.from(dailyData.entries())
        .map(([dateStr, stats]) => {
          const date = new Date(dateStr + 'T00:00:00');
          return {
            date: dateStr,
            dayName: date.toLocaleDateString('en-US', { 
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              timeZone: 'Asia/Kathmandu'
            }),
            avgPlayers: Math.round(stats.total / stats.count),
            peakPlayers: stats.max,
            checks: stats.count
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date));

      return result;
    },
    refetchInterval: 60000,
  });

  const weeklyTotals = useMemo(() => {
    if (!dailyStats || dailyStats.length === 0) {
      return { avgPlayers: 0, peakPlayers: 0, totalChecks: 0 };
    }
    
    const allAvg = dailyStats.reduce((sum, d) => sum + d.avgPlayers, 0) / dailyStats.length;
    const maxPeak = Math.max(...dailyStats.map(d => d.peakPlayers));
    const totalChecks = dailyStats.reduce((sum, d) => sum + d.checks, 0);
    
    return {
      avgPlayers: Math.round(allAvg),
      peakPlayers: maxPeak,
      totalChecks
    };
  }, [dailyStats]);

  if (isLoading) {
    return (
      <div className="minecraft-border rounded-xl bg-card p-4 sm:p-6 card-glow">
        <div className="flex items-center gap-3 mb-4">
          <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <h3 className="text-base sm:text-lg font-bold text-foreground">Daily Player Stats</h3>
        </div>
        <div className="h-48 sm:h-64 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading daily stats...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="minecraft-border rounded-xl bg-card p-4 sm:p-6 card-glow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">Daily Player Stats</h3>
            <p className="text-xs text-muted-foreground">Last 7 days • Nepal Time</p>
          </div>
        </div>
        
        {/* Weekly Summary Pills */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-success/10 text-success px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
            <TrendingUp className="w-3 h-3" />
            <span>Week Peak: {weeklyTotals.peakPlayers}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
            <Users className="w-3 h-3" />
            <span>Week Avg: {weeklyTotals.avgPlayers}</span>
          </div>
        </div>
      </div>

      {dailyStats && dailyStats.length > 0 ? (
        <>
          {/* Bar Chart */}
          <div className="h-48 sm:h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="dayName" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number, name: string) => [
                    value,
                    name === 'avgPlayers' ? 'Daily Avg' : 'Daily Peak'
                  ]}
                />
                <Legend 
                  formatter={(value) => value === 'avgPlayers' ? 'Daily Avg' : 'Daily Peak'}
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Bar 
                  dataKey="avgPlayers" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                  name="avgPlayers"
                />
                <Bar 
                  dataKey="peakPlayers" 
                  fill="hsl(var(--success))" 
                  radius={[4, 4, 0, 0]}
                  name="peakPlayers"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Stats Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Day</th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium">Avg Players</th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium">Peak Players</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">Checks</th>
                </tr>
              </thead>
              <tbody>
                {dailyStats.map((day) => (
                  <tr key={day.date} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="py-2 px-2 font-medium text-foreground">{day.dayName}</td>
                    <td className="py-2 px-2 text-center text-primary font-semibold">{day.avgPlayers}</td>
                    <td className="py-2 px-2 text-center text-success font-semibold">{day.peakPlayers}</td>
                    <td className="py-2 px-2 text-right text-muted-foreground">{day.checks.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="h-48 sm:h-64 flex items-center justify-center text-muted-foreground">
          <p className="text-sm">No daily stats available yet. Check back after a day of monitoring!</p>
        </div>
      )}
    </div>
  );
};
