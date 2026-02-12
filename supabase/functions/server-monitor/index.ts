import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const JAVA_API_URL = "https://api.mcstatus.io/v2/status/java/play.mcnpnetwork.com:1109";
const BEDROCK_API_URL = "https://api.mcstatus.io/v2/status/bedrock/bedrock.mcnpnetwork.com:1109";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "check"; // "check" | "aggregate_daily" | "aggregate_hourly"

    if (action === "check") {
      // Fetch server status from mcstatus.io
      const [javaRes, bedrockRes] = await Promise.all([
        fetch(JAVA_API_URL),
        fetch(BEDROCK_API_URL),
      ]);

      const javaData = await javaRes.json();
      const bedrockData = await bedrockRes.json();

      const isOnline = javaData.online === true;
      const javaPlayers = javaData.players?.online || 0;
      const javaMaxPlayers = javaData.players?.max || 0;
      const bedrockOnline = bedrockData.online === true;

      // Use the server's reported latency if available, otherwise null
      // mcstatus.io doesn't return ping, so we'll use the response time as a rough estimate
      // but keep it reasonable (just the API call time, not doubled)
      const pingStart = performance.now();
      await fetch(JAVA_API_URL, { method: "HEAD" }).catch(() => {});
      const pingMs = Math.round(performance.now() - pingStart);

      // Save to status history
      await supabase.from("server_status_history").insert({
        is_online: isOnline,
        java_players: javaPlayers,
        java_max_players: javaMaxPlayers,
        bedrock_online: bedrockOnline,
        ping_ms: pingMs,
      });

      // Check for status change - get last different status
      const { data: lastRecords } = await supabase
        .from("server_status_history")
        .select("is_online, timestamp")
        .order("timestamp", { ascending: false })
        .limit(5);

      let statusChanged = false;
      if (lastRecords && lastRecords.length >= 2) {
        const current = lastRecords[0].is_online;
        const previous = lastRecords[1].is_online;
        statusChanged = current !== previous;
      }

      // If status changed, send Discord notification and email
      if (statusChanged) {
        const discordWebhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");
        if (discordWebhookUrl) {
          const nepalTime = new Date().toLocaleString("en-US", {
            timeZone: "Asia/Kathmandu",
            dateStyle: "medium",
            timeStyle: "short",
          });

          const embed = {
            title: isOnline ? "🟢 Server is ONLINE!" : "🔴 Server is OFFLINE!",
            description: isOnline
              ? "**MCNP Network** is now online and ready for players!"
              : "**MCNP Network** has gone offline.",
            color: isOnline ? 0x22c55e : 0xef4444,
            fields: [
              { name: "📊 Status", value: isOnline ? "✅ Online" : "❌ Offline", inline: true },
              ...(isOnline ? [{ name: "👥 Players", value: `${javaPlayers}/${javaMaxPlayers}`, inline: true }] : []),
              { name: "🕐 Time (Nepal)", value: nepalTime, inline: true },
            ],
            footer: { text: "MCNP Network Status Monitor" },
            timestamp: new Date().toISOString(),
          };

          await fetch(discordWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: "MCNP Status Bot",
              avatar_url: "https://statusmcnp.lovable.app/favicon.png",
              embeds: [embed],
            }),
          });
        }

        // Send email notification
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          try {
            const { Resend } = await import("npm:resend@2.0.0");
            const resend = new Resend(resendApiKey);
            
            const nepalTime = new Date().toLocaleString("en-US", {
              timeZone: "Asia/Kathmandu",
              dateStyle: "medium",
              timeStyle: "short",
            });
            
            const statusEmoji = isOnline ? "🟢" : "🔴";
            const statusText = isOnline ? "Online" : "Offline";
            const statusColor = isOnline ? "#22c55e" : "#ef4444";

            // Get subscribers from profiles table or send to admin
            await resend.emails.send({
              from: "MCNP Network <onboarding@resend.dev>",
              to: ["admin@mcnpnetwork.com"],
              subject: `${statusEmoji} MCNP Network is now ${statusText}`,
              html: `
                <div style="background:#0c0c0c;padding:40px 20px;font-family:sans-serif;">
                  <div style="max-width:600px;margin:0 auto;background:#1a1a1a;border-radius:16px;padding:40px;border:1px solid #333;">
                    <h1 style="color:#fff;text-align:center;">${statusEmoji} Server Status Alert</h1>
                    <div style="background:${statusColor}15;border:1px solid ${statusColor}40;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
                      <div style="font-size:48px;">${statusEmoji}</div>
                      <h2 style="color:${statusColor};">MCNP Network is now ${statusText}</h2>
                      ${isOnline ? `<p style="color:#888;">Players: ${javaPlayers}/${javaMaxPlayers}</p>` : ""}
                    </div>
                    <p style="color:#888;text-align:center;">Time (Nepal): ${nepalTime}</p>
                    <p style="color:#666;font-size:12px;text-align:center;margin-top:24px;">MCNP Network Status Monitor</p>
                  </div>
                </div>`,
            });
            console.log("Email notification sent");
          } catch (emailErr) {
            console.error("Email send error:", emailErr);
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, online: isOnline, players: javaPlayers, statusChanged }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "aggregate_hourly") {
      // Aggregate the last hour's data into hourly_player_stats
      // Use Nepal time (UTC+5:45) for hour boundaries
      const now = new Date();
      const nepalOffset = 5 * 60 + 45; // minutes
      const nepalMs = now.getTime() + nepalOffset * 60 * 1000;
      const nepalNow = new Date(nepalMs);
      
      // Round down to current hour in Nepal time
      const nepalHourStart = new Date(nepalNow);
      nepalHourStart.setMinutes(0, 0, 0);
      
      // Convert back to UTC for DB query
      const utcHourStart = new Date(nepalHourStart.getTime() - nepalOffset * 60 * 1000);
      const utcHourEnd = new Date(utcHourStart.getTime() + 60 * 60 * 1000);

      const { data: hourData } = await supabase
        .from("server_status_history")
        .select("java_players, is_online")
        .gte("timestamp", utcHourStart.toISOString())
        .lt("timestamp", utcHourEnd.toISOString());

      if (hourData && hourData.length > 0) {
        const players = hourData.map((d) => d.java_players);
        const avgPlayers = Math.round((players.reduce((a, b) => a + b, 0) / players.length) * 10) / 10;
        const peakPlayers = Math.max(...players);
        const minPlayers = Math.min(...players);
        const wasOnline = hourData.some((d) => d.is_online);

        // Store with the UTC equivalent of the Nepal hour start
        await supabase.from("hourly_player_stats").upsert(
          {
            hour_timestamp: utcHourStart.toISOString(),
            avg_players: avgPlayers,
            peak_players: peakPlayers,
            min_players: minPlayers,
            is_online: wasOnline,
          },
          { onConflict: "hour_timestamp" }
        );
      }

      return new Response(
        JSON.stringify({ success: true, action: "aggregate_hourly" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "aggregate_daily") {
      // Run the daily aggregation function
      await supabase.rpc("aggregate_daily_uptime");
      await supabase.rpc("aggregate_today_uptime");

      return new Response(
        JSON.stringify({ success: true, action: "aggregate_daily" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "send_stats") {
      // Send periodic Discord stats
      const { data: uptimeData } = await supabase.rpc("get_uptime_stats", { hours_back: 24 });
      
      const discordWebhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");
      if (discordWebhookUrl && uptimeData && uptimeData.length > 0) {
        const stats = uptimeData[0];
        const nepalTime = new Date().toLocaleString("en-US", {
          timeZone: "Asia/Kathmandu",
          dateStyle: "medium",
          timeStyle: "short",
        });

        // Get current server status
        const javaRes = await fetch(JAVA_API_URL);
        const javaData = await javaRes.json();

        const embed = {
          title: "📈 Server Statistics Update",
          description: "Current status report for **MCNP Network**",
          color: 0x22d3ee,
          fields: [
            { name: "👥 Current Players", value: `${javaData.players?.online || 0}/${javaData.players?.max || "?"}`, inline: true },
            { name: "📊 24h Uptime", value: `${Number(stats.uptime_percentage).toFixed(2)}%`, inline: true },
            { name: "📡 Avg Ping", value: stats.avg_ping ? `${Math.round(Number(stats.avg_ping))}ms` : "N/A", inline: true },
            { name: "👥 Avg Players (24h)", value: `${Number(stats.avg_players).toFixed(1)}`, inline: true },
            { name: "🏆 Peak Players (24h)", value: `${stats.max_players}`, inline: true },
            { name: "🕐 Time (Nepal)", value: nepalTime, inline: true },
          ],
          footer: { text: "MCNP Network • Updates every 5 minutes" },
          timestamp: new Date().toISOString(),
        };

        await fetch(discordWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "MCNP Status Bot",
            avatar_url: "https://statusmcnp.lovable.app/favicon.png",
            embeds: [embed],
          }),
        });
      }

      return new Response(
        JSON.stringify({ success: true, action: "send_stats" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in server-monitor:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
