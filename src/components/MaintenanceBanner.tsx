import { AlertTriangle } from 'lucide-react';
import { ServerStatus } from '@/types/server';

interface MaintenanceBannerProps {
  javaStatus: ServerStatus | null;
}

export const MaintenanceBanner = ({ javaStatus }: MaintenanceBannerProps) => {
  // Check if MOTD contains 'Maintenance' (case-insensitive)
  const motdText = javaStatus?.motd?.clean?.join(' ') || '';
  const isMaintenanceMode = motdText.toLowerCase().includes('maintenance');

  if (!isMaintenanceMode) {
    return null;
  }

  return (
    <div className="bg-warning/20 border border-warning/40 rounded-xl p-4 mb-6 animate-pulse-slow">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-warning" />
        </div>
        <div className="flex-1">
          <h3 className="text-warning font-bold text-lg">Server Under Maintenance</h3>
          <p className="text-warning/80 text-sm mt-1">
            MCNP Network is currently undergoing maintenance. Please check back soon!
          </p>
          {motdText && (
            <p className="text-muted-foreground text-xs mt-2 italic">
              "{motdText.trim()}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
