import { useState } from 'react';
import { Copy, Check, Server, Gamepad2, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IPRow {
  label: string;
  icon: typeof Server;
  address: string;
  badge?: string;
  accent: 'primary' | 'success' | 'warning';
}

const IPS: IPRow[] = [
  {
    label: 'Java Edition',
    icon: Gamepad2,
    address: 'mcnp.network',
    badge: 'Default Port',
    accent: 'primary',
  },
  {
    label: 'Bedrock Edition',
    icon: Server,
    address: 'bedrock.mcnpnetwork.com',
    badge: 'Port: 1109',
    accent: 'success',
  },
  {
    label: 'Alt / Proxy',
    icon: Globe,
    address: 'play.mcnpnetwork.com:8188',
    badge: 'Proxy',
    accent: 'warning',
  },
];

const accentMap = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
};

export const ServerIPCard = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(address);
      setTimeout(() => setCopied((c) => (c === address ? null : c)), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="minecraft-border rounded-xl bg-card p-4 sm:p-6 card-glow">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Server className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">Server Addresses</h3>
          <p className="text-xs text-muted-foreground">Tap to copy & join</p>
        </div>
      </div>

      <div className="grid gap-2.5 sm:gap-3">
        {IPS.map((ip) => {
          const Icon = ip.icon;
          const isCopied = copied === ip.address;
          return (
            <div
              key={ip.address}
              className="flex items-center justify-between gap-2 p-3 sm:p-4 rounded-lg border border-border bg-secondary/40"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={cn('w-9 h-9 rounded-lg border flex items-center justify-center shrink-0', accentMap[ip.accent])}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-semibold text-foreground">{ip.label}</span>
                    {ip.badge && (
                      <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-background text-muted-foreground border border-border">
                        {ip.badge}
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-xs sm:text-sm text-foreground truncate select-all">
                    {ip.address}
                  </div>
                </div>
              </div>
              <button
                onClick={() => copy(ip.address)}
                aria-label={`Copy ${ip.address}`}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0',
                  isCopied
                    ? 'bg-success text-success-foreground'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
