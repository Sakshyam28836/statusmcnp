import { cn } from '@/lib/utils';
import { StatusType } from '@/types/server';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const statusConfig = {
    online: {
      label: 'Online',
      dotClass: 'bg-success pulse-online',
      badgeClass: 'status-glow-online bg-success/10 border-success/30 text-success',
    },
    offline: {
      label: 'Offline',
      dotClass: 'bg-destructive pulse-offline',
      badgeClass: 'status-glow-offline bg-destructive/10 border-destructive/30 text-destructive',
    },
    checking: {
      label: 'Checking...',
      dotClass: 'bg-warning animate-pulse',
      badgeClass: 'status-glow-warning bg-warning/10 border-warning/30 text-warning',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full border font-semibold text-sm uppercase tracking-wide',
        config.badgeClass,
        className
      )}
    >
      <span className={cn('w-2.5 h-2.5 rounded-full', config.dotClass)} />
      {config.label}
    </div>
  );
};
