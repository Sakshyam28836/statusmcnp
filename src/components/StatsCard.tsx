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
    success: 'border-success/30',
    warning: 'border-warning/30',
    destructive: 'border-destructive/30',
  };

  const iconStyles = {
    default: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
  };

  return (
    <div className={cn(
      "minecraft-border rounded-xl bg-card p-5 card-glow transition-all duration-300 hover:scale-[1.02]",
      variantStyles[variant]
    )}>
      <div className="flex items-start gap-4">
        <div className={cn(
          "p-3 rounded-lg bg-muted",
          iconStyles[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-muted-foreground text-sm mb-1">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtext && (
            <p className="text-muted-foreground text-xs mt-1">{subtext}</p>
          )}
        </div>
      </div>
    </div>
  );
};
