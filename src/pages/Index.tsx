import { useServerStatus } from '@/hooks/useServerStatus';
import { Header } from '@/components/Header';
import { ServerCard } from '@/components/ServerCard';
import { StatsCard } from '@/components/StatsCard';
import { UptimeStats } from '@/components/UptimeStats';
import { UptimeChart } from '@/components/UptimeChart';
import { PlayerList } from '@/components/PlayerList';
import { DiscordWidget } from '@/components/DiscordWidget';
import { GameModeNav } from '@/components/GameModeNav';
import { NavLink } from '@/components/NavLink';
import { Users, Clock, Wifi, Activity, Share2, UserCircle } from 'lucide-react';

const Index = () => {
  const { 
    javaStatus, 
    bedrockStatus, 
    status, 
    lastChecked, 
    isLoading, 
    uptimeHistory,
    notificationsEnabled,
    enableNotifications,
    refetch 
  } = useServerStatus(10000);

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
        notificationsEnabled={notificationsEnabled}
        onEnableNotifications={enableNotifications}
      />

      <main className="max-w-6xl mx-auto px-4 pb-12">
        <nav className="flex flex-wrap items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
          <NavLink to="/social" className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-full text-xs sm:text-sm font-medium transition-all">
            <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
            Social Media
          </NavLink>
          <NavLink to="/staff" className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-full text-xs sm:text-sm font-medium transition-all">
            <UserCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            Staff
          </NavLink>
        </nav>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
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
            subtext="Port: 19132"
            variant={bedrockStatus?.online ? 'success' : 'destructive'}
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <ServerCard
            title="Java Edition"
            serverData={javaStatus}
            serverAddress="play.mcnpnetwork.com"
            isLoading={isLoading}
          />
          <ServerCard
            title="Bedrock Edition"
            serverData={bedrockStatus}
            serverAddress="play.mcnpnetwork.com:19132"
            isLoading={isLoading}
          />
        </section>

        <section className="mb-6 sm:mb-8">
          <PlayerList javaStatus={javaStatus} bedrockStatus={bedrockStatus} />
        </section>

        <section className="mb-6 sm:mb-8">
          <UptimeStats uptimeHistory={uptimeHistory} isOnline={status === 'online'} />
        </section>

        <section className="mb-6 sm:mb-8">
          <UptimeChart uptimeHistory={uptimeHistory} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 sm:gap-6">
            <DiscordWidget inviteLink="https://discord.gg/XeC2sMsazu" />
            
            {/* Community Discord Card Integration */}
            <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-2">Community Discord</h3>
              <iframe 
                src="https://discord.com/widget?id=1342166321756115005&theme=dark" 
                width="100%" 
                height="250" 
                allowTransparency={true} 
                frameBorder="0" 
                style={{ marginTop: '15px', borderRadius: '10px' }}
              ></iframe>
            </div>
          </div>
          <GameModeNav />
        </section>

        <footer className="text-center py-6 sm:py-8 border-t border-border">
          <p className="text-muted-foreground text-xs sm:text-sm">
            Auto-refreshes every 10 seconds • Real-time status updates
          </p>
          <p className="text-primary font-medium mt-2 text-sm sm:text-base">
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
