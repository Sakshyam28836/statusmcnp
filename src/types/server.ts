export interface ServerStatus {
  online: boolean;
  ip: string;
  port: number;
  hostname?: string;
  version?: string;
  players?: {
    online: number;
    max: number;
    list?: string[];
  };
  motd?: {
    raw: string[];
    clean: string[];
    html: string[];
  };
  icon?: string;
  gamemode?: string;
  serverid?: string;
}

export interface ServerHistory {
  timestamp: Date;
  status: 'online' | 'offline';
  players?: number;
}

export type StatusType = 'online' | 'offline' | 'checking';
