import { Users, User } from 'lucide-react';
import { ServerStatus } from '@/types/server';

interface PlayerListProps {
  javaStatus: ServerStatus | null;
  bedrockStatus?: ServerStatus | null;
}

export const PlayerList = ({ javaStatus }: PlayerListProps) => {
  // Only count Java players
  const javaPlayers = javaStatus?.players?.list || [];
  const totalOnline = javaStatus?.players?.online || 0;

  if (totalOnline === 0) {
    return (
      <div className="minecraft-border rounded-xl bg-card p-4 sm:p-6 card-glow">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <h3 className="text-base sm:text-lg font-bold text-foreground">Java Players Online</h3>
        </div>
        <div className="text-center py-6 sm:py-8">
          <User className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground/50 mb-2 sm:mb-3" />
          <p className="text-muted-foreground text-sm sm:text-base">No players online right now</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground/60 mt-1">Be the first to join!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="minecraft-border rounded-xl bg-card p-4 sm:p-6 card-glow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <h3 className="text-base sm:text-lg font-bold text-foreground">Java Players Online</h3>
        </div>
        <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-success/20 text-success rounded-full text-xs sm:text-sm font-medium w-fit">
          {totalOnline} online
        </span>
      </div>
      
      {javaPlayers.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2">
          {javaPlayers.map((player, index) => (
            <div 
              key={`${player}-${index}`}
              className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-secondary/50 rounded-lg"
            >
              <img 
                src={`https://mc-heads.net/avatar/${player}/32`}
                alt={player}
                className="w-5 h-5 sm:w-6 sm:h-6 rounded"
                onError={(e) => {
                  e.currentTarget.src = 'https://mc-heads.net/avatar/MHF_Steve/32';
                }}
              />
              <span className="text-xs sm:text-sm text-foreground truncate">{player}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-3 sm:py-4">
          <p className="text-muted-foreground text-xs sm:text-sm">
            {totalOnline} player{totalOnline !== 1 ? 's' : ''} online
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground/60 mt-1">
            Player names not available from server
          </p>
        </div>
      )}
    </div>
  );
};
