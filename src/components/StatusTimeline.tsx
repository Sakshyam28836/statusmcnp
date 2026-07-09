import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { History, ArrowDown, ArrowUp, TrendingUp, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatTimeWithTz, userTimeZone } from '@/lib/formatTime';
import { useTimeMode } from '@/hooks/useTimeMode';
import { TimeModeToggle } from './TimeModeToggle';

interface TimelineEvent {
  id: string;
  type: 'online' | 'offline';
  timestamp: Date;
}

interface Row {
  id: string | number;
  timestamp: string;
  is_online: boolean;
}

type Period = '24h' | '7d' | '30d';

const PERIODS: { key: Period; label: string; hours: number }[] = [
  { key: '24h', label: '24h', hours: 24 },
  { key: '7d', label: '7 days', hours: 24 * 7 },
  { key: '30d', label: '30 days', hours: 24 * 30 },
];

const formatDuration = (ms: number) => {
  if (ms <= 0) return '0m';
  const mins = Math.floor(ms / 60000);
  const days = Math.floor(mins / (60 * 24));
  const hours = Math.floor((mins % (60 * 24)) / 60);
  const m = mins % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${m}m`;
  return `${m}m`;
};

export const StatusTimeline = () => {
  const { mode } = useTimeMode();
  const [period, setPeriod] = useState<Period>('24h');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const hours = PERIODS.find((p) => p.key === period)!.hours;
        const since = new Date(Date.now() - hours * 3600_000).toISOString();

        // Fetch rows inside the window
        const { data, error: err } = await supabase
          .from('server_status_history')
          .select('id, timestamp, is_online')
          .gte('timestamp', since)
          .order('timestamp', { ascending: true })
          .limit(10000);

        if (cancelled) return;
        if (err) {
          setError(err.message || 'Failed to load timeline');
          setRows([]);
          return;
        }

        // Fetch the single row immediately before the window so we know the
        // starting state (fixes early-segment uptime/timeline glitches).
        const { data: priorData } = await supabase
          .from('server_status_history')
          .select('id, timestamp, is_online')
          .lt('timestamp', since)
          .order('timestamp', { ascending: false })
          .limit(1);

        if (cancelled) return;

        const combined: Row[] = [];
        if (priorData && priorData.length > 0) {
          const p = priorData[0] as Row;
          // Anchor at windowStart with the prior status
          combined.push({ ...p, timestamp: since });
        }
        combined.push(...((data || []) as Row[]));
        setRows(combined);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load timeline');
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [period]);

  const { events, uptimeMs, downtimeMs, uptimePct, totalMs } = useMemo(() => {
    if (rows.length === 0) {
      return { events: [] as TimelineEvent[], uptimeMs: 0, downtimeMs: 0, uptimePct: 0, totalMs: 0 };
    }
    const hours = PERIODS.find((p) => p.key === period)!.hours;
    const windowStart = Date.now() - hours * 3600_000;
    const now = Date.now();

    const transitions: TimelineEvent[] = [];
    let up = 0;
    let down = 0;
    let prev: Row | null = null;

    for (const r of rows) {
      if (prev !== null) {
        const segStart = Math.max(new Date(prev.timestamp).getTime(), windowStart);
        const segEnd = new Date(r.timestamp).getTime();
        const dur = Math.max(0, segEnd - segStart);
        if (prev.is_online) up += dur;
        else down += dur;

        if (r.is_online !== prev.is_online) {
          transitions.push({
            id: String(r.id),
            type: r.is_online ? 'online' : 'offline',
            timestamp: new Date(r.timestamp),
          });
        }
      }
      prev = r;
    }
    // tail segment to now
    if (prev) {
      const segStart = Math.max(new Date(prev.timestamp).getTime(), windowStart);
      const dur = Math.max(0, now - segStart);
      if (prev.is_online) up += dur;
      else down += dur;
    }

    const total = up + down;
    const pct = total > 0 ? (up / total) * 100 : 0;
    return {
      events: transitions.reverse().slice(0, 12),
      uptimeMs: up,
      downtimeMs: down,
      uptimePct: pct,
      totalMs: total,
    };
  }, [rows, period]);

  return (
    <div className="minecraft-border rounded-xl bg-card p-4 sm:p-6 card-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <History className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">Uptime Timeline</h3>
            <p className="text-xs text-muted-foreground">
              Online / offline events • {mode === 'utc' ? 'UTC' : userTimeZone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <TimeModeToggle />
          <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary border border-border">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                  period === p.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>


      {/* Stat pills */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
        <div className="p-2.5 sm:p-3 rounded-lg border border-border bg-secondary/40">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground mb-1">
            <TrendingUp className="w-3 h-3" />
            Uptime
          </div>
          <div className="text-sm sm:text-lg font-bold text-success tabular-nums">
            {totalMs > 0 ? `${uptimePct.toFixed(2)}%` : '—'}
          </div>
        </div>
        <div className="p-2.5 sm:p-3 rounded-lg border border-border bg-secondary/40">
          <div className="text-[10px] sm:text-xs text-muted-foreground mb-1">Online</div>
          <div className="text-sm sm:text-lg font-bold text-foreground tabular-nums">
            {formatDuration(uptimeMs)}
          </div>
        </div>
        <div className="p-2.5 sm:p-3 rounded-lg border border-border bg-secondary/40">
          <div className="text-[10px] sm:text-xs text-muted-foreground mb-1">Offline</div>
          <div className="text-sm sm:text-lg font-bold text-foreground tabular-nums">
            {formatDuration(downtimeMs)}
          </div>
        </div>
      </div>

      {/* Uptime bar */}
      {totalMs > 0 && (
        <div className="mb-4">
          <div className="h-2 w-full rounded-full bg-destructive/30 overflow-hidden">
            <div
              className="h-full bg-success"
              style={{ width: `${uptimePct}%` }}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted/40 rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}. Retrying automatically…</span>
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No status changes in this period — server has been stable.
        </p>
      ) : (
        <ol className="relative border-l border-border ml-3 space-y-3">
          {events.map((e) => (
            <li key={e.id} className="ml-4">
              <span
                className={cn(
                  'absolute -left-[7px] flex items-center justify-center w-3.5 h-3.5 rounded-full ring-4 ring-card',
                  e.type === 'online' ? 'bg-success' : 'bg-destructive'
                )}
              />
              <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-2 min-w-0">
                  {e.type === 'online' ? (
                    <ArrowUp className="w-4 h-4 text-success shrink-0" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-destructive shrink-0" />
                  )}
                  <span className="text-sm font-medium text-foreground truncate">
                    {e.type === 'online' ? 'Server came online' : 'Server went offline'}
                  </span>
                </div>
                <div className="flex flex-col items-end shrink-0 text-right">
                  <span className="text-xs text-foreground tabular-nums">
                    {formatLocalWithTz(e.timestamp)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(e.timestamp, { addSuffix: true })}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};
