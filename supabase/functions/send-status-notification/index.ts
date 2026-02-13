import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface StatusNotificationRequest {
  email: string;
  serverName: string;
  status: 'online' | 'offline';
  timestamp: string;
  playerCount?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, serverName, status, timestamp, playerCount }: StatusNotificationRequest = await req.json();

    if (!email || !serverName || !status) {
      throw new Error("Missing required fields: email, serverName, status");
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const isOnline = status === 'online';
    const statusEmoji = isOnline ? '🟢' : '🔴';
    const statusText = isOnline ? 'Online' : 'Offline';
    const statusColor = isOnline ? '#22c55e' : '#ef4444';

    const nepalTime = new Date(timestamp).toLocaleString('en-US', {
      timeZone: 'Asia/Kathmandu',
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "MCNP Network <onboarding@resend.dev>",
        to: [email],
        subject: `${statusEmoji} ${serverName} is now ${statusText}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin:0;padding:0;background-color:#0c0c0c;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
              <div style="background:linear-gradient(135deg,#1a1a1a 0%,#0d0d0d 100%);border-radius:16px;padding:40px;border:1px solid #333;">
                <div style="text-align:center;margin-bottom:30px;">
                  <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:bold;">${statusEmoji} Server Status Alert</h1>
                </div>
                <div style="background:${statusColor}15;border:1px solid ${statusColor}40;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                  <div style="font-size:48px;margin-bottom:12px;">${statusEmoji}</div>
                  <h2 style="color:${statusColor};margin:0 0 8px 0;font-size:24px;font-weight:bold;">${serverName}</h2>
                  <p style="color:${statusColor};margin:0;font-size:18px;">is now <strong>${statusText}</strong></p>
                </div>
                <div style="background:#1f1f1f;border-radius:8px;padding:16px;margin-bottom:24px;">
                  <table style="width:100%;border-collapse:collapse;">
                    <tr><td style="color:#888;padding:8px 0;font-size:14px;">Time (Nepal)</td><td style="color:#fff;padding:8px 0;font-size:14px;text-align:right;">${nepalTime}</td></tr>
                    ${playerCount !== undefined ? `<tr><td style="color:#888;padding:8px 0;font-size:14px;">Players Online</td><td style="color:#fff;padding:8px 0;font-size:14px;text-align:right;">${playerCount}</td></tr>` : ''}
                    <tr><td style="color:#888;padding:8px 0;font-size:14px;">Server Address</td><td style="color:#22d3ee;padding:8px 0;font-size:14px;text-align:right;">play.mcnpnetwork.com</td></tr>
                  </table>
                </div>
                ${isOnline ? `<div style="text-align:center;margin-bottom:24px;"><a href="https://statusmcnp.lovable.app" style="display:inline-block;background:linear-gradient(135deg,#22d3ee 0%,#0ea5e9 100%);color:#000;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:16px;">View Server Status</a></div>` : `<div style="text-align:center;margin-bottom:24px;"><p style="color:#888;font-size:14px;margin:0;">We'll notify you when the server comes back online.</p></div>`}
                <div style="text-align:center;border-top:1px solid #333;padding-top:24px;"><p style="color:#666;font-size:12px;margin:0;">This is an automated notification from MCNP Network Status Monitor</p></div>
              </div>
            </div>
          </body>
          </html>`,
      }),
    });

    const data = await emailResponse.json();
    console.log("Status notification email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in send-status-notification function:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
