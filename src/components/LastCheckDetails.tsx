import { CheckCircle2, XCircle, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTimeWithTz, userTimeZone } from '@/lib/formatTime';
import { useTimeMode } from '@/hooks/useTimeMode';
import { TimeModeToggle } from './TimeModeToggle';
import type { LastCheckDetails as Details } from '@/hooks/useServerStatus';

interface Props {
  details: Details | null;
  lastSuccess: Date | null;
}

const Row = ({
  label,
  ok,
  httpStatus,
  errorType,
}: {
  label: string;
  ok: boolean;
  httpStatus?: number;
  errorType?: string;
}) => (
  <div className="flex items-center justify-between gap-2 py-1.5 text-xs">
    <div className="flex items-center gap-1.5 min-w-0">
      {ok ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
      )}
      <span className="font-medium text-foreground">{label}</span>
      <span className={cn('text-[11px]', ok ? 'text-success/80' : 'text-destructive/80')}>
        {ok ? 'OK' : 'Failed'}
      </span>
    </div>
    <div className="flex items-center gap-2 min-w-0">
      {!ok && httpStatus !== undefined && (
        <span className="px-1.5 py-0.5 rounded font-mono text-[10px] tabular-nums bg-destructive/10 text-destructive border border-destructive/20">
          HTTP {httpStatus}
        </span>
      )}
      {!ok && errorType && (
        <span
          className="text-[11px] text-destructive/90 truncate max-w-[180px] sm:max-w-[260px]"
          title={errorType}
        >
          {errorType}
        </span>
      )}
    </div>
  </div>
);

export const LastCheckDetails = ({ details, lastSuccess }: Props) => {
  const { mode } = useTimeMode();
  if (!details) return null;

  return (
    <div className="mb-4 rounded-lg border border-border bg-secondary/40 p-3">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Activity className="w-3.5 h-3.5 text-primary" />
          Last check details
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {details.durationMs}ms
          </span>
          <TimeModeToggle />
        </div>
      </div>

      <div className="divide-y divide-border/60">
        <Row
          label="Java API"
          ok={details.java.ok}
          httpStatus={details.java.httpStatus}
          errorType={details.java.errorType}
        />
        <Row
          label="Bedrock API"
          ok={details.bedrock.ok}
          httpStatus={details.bedrock.httpStatus}
          errorType={details.bedrock.errorType}
        />
      </div>

      <div className="mt-2 pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-1 text-[11px] text-muted-foreground">
        <span>
          Checked at{' '}
          <span className="text-foreground tabular-nums">
            {formatTimeWithTz(details.timestamp, mode)}
          </span>
        </span>
        <span>
          Last success:{' '}
          <span className="text-foreground tabular-nums">
            {lastSuccess ? formatTimeWithTz(lastSuccess, mode) : '—'}
          </span>
        </span>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground/70">
        {mode === 'utc' ? 'Times shown in UTC.' : `Times shown in your local timezone (${userTimeZone}).`}
      </p>
    </div>
  );
};

