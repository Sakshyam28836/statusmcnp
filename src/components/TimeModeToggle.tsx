import { Globe, MapPin } from 'lucide-react';
import { useTimeMode } from '@/hooks/useTimeMode';
import { cn } from '@/lib/utils';
import { userTimeZone } from '@/lib/formatTime';

interface Props {
  className?: string;
}

export const TimeModeToggle = ({ className }: Props) => {
  const { mode, setMode } = useTimeMode();
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 p-0.5 rounded-md bg-secondary border border-border text-[10px] sm:text-xs',
        className
      )}
      role="group"
      aria-label="Time display mode"
    >
      <button
        type="button"
        onClick={() => setMode('local')}
        className={cn(
          'flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded transition-colors',
          mode === 'local'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
        title={`Local time (${userTimeZone})`}
      >
        <MapPin className="w-3 h-3" />
        Local
      </button>
      <button
        type="button"
        onClick={() => setMode('utc')}
        className={cn(
          'flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded transition-colors',
          mode === 'utc'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
        title="Coordinated Universal Time"
      >
        <Globe className="w-3 h-3" />
        UTC
      </button>
    </div>
  );
};
