import { ServerStatus } from '@/types/server';
import { StatusBadge } from './StatusBadge';
import { Users, Gamepad2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ServerCardProps {
  title: string;
  serverData: ServerStatus | null;
  serverAddress: string;
  isLoading: boolean;
}

export const ServerCard = ({ title, serverData, serverAddress, isLoading }: ServerCardProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(serverAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMotdHtml = () => {
    if (serverData?.motd?.html && serverData.motd.html.length > 0) {
      return serverData.motd.html.join('<br/>');
    }
    if (serverData?.motd?.clean && serverData.motd.clean.length > 0) {
      return serverData.motd.clean.join('<br/>');
    }
    return 'No MOTD available';
  };

  if (isLoading) {
    return (
      <div className="minecraft-border rounded-xl bg-card p-6 card-glow">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-20 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "minecraft-border rounded-xl bg-card p-6 card-glow transition-all duration-300 hover:scale-[1.02]",
      serverData?.online ? "border-success/20" : "border-destructive/20"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Gamepad2 className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
        </div>
        <StatusBadge status={serverData?.online ? 'online' : 'offline'} />
      </div>

      {/* Server Address */}
      <div className="mb-4">
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors group w-full"
        >
          <span className="font-mono text-sm text-foreground flex-1 text-left">{serverAddress}</span>
          {copied ? (
            <Check className="w-4 h-4 text-success" />
          ) : (
            <Copy className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
        </button>
      </div>

      {/* Players */}
      {serverData?.online && serverData.players && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
          <Users className="w-5 h-5 text-primary" />
          <span className="text-foreground font-medium">
            {serverData.players.online} / {serverData.players.max} Players
          </span>
        </div>
      )}

      {/* Version */}
      {serverData?.version && (
        <div className="mb-4">
          <span className="text-muted-foreground text-sm">Version: </span>
          <span className="text-foreground font-medium">{serverData.version}</span>
        </div>
      )}

      {/* MOTD */}
      <div className="p-4 bg-muted/30 rounded-lg border border-border">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Message of the Day</p>
        <div 
          className="text-foreground font-medium leading-relaxed"
          dangerouslySetInnerHTML={{ __html: serverData?.online ? getMotdHtml() : 'Server is currently offline' }}
        />
      </div>
    </div>
  );
};
