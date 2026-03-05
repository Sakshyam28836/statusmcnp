import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const JAVA_API_URL = "https://api.mcstatus.io/v2/status/java/play.mcnpnetwork.com:1109";
// Use mcsrvstat.us for Bedrock - more reliable for Bedrock edition
const BEDROCK_API_URL = "https://api.mcsrvstat.us/bedrock/3/bedrock.mcnpnetwork.com:1109";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "check";

    if (action === "check") {
      // Fetch Java status from mcstatus.io
      const javaRes = await fetch(JAVA_API_URL);
      const javaData = await javaRes.json();

      // Fetch Bedrock status from mcsrvstat.us
      let bedrockOnline = false;
      try {
        const bedrockRes = await fetch(BEDROCK_API_URL);
        const bedrockData = await bedrockRes.json();
        bedrockOnline = bedrockData.online === true;
      } catch (e) {
        console.error("Bedrock status check failed:", e);
      }

      const isOnline = javaData.online === true;
      const javaPlayers = javaData.players?.online || 0;
      const javaMaxPlayers = javaData.players?.max || 0;

      // Measure ping
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

      // Check for status change
      const { data: lastRecords } = await supabase
        .from("server_status_history")
        .select("is_online, timestamp")
        .order("timestamp", { ascending: false })
        .limit(5);

      let statusChanged = false;
      if (lastRecords && lastRecords.length >= 2) {
        statusChanged = lastRecords[0].is_online !== lastRecords[1].is_online;
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
              avatar_url: "https://mcnpstatus.netlify.app/favicon.png",
              embeds: [embed],
            }),
          });
        }

        // Send email notification via Resend REST API (no npm import needed)
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          try {
            const nepalTime = new Date().toLocaleString("en-US", {
              timeZone: "Asia/Kathmandu",
              dateStyle: "medium",
              timeStyle: "short",
            });

            const statusEmoji = isOnline ? "🟢" : "🔴";
            const statusText = isOnline ? "Online" : "Offline";
            const statusColor = isOnline ? "#22c55e" : "#ef4444";

            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${resendApiKey}`,
              },
              body: JSON.stringify({
                from: "MCNP Network <onboarding@resend.dev>",
                to: ["admin@mcnpnetwork.com"],
                subject: `${statusEmoji} MCNP Network is now ${statusText}`,
                html: `<div style="background:#0c0c0c;padding:40px 20px;font-family:sans-serif;"><div style="max-width:600px;margin:0 auto;background:#1a1a1a;border-radius:16px;padding:40px;border:1px solid #333;"><h1 style="color:#fff;text-align:center;">${statusEmoji} Server Status Alert</h1><div style="background:${statusColor}15;border:1px solid ${statusColor}40;border-radius:12px;padding:24px;text-align:center;margin:24px 0;"><div style="font-size:48px;">${statusEmoji}</div><h2 style="color:${statusColor};">MCNP Network is now ${statusText}</h2>${isOnline ? `<p style="color:#888;">Players: ${javaPlayers}/${javaMaxPlayers}</p>` : ""}</div><p style="color:#888;text-align:center;">Time (Nepal): ${nepalTime}</p><p style="color:#666;font-size:12px;text-align:center;margin-top:24px;">MCNP Network Status Monitor</p></div></div>`,
              }),
            });
            console.log("Email notification sent via REST API");
          } catch (emailErr) {
            console.error("Email send error:", emailErr);
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, online: isOnline, players: javaPlayers, bedrockOnline, statusChanged }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "aggregate_hourly") {
      const now = new Date();
      const nepalOffset = 5 * 60 + 45;
      const nepalMs = now.getTime() + nepalOffset * 60 * 1000;
      const nepalNow = new Date(nepalMs);

      const nepalHourStart = new Date(nepalNow);
      nepalHourStart.setMinutes(0, 0, 0);

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
      await supabase.rpc("aggregate_daily_uptime");
      await supabase.rpc("aggregate_today_uptime");

      return new Response(
        JSON.stringify({ success: true, action: "aggregate_daily" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "send_stats") {
      const { data: uptimeData } = await supabase.rpc("get_uptime_stats", { hours_back: 24 });

      const discordWebhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");
      if (discordWebhookUrl && uptimeData && uptimeData.length > 0) {
        const stats = uptimeData[0];
        const nepalTime = new Date().toLocaleString("en-US", {
          timeZone: "Asia/Kathmandu",
          dateStyle: "medium",
          timeStyle: "short",
        });

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
          footer: { text: "MCNP Network • Updates every 5 minutes. Made by Sakshyam Paudel." },
          timestamp: new Date().toISOString(),
        };

        await fetch(discordWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "MCNP Status Bot",
            avatar_url: "https://mcnpstatus.netlify.app/favicon.png",
            embeds: [embed],
          }),
        });
      }

      return new Response(
        JSON.stringify({ success: true, action: "send_stats" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ─── HOURLY REPORT ───
    if (action === "hourly_report") {
      const discordWebhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");
      if (!discordWebhookUrl) {
        return new Response(JSON.stringify({ error: "No webhook" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
      }

      // Get current server status
      const javaRes = await fetch(JAVA_API_URL);
      const javaData = await javaRes.json();
      const currentPlayers = javaData.players?.online || 0;
      const maxPlayers = javaData.players?.max || 0;
      const isOnline = javaData.online === true;

      // Get 1-hour stats
      const { data: hourStats } = await supabase.rpc("get_uptime_stats", { hours_back: 1 });
      // Get 24-hour stats for context
      const { data: dayStats } = await supabase.rpc("get_uptime_stats", { hours_back: 24 });
      // Get 7-day stats
      const { data: weekStats } = await supabase.rpc("get_uptime_stats", { hours_back: 168 });

      const h = hourStats?.[0] || {};
      const d = dayStats?.[0] || {};
      const w = weekStats?.[0] || {};

      const nepalTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu", dateStyle: "medium", timeStyle: "short" });

      // Build capacity bar
      const barLen = 10;
      const filled = Math.round((currentPlayers / Math.max(maxPlayers, 1)) * barLen);
      const capacityBar = "🟩".repeat(filled) + "⬛".repeat(barLen - filled);

      // Uptime visual bar (24h)
      const uptimePct24 = Number(d.uptime_percentage || 0);
      const uptimeFilled = Math.round((uptimePct24 / 100) * barLen);
      const uptimeBar = "🟦".repeat(uptimeFilled) + "⬛".repeat(barLen - uptimeFilled);

      const embed = {
        title: "⏰ Hourly Status Report",
        description: `**MCNP Network** — Hourly server health summary`,
        color: 0x6366f1,
        fields: [
          { name: "📡 Current Status", value: isOnline ? "🟢 **ONLINE**" : "🔴 **OFFLINE**", inline: true },
          { name: "👥 Players Now", value: `**${currentPlayers}** / ${maxPlayers}`, inline: true },
          { name: "📊 Capacity", value: capacityBar + ` (${maxPlayers > 0 ? Math.round((currentPlayers / maxPlayers) * 100) : 0}%)`, inline: false },
          { name: "━━━ Last Hour ━━━", value: "\u200b", inline: false },
          { name: "⬆️ Uptime", value: `${Number(h.uptime_percentage || 0).toFixed(1)}%`, inline: true },
          { name: "👥 Avg Players", value: `${Number(h.avg_players || 0).toFixed(1)}`, inline: true },
          { name: "🏆 Peak Players", value: `${h.max_players || 0}`, inline: true },
          { name: "━━━ 24 Hour Overview ━━━", value: "\u200b", inline: false },
          { name: "⬆️ Uptime (24h)", value: uptimeBar + ` ${uptimePct24.toFixed(1)}%`, inline: false },
          { name: "👥 Avg Players", value: `${Number(d.avg_players || 0).toFixed(1)}`, inline: true },
          { name: "🏆 Peak Players", value: `${d.max_players || 0}`, inline: true },
          { name: "📡 Avg Ping", value: d.avg_ping ? `${Math.round(Number(d.avg_ping))}ms` : "N/A", inline: true },
          { name: "━━━ 7 Day Overview ━━━", value: "\u200b", inline: false },
          { name: "⬆️ Uptime (7d)", value: `${Number(w.uptime_percentage || 0).toFixed(1)}%`, inline: true },
          { name: "👥 Avg Players", value: `${Number(w.avg_players || 0).toFixed(1)}`, inline: true },
          { name: "🏆 Peak Players", value: `${w.max_players || 0}`, inline: true },
          { name: "🕐 Nepal Time", value: nepalTime, inline: false },
        ],
        footer: { text: "MCNP Network • Hourly Report • Made by Sakshyam Paudel" },
        timestamp: new Date().toISOString(),
      };

      await fetch(discordWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "MCNP Status Bot", avatar_url: "https://mcnpstatus.netlify.app/favicon.png", embeds: [embed] }),
      });

      return new Response(JSON.stringify({ success: true, action: "hourly_report" }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // ─── 24-HOUR DAILY REPORT (12 PM Nepal Time) ───
    if (action === "daily_report") {
      const discordWebhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");
      if (!discordWebhookUrl) {
        return new Response(JSON.stringify({ error: "No webhook" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
      }

      // Current server status
      const javaRes = await fetch(JAVA_API_URL);
      const javaData = await javaRes.json();
      const currentPlayers = javaData.players?.online || 0;
      const maxPlayers = javaData.players?.max || 0;
      const isOnline = javaData.online === true;

      // Ping measurement
      const pingStart = performance.now();
      await fetch(JAVA_API_URL, { method: "HEAD" }).catch(() => {});
      const currentPing = Math.round(performance.now() - pingStart);

      // Get 24h, 7d, 30d stats
      const [res24, res7d, res30d] = await Promise.all([
        supabase.rpc("get_uptime_stats", { hours_back: 24 }),
        supabase.rpc("get_uptime_stats", { hours_back: 168 }),
        supabase.rpc("get_uptime_stats", { hours_back: 720 }),
      ]);

      const s24 = res24.data?.[0] || {};
      const s7d = res7d.data?.[0] || {};
      const s30d = res30d.data?.[0] || {};

      // Get hourly player breakdown for last 24h
      const { data: hourlyData } = await supabase.rpc("get_hourly_player_stats", { hours_back: 24 });

      // Build player history sparkline (last 12 hours shown)
      const recentHours = (hourlyData || []).slice(-12);
      const maxPeak = Math.max(...recentHours.map((h: { peak_players: number }) => h.peak_players || 0), 1);
      const sparkline = recentHours.map((h: { peak_players: number }) => {
        const ratio = (h.peak_players || 0) / maxPeak;
        if (ratio > 0.75) return "█";
        if (ratio > 0.5) return "▆";
        if (ratio > 0.25) return "▃";
        if (ratio > 0) return "▁";
        return "░";
      }).join("");

      // Uptime rating
      const uptime24 = Number(s24.uptime_percentage || 0);
      let uptimeRating = "💀 Critical";
      if (uptime24 >= 99) uptimeRating = "⭐ Excellent";
      else if (uptime24 >= 95) uptimeRating = "✅ Good";
      else if (uptime24 >= 90) uptimeRating = "⚠️ Fair";
      else if (uptime24 >= 75) uptimeRating = "🟡 Poor";

      const barLen = 15;
      const uptimeFilled = Math.round((uptime24 / 100) * barLen);
      const uptimeBar = "🟩".repeat(uptimeFilled) + "⬛".repeat(barLen - uptimeFilled);

      const nepalTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu", dateStyle: "full", timeStyle: "short" });
      const nepalDate = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Kathmandu", dateStyle: "long" });

      const embeds = [
        {
          title: "📋 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
          description: `# 🌟 MCNP Network — Daily Report\n**${nepalDate}**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          color: 0xf59e0b,
          fields: [
            { name: "📡 Server Status", value: isOnline ? "```diff\n+ 🟢 ONLINE\n```" : "```diff\n- 🔴 OFFLINE\n```", inline: true },
            { name: "🏓 Current Ping", value: `\`\`\`${currentPing}ms\`\`\``, inline: true },
            { name: "👥 Players Online", value: `\`\`\`${currentPlayers} / ${maxPlayers}\`\`\``, inline: true },
          ],
          footer: { text: "Section 1/3 — Current Status" },
        },
        {
          title: "📊 24-Hour Performance Summary",
          description: `**Uptime Rating:** ${uptimeRating}\n${uptimeBar} **${uptime24.toFixed(2)}%**`,
          color: 0x22c55e,
          fields: [
            { name: "━━━ 📈 Player Statistics (24h) ━━━", value: "\u200b", inline: false },
            { name: "👥 Average Players", value: `\`\`\`${Number(s24.avg_players || 0).toFixed(1)}\`\`\``, inline: true },
            { name: "🏆 Peak Players", value: `\`\`\`${s24.max_players || 0}\`\`\``, inline: true },
            { name: "📡 Average Ping", value: `\`\`\`${s24.avg_ping ? Math.round(Number(s24.avg_ping)) + "ms" : "N/A"}\`\`\``, inline: true },
            { name: "📋 Total Checks", value: `\`\`\`${s24.total_checks || 0}\`\`\``, inline: true },
            { name: "✅ Online Checks", value: `\`\`\`${s24.online_checks || 0}\`\`\``, inline: true },
            { name: "❌ Offline Checks", value: `\`\`\`${(Number(s24.total_checks || 0) - Number(s24.online_checks || 0))}\`\`\``, inline: true },
            { name: "📊 Player Activity (Last 12 Hours)", value: `\`\`\`\n${sparkline || "No data"}\n\`\`\`\n${recentHours.map((h: { hour_label: string; peak_players: number }) => `\`${h.hour_label}\`: **${h.peak_players}** peak`).join(" • ") || "No data"}`, inline: false },
          ],
          footer: { text: "Section 2/3 — 24h Performance" },
        },
        {
          title: "📅 Extended Statistics",
          description: "Long-term server health overview",
          color: 0x8b5cf6,
          fields: [
            { name: "━━━ 🗓️ 7-Day Stats ━━━", value: "\u200b", inline: false },
            { name: "⬆️ Uptime", value: `**${Number(s7d.uptime_percentage || 0).toFixed(2)}%**`, inline: true },
            { name: "👥 Avg Players", value: `**${Number(s7d.avg_players || 0).toFixed(1)}**`, inline: true },
            { name: "🏆 Peak Players", value: `**${s7d.max_players || 0}**`, inline: true },
            { name: "━━━ 📆 30-Day Stats ━━━", value: "\u200b", inline: false },
            { name: "⬆️ Uptime", value: `**${Number(s30d.uptime_percentage || 0).toFixed(2)}%**`, inline: true },
            { name: "👥 Avg Players", value: `**${Number(s30d.avg_players || 0).toFixed(1)}**`, inline: true },
            { name: "🏆 Peak Players", value: `**${s30d.max_players || 0}**`, inline: true },
            { name: "🕐 Report Generated", value: nepalTime, inline: false },
            { name: "🔗 Live Dashboard", value: "[mcnpstatus.netlify.app](https://mcnpstatus.netlify.app)", inline: false },
          ],
          footer: { text: "MCNP Network • Daily Report • Made by Sakshyam Paudel" },
          timestamp: new Date().toISOString(),
        },
      ];

      await fetch(discordWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "MCNP Daily Report", avatar_url: "https://mcnpstatus.netlify.app/favicon.png", embeds }),
      });

      return new Response(JSON.stringify({ success: true, action: "daily_report" }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
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
