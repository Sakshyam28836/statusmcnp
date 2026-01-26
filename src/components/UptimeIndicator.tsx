import { cn } from '@/lib/utils';
import { ServerHistory } from '@/types/server';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface UptimeIndicatorProps {
  uptimeHistory: ServerHistory[];
  isOnline: boolean;
}

export const UptimeIndicator = ({ uptimeHistory, isOnline }: UptimeIndicatorProps) => {
  // Fill empty slots with placeholder data if we don't have 30 entries yet
  const displayData = [...uptimeHistory];
  while (displayData.length < 30) {
    displayData.unshift({ timestamp: new Date(), status: 'online', players: 0 });
  }

  const onlineCount = displayData.filter(entry => entry.status === 'online').length;
  const uptimePercentage = ((onlineCount / displayData.length) * 100).toFixed(1);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="minecraft-border rounded-xl bg-card p-6 card-glow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Uptime History</h3>
          <p className="text-xs text-muted-foreground">Last 30 checks (every 10 seconds)</p>
        </div>
        <div className="text-right">
          <span className={cn(
            "font-bold text-2xl",
            parseFloat(uptimePercentage) >= 90 ? "text-success" : 
            parseFloat(uptimePercentage) >= 50 ? "text-warning" : "text-destructive"
          )}>
            {uptimePercentage}%
          </span>
          <p className="text-xs text-muted-foreground">uptime</p>
        </div>
      </div>
      
      <div className="flex gap-1 mb-3">
        {displayData.map((entry, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "flex-1 h-8 rounded-sm transition-all hover:scale-110 cursor-pointer",
                  entry.status === 'online' 
                    ? "bg-success/80 hover:bg-success" 
                    : "bg-destructive/80 hover:bg-destructive"
                )}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">
                {entry.status === 'online' ? '🟢 Online' : '🔴 Offline'}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatTime(entry.timestamp)}
              </p>
              {entry.players !== undefined && entry.status === 'online' && (
                <p className="text-xs">{entry.players} players</p>
              )}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>5 minutes ago</span>
        <span>Now</span>
      </div>

      {/* Current Status Indicator */}
      <div className={cn(
        "mt-4 p-3 rounded-lg flex items-center gap-3",
        isOnline ? "bg-success/10 border border-success/30" : "bg-destructive/10 border border-destructive/30"
      )}>
        <div className={cn(
          "w-3 h-3 rounded-full",
          isOnline ? "bg-success animate-pulse" : "bg-destructive animate-pulse"
        )} />
        <span className={cn(
          "font-medium",
          isOnline ? "text-success" : "text-destructive"
        )}>
          Server is currently {isOnline ? 'online' : 'offline'}
        </span>
      </div>
    </div>
  );
};
