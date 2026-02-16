import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, CalendarDays } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

export const MonthlyUptimeChart = () => {
  const { data: dailyRecords, isLoading } = useQuery({
    queryKey: ['monthly-uptime-chart'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_uptime_records')
        .select('*')
        .gte('date', thirtyDaysAgo)
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 120000,
  });

  const chartData = useMemo(() => {
    if (!dailyRecords || dailyRecords.length === 0) return [];

    return dailyRecords.map((record) => {
      const date = new Date(record.date + 'T00:00:00');
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        shortDate: date.toLocaleDateString('en-US', { day: 'numeric' }),
        uptime: Number(record.uptime_percentage),
        online: record.online_checks,
        total: record.total_checks,
        avgPlayers: Number(record.avg_players),
        peakPlayers: record.peak_players,
        avgPing: record.avg_ping,
      };
    });
  }, [dailyRecords]);

  const stats = useMemo(() => {
    if (!chartData.length) return { avg: 0, min: 0, perfect: 0 };
    const uptimes = chartData.map(d => d.uptime);
    return {
      avg: Math.round(uptimes.reduce((a, b) => a + b, 0) / uptimes.length * 10) / 10,
      min: Math.min(...uptimes),
      perfect: uptimes.filter(u => u >= 99.9).length,
    };
  }, [chartData]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="minecraft-border rounded-xl bg-card p-4 sm:p-6 card-glow"
      >
        <div className="flex items-center gap-3 mb-4">
          <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <h3 className="text-base sm:text-lg font-bold text-foreground">30-Day Uptime Trend</h3>
        </div>
        <div className="h-48 sm:h-64 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading trend data...</div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="minecraft-border rounded-xl bg-card p-4 sm:p-6 card-glow"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">30-Day Uptime Trend</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Daily server reliability over the last month</p>
          </div>
        </div>
        <div className="flex gap-3 sm:gap-5">
          <div className="text-left sm:text-right">
            <motion.span
              key={stats.avg}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`font-bold text-lg sm:text-xl ${
                stats.avg >= 99 ? 'text-success' :
                stats.avg >= 90 ? 'text-success' :
                stats.avg >= 70 ? 'text-warning' : 'text-destructive'
              }`}
            >
              {stats.avg}%
            </motion.span>
            <p className="text-[9px] sm:text-xs text-muted-foreground">avg</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="font-bold text-lg sm:text-xl text-primary">{stats.perfect}</span>
            <p className="text-[9px] sm:text-xs text-muted-foreground">perfect days</p>
          </div>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="h-48 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
              <XAxis
                dataKey="shortDate"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
                interval={Math.max(0, Math.floor(chartData.length / 8) - 1)}
              />
              <YAxis
                domain={[
                  (dataMin: number) => Math.max(0, Math.floor(dataMin - 5)),
                  100,
                ]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
                width={35}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border border-border rounded-lg p-2 sm:p-3 shadow-lg">
                        <p className="font-medium text-foreground text-sm">{data.date}</p>
                        <p className={`text-base sm:text-lg font-bold ${
                          data.uptime >= 99 ? 'text-success' :
                          data.uptime >= 90 ? 'text-success' :
                          data.uptime >= 70 ? 'text-warning' : 'text-destructive'
                        }`}>
                          {data.uptime.toFixed(2)}% uptime
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {data.online}/{data.total} checks passed
                        </p>
                        <div className="flex gap-3 mt-1">
                          <p className="text-[10px] sm:text-xs text-primary">
                            Avg: {data.avgPlayers} players
                          </p>
                          <p className="text-[10px] sm:text-xs text-primary">
                            Peak: {data.peakPlayers}
                          </p>
                        </div>
                        {data.avgPing && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                            Avg ping: {data.avgPing}ms
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="uptime"
                stroke="hsl(142, 76%, 36%)"
                strokeWidth={2}
                fill="url(#uptimeGradient)"
                dot={false}
                activeDot={{ r: 4, fill: 'hsl(142, 76%, 36%)', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center text-muted-foreground">
          <p className="text-sm">No uptime data available yet. Data aggregates daily.</p>
        </div>
      )}

      {/* Streak indicator */}
      {chartData.length > 0 && (
        <div className="flex items-center gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border">
          <TrendingUp className="w-4 h-4 text-success" />
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            <span className="text-success font-semibold">{stats.perfect}</span> out of{' '}
            <span className="font-semibold">{chartData.length}</span> days with 99.9%+ uptime
            {stats.min < 99 && (
              <span> • Lowest: <span className="text-warning font-semibold">{stats.min.toFixed(1)}%</span></span>
            )}
          </p>
        </div>
      )}
    </motion.div>
  );
};
