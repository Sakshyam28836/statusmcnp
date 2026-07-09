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
  // Fetch last 7 days from pre-aggregated daily_uptime_records table.
  // This avoids the raw-history 1000-row cap that was truncating the chart
  // to only the two oldest days.
  const { data: dailyStats, isLoading } = useQuery({
    queryKey: ['daily-player-stats-agg'],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      const { data, error } = await supabase
        .from('daily_uptime_records')
        .select('date, avg_players, peak_players, total_checks')
        .gte('date', since)
        .order('date', { ascending: true });

      if (error) throw error;

      const result: DailyStats[] = (data || []).map((row) => {
        // Date column is a date string (YYYY-MM-DD); render label without TZ shift.
        const d = new Date(`${row.date}T12:00:00`);
        return {
          date: row.date as string,
          dayName: d.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }),
          avgPlayers: Math.round(Number(row.avg_players ?? 0) * 10) / 10,
          peakPlayers: Number(row.peak_players ?? 0),
          checks: Number(row.total_checks ?? 0),
        };
      });

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
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">Daily Player Stats</h3>
            <p className="text-xs text-muted-foreground">Last 7 days • Nepal Time</p>
          </div>
        </div>

        {/* Weekly Summary Pills */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-success/10 text-success border border-success/20 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>Week Peak {weeklyTotals.peakPlayers}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
            <Users className="w-3 h-3" />
            <span>Week Avg {weeklyTotals.avgPlayers}</span>
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
