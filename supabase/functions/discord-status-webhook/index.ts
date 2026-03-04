import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const DISCORD_WEBHOOK_URL = Deno.env.get("DISCORD_WEBHOOK_URL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface StatusNotificationRequest {
  type: 'status_change' | 'player_stats' | 'hourly_report';
  serverName: string;
  status?: 'online' | 'offline';
  playerCount?: number;
  maxPlayers?: number;
  uptime24h?: number;
  avgPing?: number;
  peakPlayers?: number;
  avgPlayers?: number;
  timestamp: string;
}

const getNepalTime = (isoString: string) => {
  return new Date(isoString).toLocaleString('en-US', {
    timeZone: 'Asia/Kathmandu',
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!DISCORD_WEBHOOK_URL) {
    console.error("DISCORD_WEBHOOK_URL not configured");
    return new Response(
      JSON.stringify({ error: "Discord webhook not configured" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const data: StatusNotificationRequest = await req.json();
    const nepalTime = getNepalTime(data.timestamp);

    let embed;

    if (data.type === 'status_change') {
      const isOnline = data.status === 'online';
      embed = {
        title: isOnline ? "🟢 Server is ONLINE!" : "🔴 Server is OFFLINE!",
        description: isOnline 
          ? `**${data.serverName}** is now online and ready for players!`
          : `**${data.serverName}** has gone offline.`,
        color: isOnline ? 0x22c55e : 0xef4444,
        fields: [
          {
            name: "📊 Status",
            value: isOnline ? "✅ Online" : "❌ Offline",
            inline: true
          },
          ...(data.playerCount !== undefined ? [{
            name: "👥 Players",
            value: `${data.playerCount}/${data.maxPlayers || '?'}`,
            inline: true
          }] : []),
          {
            name: "🕐 Time (Nepal)",
            value: nepalTime,
            inline: true
          }
        ],
        footer: {
          text: "MCNP Network Status Monitor"
        },
        timestamp: new Date().toISOString()
      };
    } else if (data.type === 'player_stats') {
      // Quick 5-minute update — compact status ping
      const statusEmoji = data.playerCount && data.playerCount > 0 ? '🟢' : '🟡';
      embed = {
        title: `${statusEmoji} Server Status Update`,
        description: `Live update for **${data.serverName}**`,
        color: 0x3b82f6,
        fields: [
          {
            name: "👥 Players Online",
            value: `**${data.playerCount || 0}**/${data.maxPlayers || '?'}`,
            inline: true
          },
          {
            name: "📊 Uptime (24h)",
            value: data.uptime24h !== undefined ? `**${Math.round(data.uptime24h)}%**` : 'N/A',
            inline: true
          },
          {
            name: "📡 Ping",
            value: data.avgPing ? `**${Math.round(data.avgPing)}ms**` : 'N/A',
            inline: true
          }
        ],
        footer: {
          text: `MCNP Network • ${nepalTime} NPT`
        },
        timestamp: new Date().toISOString()
      };
    } else if (data.type === 'hourly_report') {
      // Detailed hourly report with player history
      const uptimeEmoji = (data.uptime24h ?? 0) >= 99 ? '🏆' : (data.uptime24h ?? 0) >= 90 ? '✅' : '⚠️';
      const playerBar = (() => {
        const count = data.playerCount || 0;
        const max = data.maxPlayers || 100;
        const filled = Math.round((count / max) * 10);
        return '🟩'.repeat(filled) + '⬛'.repeat(10 - filled);
      })();

      embed = {
        title: "📊 Hourly Server Report",
        description: `Detailed hourly analysis for **${data.serverName}**\n\n**Player Capacity:**\n${playerBar} ${data.playerCount || 0}/${data.maxPlayers || '?'}`,
        color: 0x22d3ee,
        fields: [
          {
            name: "👥 Current Players",
            value: `**${data.playerCount || 0}**/${data.maxPlayers || '?'}`,
            inline: true
          },
          {
            name: "📈 Peak Players (24h)",
            value: `**${data.peakPlayers ?? 'N/A'}**`,
            inline: true
          },
          {
            name: "👤 Avg Players (24h)",
            value: `**${data.avgPlayers !== undefined ? Math.round(data.avgPlayers) : 'N/A'}**`,
            inline: true
          },
          {
            name: `${uptimeEmoji} 24h Uptime`,
            value: data.uptime24h !== undefined ? `**${Math.round(data.uptime24h)}%**` : 'N/A',
            inline: true
          },
          {
            name: "📡 Avg Ping",
            value: data.avgPing ? `**${Math.round(data.avgPing)}ms**` : 'N/A',
            inline: true
          },
          {
            name: "🕐 Nepal Time",
            value: nepalTime,
            inline: true
          }
        ],
        footer: {
          text: "MCNP Network • Hourly Report. Made by Sakshyam Paudel."
        },
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error("Invalid notification type");
    }

    const discordPayload = {
      username: "MCNP Status Bot",
      avatar_url: "https://statusmcnp.lovable.app/favicon.png",
      embeds: [embed]
    };

    const discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordPayload)
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error("Discord webhook error:", errorText);
      throw new Error(`Discord webhook failed: ${discordResponse.status}`);
    }

    console.log("Discord notification sent successfully:", data.type);

    return new Response(
      JSON.stringify({ success: true, type: data.type }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in discord-status-webhook:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
