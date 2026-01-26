import { RefreshCw, Server } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { StatusType } from '@/types/server';
import { cn } from '@/lib/utils';

interface HeaderProps {
  status: StatusType;
  lastChecked: Date;
  onRefresh: () => void;
  isLoading: boolean;
}

export const Header = ({ status, lastChecked, onRefresh, isLoading }: HeaderProps) => {
  return (
    <header className="relative py-12 px-4 overflow-hidden">
      {/* Background glow effect */}
      <div 
        className={cn(
          "absolute inset-0 opacity-30 transition-all duration-500",
          status === 'online' ? 'bg-[radial-gradient(ellipse_at_top,hsl(var(--success)/0.3)_0%,transparent_50%)]' : 
          status === 'offline' ? 'bg-[radial-gradient(ellipse_at_top,hsl(var(--destructive)/0.3)_0%,transparent_50%)]' :
          'bg-[radial-gradient(ellipse_at_top,hsl(var(--warning)/0.3)_0%,transparent_50%)]'
        )}
      />
      
      <div className="relative max-w-4xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Server className="w-10 h-10 text-primary animate-float" />
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            <span className="text-gradient">MCNP</span>
            <span className="text-foreground"> Network</span>
          </h1>
        </div>
        
        <p className="text-muted-foreground text-lg mb-6">
          Real-time Minecraft Server Status
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <StatusBadge status={status} />
          
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-full text-foreground text-sm font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            Refresh
          </button>
        </div>

        <p className="text-muted-foreground text-xs mt-4">
          Last checked: {lastChecked.toLocaleTimeString()}
        </p>
      </div>
    </header>
  );
};
