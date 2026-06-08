import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Copy, Check, Swords, Skull, Crown, Zap } from 'lucide-react';
import { useState } from 'react';

const features = [
  { icon: Heart, title: 'Steal Hearts', desc: 'Kill players to steal their hearts and grow stronger. Lose all hearts and you are banned.' },
  { icon: Skull, title: 'High Stakes PvP', desc: 'Every fight matters — death has real consequences in Lifesteal.' },
  { icon: Crown, title: 'Clans & Alliances', desc: 'Form clans, raid bases, and dominate the leaderboard with your allies.' },
  { icon: Zap, title: 'Custom Items', desc: 'Craft unique weapons and artifacts that give you the edge in combat.' },
];

const Lifesteal = () => {
  const [copied, setCopied] = useState(false);
  const ip = 'mcnp.network';

  const copy = async () => {
    await navigator.clipboard.writeText(ip);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background bg-grid-pattern py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Status
        </Link>

        <div className="minecraft-border rounded-xl bg-card p-6 md:p-10 card-glow">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Lifesteal</h1>
              <p className="text-success font-medium">Live Now</p>
            </div>
          </div>

          <p className="text-muted-foreground mb-6 leading-relaxed">
            The ultimate hardcore PvP experience. Steal hearts from your enemies, build your empire,
            and survive in a world where every death brings you closer to elimination.
          </p>

          <button onClick={copy} className="flex items-center gap-3 w-full px-4 py-3 bg-secondary hover:bg-secondary/80 rounded-lg mb-8 transition-colors">
            <span className="text-xs text-muted-foreground uppercase">Server IP</span>
            <span className="font-mono text-foreground flex-1 text-left">{ip}</span>
            {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
          </button>

          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.title} className="p-4 bg-muted/30 rounded-lg border border-border">
                <f.icon className="w-6 h-6 text-destructive mb-2" />
                <h3 className="font-bold text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lifesteal;
