import { Header } from '@/components/Header';
import { useServerStatus } from '@/hooks/useServerStatus';
import { NavLink } from '@/components/NavLink';
import { Home, Users, ExternalLink } from 'lucide-react';

const SocialMedia = () => {
  const { status, lastChecked, isLoading, refetch, notificationsEnabled, enableNotifications } = useServerStatus(10000);

  const socials = [
    {
      name: 'YouTube',
      url: 'https://youtube.com/@MCNPNetwork',
      icon: '🎬',
      description: 'Watch our latest videos, tutorials, and highlights',
      color: 'bg-red-500/20 border-red-500/30 hover:bg-red-500/30',
      embed: true,
      embedUrl: 'https://www.youtube.com/embed?listType=user_uploads&list=MCNPNetwork'
    },
    {
      name: 'TikTok',
      url: 'https://www.tiktok.com/@mcnpnetwork?_r=1&_t=ZS-93Q3zfqryOS',
      icon: '🎵',
      description: 'Check out our short clips and viral moments',
      color: 'bg-pink-500/20 border-pink-500/30 hover:bg-pink-500/30',
      embed: false
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/minecraftnp?igsh=MWNzbzZmZHM3YmV6dw%3D%3D&utm_source=qr',
      icon: '📸',
      description: 'Follow us for behind-the-scenes and updates',
      color: 'bg-purple-500/20 border-purple-500/30 hover:bg-purple-500/30',
      embed: false
    }
  ];

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
          <NavLink to="/" className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-full text-xs sm:text-sm font-medium transition-all">
            <Home className="w-3 h-3 sm:w-4 sm:h-4" />
            Home
          </NavLink>
          <NavLink to="/staff" className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-full text-xs sm:text-sm font-medium transition-all">
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            Staff
          </NavLink>
        </nav>

        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Social Media</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Stay connected with MCNP Network across all platforms</p>
        </div>

        {/* YouTube Embed Section */}
        <div className="minecraft-border rounded-xl bg-card p-4 sm:p-6 mb-6 sm:mb-8 card-glow">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <span className="text-xl sm:text-2xl">🎬</span>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Latest from YouTube</h2>
          </div>
          <div className="aspect-video rounded-lg overflow-hidden bg-black/50">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/videoseries?list=UU_MCNPNetwork"
              title="MCNP Network YouTube"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
          <a 
            href="https://youtube.com/@MCNPNetwork"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 sm:mt-4 px-4 sm:px-6 py-2 sm:py-3 bg-red-500 hover:bg-red-600 rounded-lg text-white font-medium transition-all text-sm sm:text-base"
          >
            Visit YouTube Channel
            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
          </a>
        </div>

        {/* Social Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {socials.map((social) => (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`minecraft-border rounded-xl p-4 sm:p-6 border transition-all duration-300 ${social.color}`}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <span className="text-2xl sm:text-3xl">{social.icon}</span>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">{social.name}</h3>
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4">{social.description}</p>
              <div className="flex items-center gap-2 text-primary font-medium text-sm sm:text-base">
                Follow Us
                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            </a>
          ))}
        </div>

        <footer className="text-center py-6 sm:py-8 border-t border-border mt-8">
          <p className="text-primary font-medium text-sm sm:text-base">Powered by MCNP Network</p>
          <p className="text-muted-foreground/60 text-xs mt-2">
            Made by Sakshyxm • © {new Date().getFullYear()} MCNP Network
          </p>
        </footer>
      </main>
    </div>
  );
};

export default SocialMedia;
