import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Calendar, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

export const UptimeChart = () => {
  // Fetch from daily_uptime_records for accurate DB-backed weekly data
  const { data: dailyRecords, isLoading } = useQuery({
    queryKey: ['weekly-uptime-chart'],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_uptime_records')
        .select('*')
        .gte('date', sevenDaysAgo)
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });

  const dailyData = useMemo(() => {
    if (!dailyRecords || dailyRecords.length === 0) return [];

    return dailyRecords.map((record) => {
      const date = new Date(record.date + 'T00:00:00');
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dayName: record.date === today ? 'Today' : record.date === yesterday ? 'Yesterday' : dayNames[date.getDay()],
        uptime: Number(record.uptime_percentage),
        online: record.online_checks,
        total: record.total_checks,
        avgPlayers: Number(record.avg_players),
        peakPlayers: record.peak_players,
      };
    });
  }, [dailyRecords]);

  const getBarColor = (uptime: number) => {
    if (uptime >= 99) return 'hsl(142, 76%, 36%)';
    if (uptime >= 90) return 'hsl(142, 76%, 46%)';
    if (uptime >= 70) return 'hsl(45, 93%, 47%)';
    if (uptime >= 50) return 'hsl(30, 93%, 47%)';
    return 'hsl(0, 84%, 60%)';
  };

  const averageUptime = useMemo(() => {
    if (!dailyData || dailyData.length === 0) return 0;
    return Math.round(dailyData.reduce((sum, d) => sum + d.uptime, 0) / dailyData.length * 10) / 10;
  }, [dailyData]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="minecraft-border rounded-xl bg-card p-4 sm:p-6 card-glow"
      >
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <h3 className="text-base sm:text-lg font-bold text-foreground">Weekly Uptime</h3>
        </div>
        <div className="h-48 sm:h-64 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading uptime data...</div>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">Weekly Uptime</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Daily availability over the last 7 days • Database-backed</p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <motion.span
            key={averageUptime}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`font-bold text-xl sm:text-2xl ${
              averageUptime >= 90 ? 'text-success' : 
              averageUptime >= 70 ? 'text-warning' : 'text-destructive'
            }`}
          >
            {averageUptime}%
          </motion.span>
          <p className="text-[10px] sm:text-xs text-muted-foreground">avg uptime</p>
        </div>
      </div>

      {dailyData.length > 0 ? (
        <>
          <div className="h-40 sm:h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                <XAxis 
                  dataKey="dayName" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  interval={0}
                />
                <YAxis 
                  domain={[0, 100]}
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
                            data.uptime >= 90 ? 'text-success' : 
                            data.uptime >= 70 ? 'text-warning' : 'text-destructive'
                          }`}>
                            {data.uptime.toFixed(2)}% uptime
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {data.online} online / {data.total} checks
                          </p>
                          <p className="text-[10px] sm:text-xs text-primary mt-1">
                            Avg: {data.avgPlayers} • Peak: {data.peakPlayers} players
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="uptime" radius={[4, 4, 0, 0]}>
                  {dailyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.uptime)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Daily breakdown */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border">
            {dailyData.map((day, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="text-center"
              >
                <p className="text-[9px] sm:text-xs text-muted-foreground">{day.date.split(' ')[1]}</p>
                <p className={`text-[10px] sm:text-sm font-bold ${
                  day.uptime >= 90 ? 'text-success' : 
                  day.uptime >= 70 ? 'text-warning' : 'text-destructive'
                }`}>
                  {day.uptime.toFixed(1)}%
                </p>
                <p className="text-[8px] text-muted-foreground">{day.peakPlayers}p</p>
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-48 flex items-center justify-center text-muted-foreground">
          <p className="text-sm">No uptime data available yet. Data aggregates daily automatically.</p>
        </div>
      )}
    </motion.div>
  );
};
