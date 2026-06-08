import { Link } from 'react-router-dom';
import { ArrowLeft, TreePine, Copy, Check, Users, Shield, Sparkles, Pickaxe } from 'lucide-react';
import { useState } from 'react';

const features = [
  { icon: Pickaxe, title: 'Vanilla+ Experience', desc: 'Classic survival with quality-of-life enhancements like /home, /tpa, and land claims.' },
  { icon: Shield, title: 'Grief Protection', desc: 'Claim your land and keep your builds safe from raiders and griefers.' },
  { icon: Users, title: 'Community Driven', desc: 'Active player base, regular events, and a friendly staff team.' },
  { icon: Sparkles, title: 'Custom Enchants', desc: 'Unlock powerful custom enchantments to enhance your gameplay.' },
];

const Survival = () => {
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
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center">
              <TreePine className="w-8 h-8 text-success" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Survival</h1>
              <p className="text-success font-medium">Live Now</p>
            </div>
          </div>

          <p className="text-muted-foreground mb-6 leading-relaxed">
            Explore vast worlds, build epic bases, and survive the wilderness on MCNP Survival.
            A long-term semi-vanilla world with land claims, custom enchants, and an active economy.
          </p>

          <button onClick={copy} className="flex items-center gap-3 w-full px-4 py-3 bg-secondary hover:bg-secondary/80 rounded-lg mb-8 transition-colors">
            <span className="text-xs text-muted-foreground uppercase">Server IP</span>
            <span className="font-mono text-foreground flex-1 text-left">{ip}</span>
            {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
          </button>

          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.title} className="p-4 bg-muted/30 rounded-lg border border-border">
                <f.icon className="w-6 h-6 text-success mb-2" />
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

export default Survival;
