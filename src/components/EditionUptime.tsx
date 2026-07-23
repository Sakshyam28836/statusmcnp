import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Gauge, Server, Gamepad2 } from 'lucide-react';

type Row = { timestamp: string; is_online: boolean; bedrock_online: boolean | null };

interface Bucket {
  total: number;
  javaUp: number;
  bedrockUp: number;
  bedrockCounted: number;
}

const computeBuckets = (rows: Row[], hoursBack: number): Bucket => {
  const cutoff = Date.now() - hoursBack * 60 * 60 * 1000;
  const filtered = rows.filter((r) => new Date(r.timestamp).getTime() >= cutoff);
  const bucket: Bucket = { total: 0, javaUp: 0, bedrockUp: 0, bedrockCounted: 0 };
  for (const r of filtered) {
    bucket.total += 1;
    if (r.is_online) bucket.javaUp += 1;
    if (r.bedrock_online !== null) {
      bucket.bedrockCounted += 1;
      if (r.bedrock_online) bucket.bedrockUp += 1;
    }
  }
  return bucket;
};

const pct = (up: number, total: number): number | null => {
  if (total === 0) return null;
  return Math.round((up / total) * 10000) / 100;
};

const colorFor = (v: number | null) => {
  if (v === null) return 'text-muted-foreground';
  if (v >= 99) return 'text-success';
  if (v >= 95) return 'text-success/80';
  if (v >= 90) return 'text-warning';
  return 'text-destructive';
};

export const EditionUptime = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['edition-uptime-7d'],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('server_status_history')
        .select('timestamp, is_online, bedrock_online')
        .gte('timestamp', since)
        .order('timestamp', { ascending: false })
        .limit(20000);
      if (error) throw error;
      return (data || []) as Row[];
    },
    refetchInterval: 60000,
  });

  const day = data ? computeBuckets(data, 24) : null;
  const week = data ? computeBuckets(data, 24 * 7) : null;

  const rows = [
    {
      key: 'java',
      label: 'Java Edition',
      icon: Gamepad2,
      day: day ? pct(day.javaUp, day.total) : null,
      week: week ? pct(week.javaUp, week.total) : null,
      dayChecks: day?.total ?? 0,
      weekChecks: week?.total ?? 0,
    },
    {
      key: 'bedrock',
      label: 'Bedrock Edition',
      icon: Server,
      day: day ? pct(day.bedrockUp, day.bedrockCounted) : null,
      week: week ? pct(week.bedrockUp, week.bedrockCounted) : null,
      dayChecks: day?.bedrockCounted ?? 0,
      weekChecks: week?.bedrockCounted ?? 0,
    },
  ];

  return (
    <div className="minecraft-border rounded-xl bg-card p-4 sm:p-6 card-glow">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Gauge className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">Availability by Edition</h3>
          <p className="text-xs text-muted-foreground">Java vs Bedrock uptime — last 24h & 7d</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {rows.map((r) => (
          <div key={r.key} className="rounded-lg border border-border bg-secondary/30 p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <r.icon className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">{r.label}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md bg-background/60 border border-border/60 p-2 sm:p-3 text-center">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Last 24h</p>
                <p className={cn('text-xl sm:text-2xl font-bold', colorFor(r.day))}>
                  {isLoading ? '…' : r.day !== null ? `${r.day.toFixed(2)}%` : '--'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {r.dayChecks.toLocaleString()} checks
                </p>
              </div>
              <div className="rounded-md bg-background/60 border border-border/60 p-2 sm:p-3 text-center">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Last 7 days</p>
                <p className={cn('text-xl sm:text-2xl font-bold', colorFor(r.week))}>
                  {isLoading ? '…' : r.week !== null ? `${r.week.toFixed(2)}%` : '--'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {r.weekChecks.toLocaleString()} checks
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
