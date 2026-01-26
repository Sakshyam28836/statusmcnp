import { useServerStatus } from '@/hooks/useServerStatus';
import { Header } from '@/components/Header';
import { ServerCard } from '@/components/ServerCard';
import { StatsCard } from '@/components/StatsCard';
import { UptimeIndicator } from '@/components/UptimeIndicator';
import { GameModeNav } from '@/components/GameModeNav';
import { Users, Clock, Wifi, Activity } from 'lucide-react';

const Index = () => {
  const { 
    javaStatus, 
    bedrockStatus, 
    status, 
    lastChecked, 
    isLoading, 
    uptimeHistory,
    refetch 
  } = useServerStatus(10000); // Check every 10 seconds

  const totalPlayers = 
    (javaStatus?.players?.online || 0) + (bedrockStatus?.players?.online || 0);
  
  const maxPlayers = 
    (javaStatus?.players?.max || 0) + (bedrockStatus?.players?.max || 0);

  return (
    <div className="min-h-screen bg-background bg-grid-pattern">
      <Header 
        status={status}
        lastChecked={lastChecked}
        onRefresh={refetch}
        isLoading={isLoading}
      />

      <main className="max-w-6xl mx-auto px-4 pb-12">
        {/* Quick Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            icon={Users}
            label="Players Online"
            value={totalPlayers}
            subtext={`of ${maxPlayers || '?'} max`}
            variant={totalPlayers > 0 ? 'success' : 'default'}
          />
          <StatsCard
            icon={Activity}
            label="Server Status"
            value={status === 'online' ? 'Operational' : status === 'offline' ? 'Down' : 'Checking'}
            variant={status === 'online' ? 'success' : status === 'offline' ? 'destructive' : 'warning'}
          />
          <StatsCard
            icon={Wifi}
            label="Java Edition"
            value={javaStatus?.online ? 'Online' : 'Offline'}
            subtext={javaStatus?.version || 'N/A'}
            variant={javaStatus?.online ? 'success' : 'destructive'}
          />
          <StatsCard
            icon={Clock}
            label="Bedrock Edition"
            value={bedrockStatus?.online ? 'Online' : 'Offline'}
            subtext="Port: 8188"
            variant={bedrockStatus?.online ? 'success' : 'destructive'}
          />
        </section>

        {/* Server Cards */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ServerCard
            title="Java Edition"
            serverData={javaStatus}
            serverAddress="play.mcnpnetwork.com"
            isLoading={isLoading}
          />
          <ServerCard
            title="Bedrock Edition"
            serverData={bedrockStatus}
            serverAddress="play.mcnpnetwork.com:8188"
            isLoading={isLoading}
          />
        </section>

        {/* Uptime */}
        <section className="mb-8">
          <UptimeIndicator uptimeHistory={uptimeHistory} isOnline={status === 'online'} />
        </section>

        {/* Game Modes */}
        <section className="mb-8">
          <GameModeNav />
        </section>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-border">
          <p className="text-muted-foreground text-sm">
            Auto-refreshes every 10 seconds • Real-time status updates
          </p>
          <p className="text-primary font-medium mt-2">
            Powered by MCNP Network
          </p>
          <p className="text-muted-foreground/60 text-xs mt-2">
            Made by Sakshyxm • © {new Date().getFullYear()} MCNP Network
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
