import { Link } from 'react-router-dom';
import { ArrowLeft, Bed, Construction } from 'lucide-react';

const Bedwar = () => {
  return (
    <div className="min-h-screen bg-background bg-grid-pattern flex flex-col items-center justify-center p-4">
      <div className="minecraft-border rounded-xl bg-card p-8 md:p-12 card-glow max-w-lg w-full text-center">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <Bed className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Bedwars</h1>
          <div className="flex items-center justify-center gap-2 text-warning">
            <Construction className="w-5 h-5" />
            <span className="font-medium">Coming Soon!</span>
          </div>
        </div>
        
        <p className="text-muted-foreground mb-8">
          We are making it! Protect your bed and destroy your enemies on MCNP Network.
        </p>

        <Link 
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Status
        </Link>
      </div>
    </div>
  );
};

export default Bedwar;
