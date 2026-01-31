import { useServerStatus } from '@/hooks/useServerStatus';
import { Header } from '@/components/Header';
import { ServerCard } from '@/components/ServerCard';
import { StatsCard } from '@/components/StatsCard';
import { DatabaseUptimeStats } from '@/components/DatabaseUptimeStats';
import { UptimeChart } from '@/components/UptimeChart';
import { PlayerList } from '@/components/PlayerList';
import { PlayerGraph } from '@/components/PlayerGraph';
import { DailyPlayerStats } from '@/components/DailyPlayerStats';
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
    pingMs,
    refetch 
  } = useServerStatus(10000);

  // Only count Java players as per user request
  const totalPlayers = javaStatus?.players?.online || 0;
  const maxPlayers = javaStatus?.players?.max || 0;

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

      <main className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 pb-8 sm:pb-12">
        {/* Navigation Links */}
        <nav className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-4 sm:mb-6 lg:mb-8">
          <NavLink to="/social" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-secondary hover:bg-secondary/80 rounded-full text-xs sm:text-sm font-medium transition-all">
            <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Social Media</span>
          </NavLink>
          <NavLink to="/staff" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-secondary hover:bg-secondary/80 rounded-full text-xs sm:text-sm font-medium transition-all">
            <UserCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Staff</span>
          </NavLink>
        </nav>

        {/* Stats Cards - Responsive Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <StatsCard
            icon={Users}
            label="Java Players"
            value={totalPlayers}
            subtext={`of ${maxPlayers || '?'} max`}
            variant={totalPlayers > 0 ? 'success' : 'default'}
          />
          <StatsCard
            icon={Activity}
            label="Server Status"
            value={status === 'online' ? 'Online' : status === 'offline' ? 'Offline' : 'Checking'}
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

        {/* Server Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
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

        {/* Player List - Only shows Java players */}
        <section className="mb-4 sm:mb-6 lg:mb-8">
          <PlayerList javaStatus={javaStatus} bedrockStatus={null} />
        </section>

        {/* Database-backed Uptime Stats with Ping */}
        <section className="mb-4 sm:mb-6 lg:mb-8">
          <DatabaseUptimeStats isOnline={status === 'online'} currentPing={pingMs} />
        </section>

        {/* Player Count History Graph - 24h hourly */}
        <section className="mb-4 sm:mb-6 lg:mb-8">
          <PlayerGraph />
        </section>

        {/* Daily Player Stats - 7 day breakdown */}
        <section className="mb-4 sm:mb-6 lg:mb-8">
          <DailyPlayerStats />
        </section>

        {/* Uptime Chart */}
        <section className="mb-4 sm:mb-6 lg:mb-8">
          <UptimeChart uptimeHistory={uptimeHistory} />
        </section>

        {/* Discord & Game Modes */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col gap-3 sm:gap-4">
            <DiscordWidget inviteLink="https://discord.gg/XeC2sMsazu" />
            
            {/* Community Discord Card */}
            <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-3 sm:p-4 lg:p-6">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-2">Community Discord</h3>
              <iframe 
                src="https://discord.com/widget?id=1342166321756115005&theme=dark" 
                width="100%" 
                height="200" 
                allowTransparency={true} 
                frameBorder="0" 
                className="rounded-lg mt-2 sm:mt-3"
                title="Discord Widget"
              ></iframe>
            </div>
          </div>
          <GameModeNav />
        </section>

        {/* Footer */}
        <footer className="text-center py-4 sm:py-6 lg:py-8 border-t border-border mt-4 sm:mt-6">
          <p className="text-muted-foreground text-[10px] sm:text-xs lg:text-sm">
            Auto-refreshes every 10 seconds • Real-time status via mcstatus.io
          </p>
          <p className="text-primary font-medium mt-1.5 sm:mt-2 text-xs sm:text-sm lg:text-base">
            Powered by MCNP Network
          </p>
          <p className="text-muted-foreground/60 text-[10px] sm:text-xs mt-1.5 sm:mt-2">
            Made by Sakshyxm • © {new Date().getFullYear()} MCNP Network
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
