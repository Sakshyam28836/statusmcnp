import { useMemo } from 'react';
import { ServerHistory } from '@/types/server';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Calendar } from 'lucide-react';

interface UptimeChartProps {
  uptimeHistory: ServerHistory[];
}

export const UptimeChart = ({ uptimeHistory }: UptimeChartProps) => {
  // Calculate daily uptime for the last 7 days
  const dailyData = useMemo(() => {
    const now = new Date();
    const days: { date: string; dayName: string; uptime: number; online: number; total: number }[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const dayEntries = uptimeHistory.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate >= date && entryDate < nextDay;
      });
      
      const onlineCount = dayEntries.filter(e => e.status === 'online').length;
      const totalCount = dayEntries.length;
      const uptimePercent = totalCount > 0 ? (onlineCount / totalCount) * 100 : (i === 0 ? 100 : 0);
      
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      days.push({
        date: `${monthNames[date.getMonth()]} ${date.getDate()}`,
        dayName: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : dayNames[date.getDay()],
        uptime: Math.round(uptimePercent * 10) / 10,
        online: onlineCount,
        total: totalCount
      });
    }
    
    return days;
  }, [uptimeHistory]);

  const getBarColor = (uptime: number) => {
    if (uptime >= 99) return 'hsl(142, 76%, 36%)'; // success green
    if (uptime >= 90) return 'hsl(142, 76%, 46%)'; // lighter green
    if (uptime >= 70) return 'hsl(45, 93%, 47%)'; // warning yellow
    if (uptime >= 50) return 'hsl(30, 93%, 47%)'; // orange
    return 'hsl(0, 84%, 60%)'; // destructive red
  };

  const averageUptime = useMemo(() => {
    const validDays = dailyData.filter(d => d.total > 0);
    if (validDays.length === 0) return 100;
    return Math.round(validDays.reduce((sum, d) => sum + d.uptime, 0) / validDays.length * 10) / 10;
  }, [dailyData]);

  return (
    <div className="minecraft-border rounded-xl bg-card p-6 card-glow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-primary" />
          <div>
            <h3 className="text-lg font-bold text-foreground">Weekly Uptime</h3>
            <p className="text-xs text-muted-foreground">Daily availability over the last 7 days</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`font-bold text-2xl ${
            averageUptime >= 90 ? 'text-success' : 
            averageUptime >= 70 ? 'text-warning' : 'text-destructive'
          }`}>
            {averageUptime}%
          </span>
          <p className="text-xs text-muted-foreground">avg uptime</p>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="dayName" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
            />
            <YAxis 
              domain={[0, 100]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-medium text-foreground">{data.date}</p>
                      <p className={`text-lg font-bold ${
                        data.uptime >= 90 ? 'text-success' : 
                        data.uptime >= 70 ? 'text-warning' : 'text-destructive'
                      }`}>
                        {data.uptime}% uptime
                      </p>
                      {data.total > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {data.online} online / {data.total} checks
                        </p>
                      )}
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
      <div className="grid grid-cols-7 gap-2 mt-4 pt-4 border-t border-border">
        {dailyData.map((day, index) => (
          <div key={index} className="text-center">
            <p className="text-xs text-muted-foreground">{day.date.split(' ')[1]}</p>
            <p className={`text-sm font-bold ${
              day.uptime >= 90 ? 'text-success' : 
              day.uptime >= 70 ? 'text-warning' : 
              day.total === 0 ? 'text-muted-foreground' : 'text-destructive'
            }`}>
              {day.total > 0 ? `${Math.round(day.uptime)}%` : '-'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
