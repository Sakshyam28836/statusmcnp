import { useState } from 'react';
import { Copy, Check, Server, Gamepad2, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IPRow {
  label: string;
  icon: typeof Server;
  address: string;
  port: number;
  badge: string;
  accent: 'primary' | 'success';
  edition: 'java' | 'bedrock';
}

const IPS: IPRow[] = [
  {
    label: 'Java Edition',
    icon: Gamepad2,
    address: 'mcnp.network',
    port: 1667,
    badge: 'Port: 1667',
    accent: 'primary',
    edition: 'java',
  },
  {
    label: 'Bedrock Edition',
    icon: Server,
    address: 'bedrock.mcnp.network',
    port: 1387,
    badge: 'Port: 1387',
    accent: 'success',
    edition: 'bedrock',
  },
];

const accentMap = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-success/10 text-success border-success/20',
};

export const ServerIPCard = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const fullAddr = (ip: IPRow) => `${ip.address}:${ip.port}`;

  const copy = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(address);
      setTimeout(() => setCopied((c) => (c === address ? null : c)), 1500);
    } catch {
      // ignore
    }
  };

  const join = (ip: IPRow) => {
    const url =
      ip.edition === 'java'
        ? `minecraft://?addExternalServer=MCNP%20Network|${ip.address}:${ip.port}`
        : `minecraft://?addExternalServer=MCNP%20Bedrock|${ip.address}:${ip.port}`;
    window.location.href = url;
    // also copy so user can paste if launcher doesn't handle protocol
    copy(fullAddr(ip));
  };

  return (
    <div className="minecraft-border rounded-xl bg-card p-4 sm:p-6 card-glow">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Server className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">Server Addresses</h3>
          <p className="text-xs text-muted-foreground">Copy the IP or click Join to launch</p>
        </div>
      </div>

      <div className="grid gap-2.5 sm:gap-3">
        {IPS.map((ip) => {
          const Icon = ip.icon;
          const full = fullAddr(ip);
          const isCopied = copied === full;
          return (
            <div
              key={full}
              className="flex items-center justify-between gap-2 p-3 sm:p-4 rounded-lg border border-border bg-secondary/40"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={cn('w-9 h-9 rounded-lg border flex items-center justify-center shrink-0', accentMap[ip.accent])}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-semibold text-foreground">{ip.label}</span>
                    <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-background text-muted-foreground border border-border">
                      {ip.badge}
                    </span>
                  </div>
                  <div className="font-mono text-xs sm:text-sm text-foreground truncate select-all">
                    {full}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => copy(full)}
                  aria-label={`Copy ${full}`}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors',
                    isCopied
                      ? 'bg-success text-success-foreground'
                      : 'bg-secondary text-foreground hover:bg-secondary/80 border border-border'
                  )}
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => join(ip)}
                  aria-label={`Join ${ip.label}`}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Join</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
