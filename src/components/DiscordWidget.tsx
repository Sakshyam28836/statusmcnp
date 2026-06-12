import { MessageCircle, ExternalLink, Users } from 'lucide-react';

interface DiscordWidgetProps {
  inviteLink?: string;
}

export const DiscordWidget = ({ inviteLink = 'https://discord.gg/mcnpnetwork' }: DiscordWidgetProps) => {
  return (
    <div className="minecraft-border rounded-xl bg-card p-6 card-glow h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-lg bg-[#5865F2]/20">
          <MessageCircle className="w-6 h-6 text-[#5865F2]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Join Our Discord</h3>
          <p className="text-xs text-muted-foreground">Connect with the MCNP community</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <p className="text-muted-foreground text-sm">
          Join our Discord server to stay updated on server news, events, and connect with other players!
        </p>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Community Chat</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg">
            <MessageCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Support</span>
          </div>
        </div>

        <a
          href={inviteLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg font-medium transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          Join Discord Server
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};
