import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { History, ArrowDown, ArrowUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TimelineEvent {
  id: string;
  type: 'online' | 'offline';
  timestamp: Date;
}

export const StatusTimeline = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('server_status_history')
          .select('id, timestamp, is_online')
          .order('timestamp', { ascending: false })
          .limit(2000);

        if (error || !data || cancelled) {
          setLoading(false);
          return;
        }

        // Reverse to chronological order, then find transitions
        const chrono = [...data].reverse();
        const transitions: TimelineEvent[] = [];
        let prev: boolean | null = null;
        for (const row of chrono) {
          if (prev !== null && row.is_online !== prev) {
            transitions.push({
              id: String(row.id),
              type: row.is_online ? 'online' : 'offline',
              timestamp: new Date(row.timestamp),
            });
          }
          prev = row.is_online;
        }
        // Newest first, cap at 10
        setEvents(transitions.reverse().slice(0, 10));
      } catch (e) {
        console.warn('Timeline load failed', e);
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
  }, []);

  return (
    <div className="minecraft-border rounded-xl bg-card p-4 sm:p-6 card-glow">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-primary" />
        <h3 className="text-base sm:text-lg font-bold text-foreground">Status Timeline</h3>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted/40 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No status changes recorded yet — the server has been stable.
        </p>
      ) : (
        <ol className="relative border-l border-border ml-3 space-y-3">
          {events.map((e) => (
            <li key={e.id} className="ml-4">
              <span
                className={`absolute -left-[7px] flex items-center justify-center w-3.5 h-3.5 rounded-full ring-4 ring-card ${
                  e.type === 'online' ? 'bg-success' : 'bg-destructive'
                }`}
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
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDistanceToNow(e.timestamp, { addSuffix: true })}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};
