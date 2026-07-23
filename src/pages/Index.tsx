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
import { ServerIPCard } from '@/components/ServerIPCard';
import { DiscordWidget } from '@/components/DiscordWidget';
import { GameModeNav } from '@/components/GameModeNav';
import { LastCheckDetails } from '@/components/LastCheckDetails';
import { ManualCheckPanel } from '@/components/ManualCheckPanel';
import { EditionUptime } from '@/components/EditionUptime';
import { Users, Clock, Wifi, Activity, AlertCircle, Loader2 } from 'lucide-react';
import { formatTimeWithTz } from '@/lib/formatTime';
import { useTimeMode } from '@/hooks/useTimeMode';
import { TimeModeToggle } from '@/components/TimeModeToggle';

const Index = () => {
  const { mode: timeMode } = useTimeMode();
  const { 
    javaStatus, 
    bedrockStatus, 
    status, 
    lastChecked, 
    lastSuccess,
    lastCheckDetails,
    isLoading, 
    error,
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

        {/* Live status banner: loading or error */}
        {error ? (
          <div className="mb-4 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 text-destructive min-w-0">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-medium truncate">Couldn't reach the status API. Showing last known data.</p>
                  <p className="text-[11px] sm:text-xs text-destructive/80 mt-1 break-words">
                    {error}
                  </p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">
                    Last successful check:{' '}
                    {lastSuccess
                      ? `${formatTimeWithTz(lastSuccess, timeMode)} (${Math.max(
                          0,
                          Math.round((Date.now() - lastSuccess.getTime()) / 1000)
                        )}s ago)`
                      : 'never this session'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <TimeModeToggle />
                <button
                  onClick={refetch}
                  className="px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        ) : isLoading && !javaStatus && !bedrockStatus ? (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg border border-border bg-secondary/40 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
            <span>Fetching live server status…</span>
          </div>
        ) : null}

        {/* Compact last-check diagnostics */}
        <LastCheckDetails details={lastCheckDetails} lastSuccess={lastSuccess} />

        {/* Manual check + edition uptime */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mt-4 sm:mt-6 items-stretch">
          <ManualCheckPanel
            onRun={refetch}
            isLoading={isLoading}
            details={lastCheckDetails}
          />
          <EditionUptime />
        </section>





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
            subtext="Port: 1387"
            variant={bedrockStatus?.online ? 'success' : 'destructive'}
          />
        </section>

        {/* Server Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8 items-stretch">
          <ServerCard
            title="Java Edition"
            serverData={javaStatus}
            serverAddress="mcnp.network:1387"
            isLoading={isLoading}
          />
          <ServerCard
            title="Bedrock Edition"
            serverData={bedrockStatus}
            serverAddress="bedrock.mcnp.network:1387"
            isLoading={isLoading}
          />
        </section>

        {/* Server IPs */}
        <section className="mb-4 sm:mb-6 lg:mb-8">
          <ServerIPCard />
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
