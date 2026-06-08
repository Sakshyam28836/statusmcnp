import { Link } from 'react-router-dom';
import { ArrowLeft, Swords, Copy, Check, Target, Trophy, Zap, Users } from 'lucide-react';
import { useState } from 'react';

const features = [
  { icon: Target, title: 'Multiple Kits', desc: 'Train with NoDebuff, Sumo, Crystal, SMP, Axe, and many more PvP kits.' },
  { icon: Trophy, title: 'Ranked Matches', desc: 'Climb the ELO ladder and prove you are the best fighter on the network.' },
  { icon: Users, title: 'Duels & Parties', desc: 'Challenge friends to 1v1 duels or join party FFA for chaotic fun.' },
  { icon: Zap, title: 'Low Ping Arenas', desc: 'Optimized servers and arenas for the smoothest possible PvP experience.' },
];

const PracticePvp = () => {
  const [copied, setCopied] = useState(false);
  const ip = 'mcnp.network:1109';

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
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <Swords className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Practice PvP</h1>
              <p className="text-success font-medium">Live Now</p>
            </div>
          </div>

          <p className="text-muted-foreground mb-6 leading-relaxed">
            Sharpen your combat skills in our dedicated practice arena. With multiple kits, ranked
            matchmaking, and tournaments, Practice PvP is the perfect place to become a PvP legend.
          </p>

          <button onClick={copy} className="flex items-center gap-3 w-full px-4 py-3 bg-secondary hover:bg-secondary/80 rounded-lg mb-8 transition-colors">
            <span className="text-xs text-muted-foreground uppercase">Server IP</span>
            <span className="font-mono text-foreground flex-1 text-left">{ip}</span>
            {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
          </button>

          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.title} className="p-4 bg-muted/30 rounded-lg border border-border">
                <f.icon className="w-6 h-6 text-primary mb-2" />
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

export default PracticePvp;
