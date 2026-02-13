import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

export const StatsCard = ({ icon: Icon, label, value, subtext, variant = 'default' }: StatsCardProps) => {
  const variantStyles = {
    default: 'border-border',
    success: 'border-success/30 hover:border-success/50',
    warning: 'border-warning/30 hover:border-warning/50',
    destructive: 'border-destructive/30 hover:border-destructive/50',
  };

  const iconStyles = {
    default: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
  };

  const glowStyles = {
    default: '',
    success: 'hover:shadow-[0_0_20px_hsl(var(--success)/0.15)]',
    warning: 'hover:shadow-[0_0_20px_hsl(var(--warning)/0.15)]',
    destructive: 'hover:shadow-[0_0_20px_hsl(var(--destructive)/0.15)]',
  };

  return (
    <div className={cn(
      "minecraft-border rounded-xl bg-card p-3 sm:p-5 card-glow transition-all duration-300 hover:scale-[1.03] cursor-default",
      variantStyles[variant],
      glowStyles[variant]
    )}>
      <div className="flex items-start gap-2 sm:gap-4">
        <div className={cn(
          "p-2 sm:p-3 rounded-lg bg-muted transition-colors",
          iconStyles[variant]
        )}>
          <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-muted-foreground text-[10px] sm:text-sm mb-0.5 sm:mb-1">{label}</p>
          <p className="text-lg sm:text-2xl font-bold text-foreground truncate">{value}</p>
          {subtext && (
            <p className="text-muted-foreground text-[9px] sm:text-xs mt-0.5 sm:mt-1">{subtext}</p>
          )}
        </div>
      </div>
    </div>
  );
};
