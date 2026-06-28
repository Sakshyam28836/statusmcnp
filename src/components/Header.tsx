import { RefreshCw, Sun, Moon, ExternalLink } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { useTheme } from '@/hooks/useTheme';
import { StatusType } from '@/types/server';
import { cn } from '@/lib/utils';
import mcnpLogo from '@/assets/mcnp-logo.png';

interface HeaderProps {
  status: StatusType;
  lastChecked: Date;
  onRefresh: () => void;
  isLoading: boolean;
  notificationsEnabled: boolean;
  onEnableNotifications: () => void;
}

export const Header = ({ 
  status, 
  onRefresh, 
  isLoading, 
}: HeaderProps) => {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="py-6 sm:py-8 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex items-center justify-center mb-4">
          <img 
            src={mcnpLogo} 
            alt="MCNP Network" 
            className="h-20 sm:h-24 md:h-32 object-contain"
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <StatusBadge status={status} />

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-full text-foreground text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            Refresh
          </button>

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-full text-foreground text-sm font-medium transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>

          <a
            href="https://mcnp.network"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 rounded-full text-primary-foreground text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Visit Website
          </a>
        </div>
      </div>
    </header>
  );
};
