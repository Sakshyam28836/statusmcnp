import { Link } from 'react-router-dom';
import { TreePine, Heart, Bed, Flame, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';

const gameModes = [
  { name: 'Survival', path: '/survival', icon: TreePine, color: 'text-success' },
  { name: 'Lifesteal', path: '/lifesteal', icon: Heart, color: 'text-destructive' },
  { name: 'Bedwars', path: '/bedwar', icon: Bed, color: 'text-primary' },
  { name: 'Anarchy', path: '/anarchy', icon: Flame, color: 'text-warning' },
  { name: 'Practice PvP', path: '/practice-pvp', icon: Swords, color: 'text-primary' },
];

export const GameModeNav = () => {
  return (
    <div className="minecraft-border rounded-xl bg-card p-6 card-glow">
      <h3 className="text-lg font-bold text-foreground mb-4">Game Modes</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {gameModes.map((mode) => (
          <Link
            key={mode.path}
            to={mode.path}
            className="group flex flex-col items-center gap-2 p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-all hover:scale-105"
          >
            <mode.icon className={cn("w-8 h-8 transition-transform group-hover:scale-110", mode.color)} />
            <span className="text-sm font-medium text-foreground text-center">{mode.name}</span>
            <span className="text-xs text-warning">Coming Soon</span>
          </Link>
        ))}
      </div>
    </div>
  );
};
