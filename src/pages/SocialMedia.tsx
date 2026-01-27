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
      url: 'https://tiktok.com/@mcnpnetwork',
      icon: '🎵',
      description: 'Check out our short clips and viral moments',
      color: 'bg-pink-500/20 border-pink-500/30 hover:bg-pink-500/30',
      embed: false
    },
    {
      name: 'Instagram',
      url: 'https://instagram.com/mcnpnetwork',
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
        <nav className="flex items-center gap-4 mb-8">
          <NavLink to="/" className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-full text-sm font-medium transition-all">
            <Home className="w-4 h-4" />
            Home
          </NavLink>
          <NavLink to="/staff" className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-full text-sm font-medium transition-all">
            <Users className="w-4 h-4" />
            Staff
          </NavLink>
        </nav>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Social Media</h1>
          <p className="text-muted-foreground">Stay connected with MCNP Network across all platforms</p>
        </div>

        {/* YouTube Embed Section */}
        <div className="minecraft-border rounded-xl bg-card p-6 mb-8 card-glow">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🎬</span>
            <h2 className="text-xl font-bold text-foreground">Latest from YouTube</h2>
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
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg text-white font-medium transition-all"
          >
            Visit YouTube Channel
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Social Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {socials.map((social) => (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`minecraft-border rounded-xl p-6 border transition-all duration-300 ${social.color}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{social.icon}</span>
                <h3 className="text-xl font-bold text-foreground">{social.name}</h3>
              </div>
              <p className="text-muted-foreground text-sm mb-4">{social.description}</p>
              <div className="flex items-center gap-2 text-primary font-medium">
                Follow Us
                <ExternalLink className="w-4 h-4" />
              </div>
            </a>
          ))}
        </div>

        <footer className="text-center py-8 border-t border-border mt-8">
          <p className="text-primary font-medium">Powered by MCNP Network</p>
          <p className="text-muted-foreground/60 text-xs mt-2">
            Made by Sakshyxm • © {new Date().getFullYear()} MCNP Network
          </p>
        </footer>
      </main>
    </div>
  );
};

export default SocialMedia;
