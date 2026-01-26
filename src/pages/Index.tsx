import { useServerStatus } from '@/hooks/useServerStatus';
import { Header } from '@/components/Header';
import { ServerCard } from '@/components/ServerCard';
import { StatsCard } from '@/components/StatsCard';
import { UptimeIndicator } from '@/components/UptimeIndicator';
import { UptimeChart } from '@/components/UptimeChart';
import { PlayerList } from '@/components/PlayerList';
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
    uptimeHistory,
    notificationsEnabled,
    enableNotifications,
    refetch
  } = useServerStatus(10000); // Check every 10 seconds

  const totalPlayers =
    (javaStatus?.players?.online || 0) +
    (bedrockStatus?.players?.online || 0);

  const maxPlayers =
    (javaStatus?.players?.max || 0) +
    (bedrockStatus?.players?.max || 0);

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
            value={
              status === 'online'
                ? 'Operational'
                : status === 'offline'
                ? 'Down'
                : 'Checking'
            }
            variant={
              status === 'online'
                ? 'success'
                : status === 'offline'
                ? 'destructive'
                : 'warning'
            }
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

        {/* Player List */}
        <section className="mb-8">
          <PlayerList javaStatus={javaStatus} bedrockStatus={bedrockStatus} />
        </section>

        {/* Live Status Indicator */}
        <section className="mb-8">
          <UptimeIndicator
            uptimeHistory={uptimeHistory}
            isOnline={status === 'online'}
          />
        </section>

        {/* Historical Uptime Chart */}
        <section className="mb-8">
          <UptimeChart uptimeHistory={uptimeHistory} />
        </section>

        {/* Discord + Game Modes */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <DiscordWidget inviteLink="https://discord.gg/XeC2sMsazu" />
          <GameModeNav />
        </section>

        {/* Community Discord Embed */}
        <section className="mb-10">
          <div className="bg-card border border-border rounded-xl p-5 shadow-md">
            <h3 className="text-lg font-semibold mb-4">
              Community Discord
            </h3>
            <iframe
              src="https://discord.com/widget?id=1342166321756115005&theme=dark"
              width="100%"
              height="250"
              allowTransparency={true}
              frameBorder="0"
              className="rounded-lg"
            />
          </div>
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
            Made by Sakshyam Paudel • © {new Date().getFullYear()} MCNP Network
          </p>
        </footer>
      </main>
    </div>
  );
};
