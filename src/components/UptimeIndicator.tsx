import { cn } from '@/lib/utils';

interface UptimeIndicatorProps {
  isOnline: boolean;
}

export const UptimeIndicator = ({ isOnline }: UptimeIndicatorProps) => {
  // Generate mock uptime data for display (last 30 checks)
  const uptimeData = Array.from({ length: 30 }, (_, i) => {
    // For demo purposes, show mostly online with occasional issues
    if (i === 0) return isOnline;
    return Math.random() > 0.1;
  }).reverse();

  const onlineCount = uptimeData.filter(Boolean).length;
  const uptimePercentage = ((onlineCount / uptimeData.length) * 100).toFixed(1);

  return (
    <div className="minecraft-border rounded-xl bg-card p-6 card-glow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">Uptime History</h3>
        <span className="text-success font-bold text-xl">{uptimePercentage}%</span>
      </div>
      
      <div className="flex gap-1 mb-3">
        {uptimeData.map((online, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 h-8 rounded-sm transition-all hover:scale-110",
              online ? "bg-success/80 hover:bg-success" : "bg-destructive/80 hover:bg-destructive"
            )}
            title={online ? "Online" : "Offline"}
          />
        ))}
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>30 checks ago</span>
        <span>Now</span>
      </div>
    </div>
  );
};
