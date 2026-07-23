import { RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTimeWithTz } from '@/lib/formatTime';
import { useTimeMode } from '@/hooks/useTimeMode';
import type { LastCheckDetails } from '@/hooks/useServerStatus';
import { useState } from 'react';

interface ManualCheckPanelProps {
  onRun: () => Promise<void> | void;
  isLoading: boolean;
  details: LastCheckDetails | null;
}

export const ManualCheckPanel = ({ onRun, isLoading, details }: ManualCheckPanelProps) => {
  const { mode } = useTimeMode();
  const [running, setRunning] = useState(false);

  const handleClick = async () => {
    setRunning(true);
    try {
      await onRun();
    } finally {
      setRunning(false);
    }
  };

  const busy = running || isLoading;

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
    <div className="flex items-center justify-between gap-2 rounded-md bg-background/60 border border-border/60 px-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        {ok ? (
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
        ) : (
          <XCircle className="w-4 h-4 text-destructive shrink-0" />
        )}
        <span className="text-sm font-medium text-foreground truncate">{label}</span>
      </div>
      <div className="text-xs text-muted-foreground text-right truncate">
        {ok ? (
          <span className="text-success">OK{httpStatus ? ` · ${httpStatus}` : ''}</span>
        ) : (
          <span className="text-destructive">
            {errorType || `HTTP ${httpStatus ?? '—'}`}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="minecraft-border rounded-xl bg-card p-4 sm:p-6 card-glow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">Manual Health Check</h3>
          <p className="text-xs text-muted-foreground">
            Re-test Java & Bedrock right now and see exact results
          </p>
        </div>
        <button
          onClick={handleClick}
          disabled={busy}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed'
          )}
        >
          <RefreshCw className={cn('w-4 h-4', busy && 'animate-spin')} />
          {busy ? 'Checking…' : 'Run checks now'}
        </button>
      </div>

      {details ? (
        <div className="space-y-2">
          <Row
            label="Java (mcnp.network)"
            ok={details.java.ok}
            httpStatus={details.java.httpStatus}
            errorType={details.java.errorType}
          />
          <Row
            label="Bedrock (bedrock.mcnp.network)"
            ok={details.bedrock.ok}
            httpStatus={details.bedrock.httpStatus}
            errorType={details.bedrock.errorType}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs text-muted-foreground pt-1">
            <span>Ran at {formatTimeWithTz(details.timestamp, mode)}</span>
            <span>Round-trip: {details.durationMs} ms</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No check has completed yet — press the button to run one now.
        </p>
      )}
    </div>
  );
};
