import { useServerStatus } from '@/hooks/useServerStatus';
import { Header } from '@/components/Header';
import { ServerCard } from '@/components/ServerCard';
import { StatsCard } from '@/components/StatsCard';
import { DatabaseUptimeStats } from '@/components/DatabaseUptimeStats';
import { UptimeChart } from '@/components/UptimeChart';
import { MonthlyUptimeChart } from '@/components/MonthlyUptimeChart';
import { PlayerGraph } from '@/components/PlayerGraph';
import { DailyPlayerStats } from '@/components/DailyPlayerStats';
import { StatusTimeline } from '@/components/StatusTimeline';
import { DiscordWidget } from '@/components/DiscordWidget';
import { GameModeNav } from '@/components/GameModeNav';
import { Users, Clock, Wifi, Activity } from 'lucide-react';

const Index = () => {
  const { 
    javaStatus, 
    bedrockStatus, 
    status, 
    lastChecked, 
    isLoading, 
    notificationsEnabled,
    enableNotifications,
    pingMs,
    refetch 
  } = useServerStatus(10000);

  const totalPlayers = javaStatus?.players?.online || 0;
  const maxPlayers = javaStatus?.players?.max || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header 
        status={status}
        lastChecked={lastChecked}
        onRefresh={refetch}
        isLoading={isLoading}
        notificationsEnabled={notificationsEnabled}
        onEnableNotifications={enableNotifications}
      />

      <main className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 pb-8 sm:pb-12">

        {/* Stats Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8 items-stretch">
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
            subtext="Port: 1109"
            variant={bedrockStatus?.online ? 'success' : 'destructive'}
          />
        </section>

        {/* Server Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8 items-stretch">
          <ServerCard
            title="Java Edition"
            serverData={javaStatus}
            serverAddress="mcnp.network"
            isLoading={isLoading}
          />
          <ServerCard
            title="Bedrock Edition"
            serverData={bedrockStatus}
            serverAddress="bedrock.mcnpnetwork.com:1109"
            isLoading={isLoading}
          />
        </section>

        {/* Database-backed Uptime Stats */}
        <section className="mb-4 sm:mb-6 lg:mb-8">
          <DatabaseUptimeStats isOnline={status === 'online'} currentPing={pingMs} />
        </section>

        {/* Status Timeline */}
        <section className="mb-4 sm:mb-6 lg:mb-8">
          <StatusTimeline />
        </section>

        {/* Player Count History Graph */}
        <section className="mb-4 sm:mb-6 lg:mb-8">
          <PlayerGraph />
        </section>

        {/* Daily Player Stats */}
        <section className="mb-4 sm:mb-6 lg:mb-8">
          <DailyPlayerStats />
        </section>

        {/* Weekly Uptime Chart */}
        <section className="mb-4 sm:mb-6 lg:mb-8">
          <UptimeChart />
        </section>

        {/* 30-Day Uptime Trend */}
        <section className="mb-4 sm:mb-6 lg:mb-8">
          <MonthlyUptimeChart />
        </section>

        {/* Discord & Game Modes */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8 items-stretch">
          <DiscordWidget inviteLink="https://discord.gg/XeC2sMsazu" />
          <GameModeNav />
        </section>

        {/* Footer */}
        <footer className="text-center py-4 sm:py-6 lg:py-8 border-t border-border mt-4 sm:mt-6">
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
