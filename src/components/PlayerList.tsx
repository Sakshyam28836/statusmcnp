import { Users, User } from 'lucide-react';
import { ServerStatus } from '@/types/server';

interface PlayerListProps {
  javaStatus: ServerStatus | null;
  bedrockStatus: ServerStatus | null;
}

export const PlayerList = ({ javaStatus, bedrockStatus }: PlayerListProps) => {
  const javaPlayers = javaStatus?.players?.list || [];
  const bedrockPlayers = bedrockStatus?.players?.list || [];
  const allPlayers = [...javaPlayers, ...bedrockPlayers];
  const totalOnline = (javaStatus?.players?.online || 0) + (bedrockStatus?.players?.online || 0);

  if (totalOnline === 0) {
    return (
      <div className="minecraft-border rounded-xl bg-card p-6 card-glow">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Online Players</h3>
        </div>
        <div className="text-center py-8">
          <User className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No players online right now</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Be the first to join!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="minecraft-border rounded-xl bg-card p-6 card-glow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Online Players</h3>
        </div>
        <span className="px-3 py-1 bg-success/20 text-success rounded-full text-sm font-medium">
          {totalOnline} online
        </span>
      </div>
      
      {allPlayers.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {allPlayers.map((player, index) => (
            <div 
              key={`${player}-${index}`}
              className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg"
            >
              <img 
                src={`https://mc-heads.net/avatar/${player}/32`}
                alt={player}
                className="w-6 h-6 rounded"
                onError={(e) => {
                  e.currentTarget.src = 'https://mc-heads.net/avatar/MHF_Steve/32';
                }}
              />
              <span className="text-sm text-foreground truncate">{player}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-muted-foreground text-sm">
            {totalOnline} player{totalOnline !== 1 ? 's' : ''} online
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Player names not available from server
          </p>
        </div>
      )}
    </div>
  );
};
