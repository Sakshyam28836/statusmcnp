import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PingIndicatorProps {
  pingMs: number | null;
  isOnline: boolean;
}

export const PingIndicator = ({ pingMs, isOnline }: PingIndicatorProps) => {
  const getPingColor = () => {
    if (!isOnline || pingMs === null) return 'text-muted-foreground';
    if (pingMs < 100) return 'text-success';
    if (pingMs < 200) return 'text-success/80';
    if (pingMs < 500) return 'text-warning';
    return 'text-destructive';
  };

  const getPingLabel = () => {
    if (!isOnline) return 'Offline';
    if (pingMs === null) return 'Measuring...';
    if (pingMs < 100) return 'Excellent';
    if (pingMs < 200) return 'Good';
    if (pingMs < 500) return 'Fair';
    return 'Poor';
  };

  const getBars = () => {
    if (!isOnline || pingMs === null) return 0;
    if (pingMs < 100) return 4;
    if (pingMs < 200) return 3;
    if (pingMs < 500) return 2;
    return 1;
  };

  const bars = getBars();

  return (
    <div className="flex items-center gap-2 sm:gap-3 bg-secondary/50 rounded-lg px-3 sm:px-4 py-2 sm:py-3">
      <div className="relative">
        {isOnline ? (
          <Wifi className={cn("w-4 h-4 sm:w-5 sm:h-5", getPingColor())} />
        ) : (
          <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
        )}
      </div>
      
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Signal bars */}
          <div className="flex items-end gap-0.5 h-3 sm:h-4">
            {[1, 2, 3, 4].map((bar) => (
              <div
                key={bar}
                className={cn(
                  "w-1 sm:w-1.5 rounded-sm transition-all",
                  bar <= bars ? getPingColor().replace('text-', 'bg-') : 'bg-muted-foreground/30'
                )}
                style={{ height: `${bar * 3 + 2}px` }}
              />
            ))}
          </div>
          
          <span className={cn("text-xs sm:text-sm font-medium", getPingColor())}>
            {pingMs !== null && isOnline ? `${pingMs}ms` : '--'}
          </span>
        </div>
        
        <span className="text-[10px] sm:text-xs text-muted-foreground">
          {getPingLabel()}
        </span>
      </div>
    </div>
  );
};