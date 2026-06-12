import { Link } from 'react-router-dom';
import { TreePine, Heart, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';

const gameModes = [
  { name: 'Survival', path: '/survival', icon: TreePine, color: 'text-success' },
  { name: 'Lifesteal', path: '/lifesteal', icon: Heart, color: 'text-destructive' },
  { name: 'Practice PvP', path: '/practice-pvp', icon: Swords, color: 'text-primary' },
];

export const GameModeNav = () => {
  return (
    <div className="minecraft-border rounded-xl bg-card p-6 card-glow h-full flex flex-col">
      <h3 className="text-lg font-bold text-foreground mb-4">Game Modes</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
        {gameModes.map((mode) => (
          <Link
            key={mode.path}
            to={mode.path}
            className="group flex flex-col items-center gap-2 p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
          >
            <mode.icon className={cn("w-8 h-8", mode.color)} />
            <span className="text-sm font-medium text-foreground text-center">{mode.name}</span>
            <span className="text-xs text-success">Released</span>
          </Link>
        ))}
      </div>
    </div>
  );
};
