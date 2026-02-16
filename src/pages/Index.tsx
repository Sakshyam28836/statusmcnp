import { useServerStatus } from '@/hooks/useServerStatus';
import { Header } from '@/components/Header';
import { ServerCard } from '@/components/ServerCard';
import { StatsCard } from '@/components/StatsCard';
import { DatabaseUptimeStats } from '@/components/DatabaseUptimeStats';
import { UptimeChart } from '@/components/UptimeChart';
import { MonthlyUptimeChart } from '@/components/MonthlyUptimeChart';
import { PlayerList } from '@/components/PlayerList';
import { PlayerGraph } from '@/components/PlayerGraph';
import { DailyPlayerStats } from '@/components/DailyPlayerStats';
import { DiscordWidget } from '@/components/DiscordWidget';
import { GameModeNav } from '@/components/GameModeNav';
import { NavLink } from '@/components/NavLink';
import { Users, Clock, Wifi, Activity, Share2, UserCircle, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

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
        <motion.nav 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-4 sm:mb-6 lg:mb-8"
        >
          <NavLink to="/social" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-secondary hover:bg-secondary/80 rounded-full text-xs sm:text-sm font-medium transition-all hover:scale-105">
            <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Social Media</span>
          </NavLink>
          <NavLink to="/staff" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-secondary hover:bg-secondary/80 rounded-full text-xs sm:text-sm font-medium transition-all hover:scale-105">
            <UserCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Staff</span>
          </NavLink>
          <NavLink to="/events" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-secondary hover:bg-secondary/80 rounded-full text-xs sm:text-sm font-medium transition-all hover:scale-105">
            <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Events</span>
          </NavLink>
        </motion.nav>

        {/* Stats Cards */}
        <motion.section 
          variants={stagger}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8"
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.4 }}>
            <StatsCard
              icon={Users}
              label="Java Players"
              value={totalPlayers}
              subtext={`of ${maxPlayers || '?'} max`}
              variant={totalPlayers > 0 ? 'success' : 'default'}
            />
          </motion.div>
          <motion.div variants={fadeUp} transition={{ duration: 0.4 }}>
            <StatsCard
              icon={Activity}
              label="Server Status"
              value={status === 'online' ? 'Online' : status === 'offline' ? 'Offline' : 'Checking'}
              variant={status === 'online' ? 'success' : status === 'offline' ? 'destructive' : 'warning'}
            />
          </motion.div>
          <motion.div variants={fadeUp} transition={{ duration: 0.4 }}>
            <StatsCard
              icon={Wifi}
              label="Java Edition"
              value={javaStatus?.online ? 'Online' : 'Offline'}
              subtext={javaStatus?.version || 'N/A'}
              variant={javaStatus?.online ? 'success' : 'destructive'}
            />
          </motion.div>
          <motion.div variants={fadeUp} transition={{ duration: 0.4 }}>
            <StatsCard
              icon={Clock}
              label="Bedrock Edition"
              value={bedrockStatus?.online ? 'Online' : 'Offline'}
              subtext="Port: 1109"
              variant={bedrockStatus?.online ? 'success' : 'destructive'}
            />
          </motion.div>
        </motion.section>

        {/* Server Cards */}
        <motion.section 
          variants={stagger}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8"
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
            <ServerCard
              title="Java Edition"
              serverData={javaStatus}
              serverAddress="play.mcnpnetwork.com"
              isLoading={isLoading}
            />
          </motion.div>
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
            <ServerCard
              title="Bedrock Edition"
              serverData={bedrockStatus}
              serverAddress="bedrock.mcnpnetwork.com:1109"
              isLoading={isLoading}
            />
          </motion.div>
        </motion.section>

        {/* Player List */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-4 sm:mb-6 lg:mb-8"
        >
          <PlayerList javaStatus={javaStatus} bedrockStatus={null} />
        </motion.section>

        {/* Database-backed Uptime Stats */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-4 sm:mb-6 lg:mb-8"
        >
          <DatabaseUptimeStats isOnline={status === 'online'} currentPing={pingMs} />
        </motion.section>

        {/* Player Count History Graph */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-4 sm:mb-6 lg:mb-8"
        >
          <PlayerGraph />
        </motion.section>

        {/* Daily Player Stats */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mb-4 sm:mb-6 lg:mb-8"
        >
          <DailyPlayerStats />
        </motion.section>

        {/* Weekly Uptime Chart - Now DB-backed */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-4 sm:mb-6 lg:mb-8"
        >
          <UptimeChart />
        </motion.section>

        {/* 30-Day Uptime Trend */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mb-4 sm:mb-6 lg:mb-8"
        >
          <MonthlyUptimeChart />
        </motion.section>

        {/* Discord & Game Modes */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8"
        >
          <div className="flex flex-col gap-3 sm:gap-4">
            <DiscordWidget inviteLink="https://discord.gg/XeC2sMsazu" />
            
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
        </motion.section>

        {/* Footer */}
        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center py-4 sm:py-6 lg:py-8 border-t border-border mt-4 sm:mt-6"
        >
          <p className="text-muted-foreground text-[10px] sm:text-xs lg:text-sm">
            Auto-refreshes every 10 seconds • Real-time status via mcstatus.io
          </p>
          <p className="text-primary font-medium mt-1.5 sm:mt-2 text-xs sm:text-sm lg:text-base">
            Powered by MCNP Network
          </p>
          <p className="text-muted-foreground/60 text-[10px] sm:text-xs mt-1.5 sm:mt-2">
            Made by Sakshyxm • © {new Date().getFullYear()} MCNP Network
          </p>
        </motion.footer>
      </main>
    </div>
  );
};

export default Index;
