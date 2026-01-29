import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PlayerDataPoint {
  timestamp: string;
  players: number;
  hour: string;
}

export const PlayerGraph = () => {
  // Fetch last 24 hours of player data from database
  const { data: playerHistory, isLoading } = useQuery({
    queryKey: ['player-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('server_status_history')
        .select('timestamp, java_players')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000, // Refetch every minute
  });

  const chartData = useMemo(() => {
    if (!playerHistory || playerHistory.length === 0) return [];

    // Group by hour for cleaner visualization
    const hourlyData = new Map<string, { total: number; count: number; max: number }>();
    
    playerHistory.forEach((entry) => {
      const date = new Date(entry.timestamp);
      const hourKey = date.toLocaleTimeString('en-US', { hour: '2-digit', hour12: true });
      
      const existing = hourlyData.get(hourKey) || { total: 0, count: 0, max: 0 };
      hourlyData.set(hourKey, {
        total: existing.total + entry.java_players,
        count: existing.count + 1,
        max: Math.max(existing.max, entry.java_players)
      });
    });

    return Array.from(hourlyData.entries()).map(([hour, data]) => ({
      hour,
      players: Math.round(data.total / data.count),
      peak: data.max
    }));
  }, [playerHistory]);

  const stats = useMemo(() => {
    if (!playerHistory || playerHistory.length === 0) {
      return { peak: 0, average: 0, current: 0 };
    }

    const players = playerHistory.map(p => p.java_players);
    return {
      peak: Math.max(...players),
      average: Math.round(players.reduce((a, b) => a + b, 0) / players.length),
      current: players[players.length - 1] || 0
    };
  }, [playerHistory]);

  if (isLoading) {
    return (
      <div className="minecraft-border rounded-xl bg-card p-4 sm:p-6 card-glow">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <h3 className="text-base sm:text-lg font-bold text-foreground">Player History</h3>
        </div>
        <div className="h-48 sm:h-64 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading player data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="minecraft-border rounded-xl bg-card p-4 sm:p-6 card-glow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">Player History</h3>
            <p className="text-xs text-muted-foreground">Last 24 hours (Java only)</p>
          </div>
        </div>
        
        {/* Stats Pills */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-success/10 text-success px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
            <TrendingUp className="w-3 h-3" />
            <span>Peak: {stats.peak}</span>
          </div>
          <div className="bg-primary/10 text-primary px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
            Avg: {stats.average}
          </div>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="h-48 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="playerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="hour" 
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
              />
              <Area
                type="monotone"
                dataKey="players"
                name="Avg Players"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#playerGradient)"
              />
              <Area
                type="monotone"
                dataKey="peak"
                name="Peak"
                stroke="hsl(var(--success))"
                strokeWidth={1}
                strokeDasharray="5 5"
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-48 sm:h-64 flex items-center justify-center text-muted-foreground">
          <p className="text-sm">No player data available yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
};