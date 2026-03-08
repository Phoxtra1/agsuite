import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");

    // Create admin client for DB operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Create user client to get current user
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const userAgent = body.userAgent || req.headers.get("user-agent") || "unknown";
    const deviceFingerprint = body.fingerprint || generateFingerprint(userAgent);

    // Parse browser and OS from user agent
    const browser = parseBrowser(userAgent);
    const os = parseOS(userAgent);

    // Get approximate location from request headers (Deno Deploy / Supabase provides these)
    const cfCountry = req.headers.get("cf-ipcountry") || req.headers.get("x-country") || "";
    const cfCity = req.headers.get("cf-ipcity") || "";
    const ipAddress = req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") || "";
    const locationHint = [cfCity, cfCountry].filter(Boolean).join(", ") || "Unknown location";

    // Check if this device is known
    const { data: existingDevice } = await supabaseAdmin
      .from("login_devices")
      .select("id, last_seen_at")
      .eq("user_id", user.id)
      .eq("device_fingerprint", deviceFingerprint)
      .maybeSingle();

    if (existingDevice) {
      // Known device — update last_seen_at
      await supabaseAdmin
        .from("login_devices")
        .update({ last_seen_at: new Date().toISOString(), ip_address: ipAddress })
        .eq("id", existingDevice.id);

      return new Response(
        JSON.stringify({ alert: false, message: "Known device" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // NEW DEVICE — store it
    await supabaseAdmin.from("login_devices").insert({
      user_id: user.id,
      device_fingerprint: deviceFingerprint,
      user_agent: userAgent.substring(0, 500),
      ip_address: ipAddress,
      location_hint: locationHint,
      browser,
      os,
    });

    // Send alert email
    if (brevoApiKey && user.email) {
      const now = new Date();
      const timeStr = now.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      });

      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: #f8f9fa; border-radius: 12px; padding: 32px; border: 1px solid #e9ecef;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; background: #fff3cd; border-radius: 50%; padding: 12px; margin-bottom: 12px;">
                <span style="font-size: 24px;">🔐</span>
              </div>
              <h1 style="margin: 0; font-size: 22px; color: #212529;">New Device Login</h1>
            </div>
            
            <p style="color: #495057; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
              Your Amineva account was just accessed from a new device. If this was you, no action is needed.
            </p>
            
            <div style="background: #ffffff; border-radius: 8px; padding: 20px; border: 1px solid #dee2e6;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #868e96; font-size: 13px; width: 100px;">When</td>
                  <td style="padding: 8px 0; color: #212529; font-size: 14px; font-weight: 500;">${timeStr}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #868e96; font-size: 13px;">Browser</td>
                  <td style="padding: 8px 0; color: #212529; font-size: 14px; font-weight: 500;">${browser}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #868e96; font-size: 13px;">OS</td>
                  <td style="padding: 8px 0; color: #212529; font-size: 14px; font-weight: 500;">${os}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #868e96; font-size: 13px;">Location</td>
                  <td style="padding: 8px 0; color: #212529; font-size: 14px; font-weight: 500;">${locationHint}</td>
                </tr>
                ${ipAddress ? `<tr>
                  <td style="padding: 8px 0; color: #868e96; font-size: 13px;">IP Address</td>
                  <td style="padding: 8px 0; color: #212529; font-size: 14px; font-weight: 500;">${ipAddress}</td>
                </tr>` : ""}
              </table>
            </div>
            
            <div style="margin-top: 24px; padding: 16px; background: #fff3cd; border-radius: 8px; border: 1px solid #ffc107;">
              <p style="margin: 0; color: #856404; font-size: 13px; line-height: 1.5;">
                <strong>Wasn't you?</strong> Change your password immediately and review your active sessions in Amineva Suite settings.
              </p>
            </div>
            
            <p style="margin-top: 24px; color: #adb5bd; font-size: 12px; text-align: center;">
              Amineva Global Suite — Security Alert
            </p>
          </div>
        </div>
      `;

      try {
        await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            accept: "application/json",
            "api-key": brevoApiKey,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            sender: { name: "Amineva Security", email: "noreply@amineva.com" },
            to: [{ email: user.email, name: user.user_metadata?.name || user.email }],
            subject: "New device login to your Amineva account",
            htmlContent,
            tags: ["security-alert", "new-device"],
          }),
        });
      } catch (emailErr) {
        console.error("[login-alert] Failed to send email:", emailErr);
        // Don't fail the request if email fails
      }
    }

    return new Response(
      JSON.stringify({ alert: true, message: "New device detected, alert sent" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[login-alert] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/** Simple fingerprint from user agent string */
function generateFingerprint(userAgent: string): string {
  let hash = 0;
  for (let i = 0; i < userAgent.length; i++) {
    const char = userAgent.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `ua_${Math.abs(hash).toString(36)}`;
}

/** Extract browser name from user agent */
function parseBrowser(ua: string): string {
  if (ua.includes("Edg/")) return "Microsoft Edge";
  if (ua.includes("OPR/") || ua.includes("Opera")) return "Opera";
  if (ua.includes("Chrome/") && !ua.includes("Edg/")) return "Google Chrome";
  if (ua.includes("Safari/") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Firefox/")) return "Firefox";
  return "Unknown Browser";
}

/** Extract OS from user agent */
function parseOS(ua: string): string {
  if (ua.includes("Windows NT 10")) return "Windows 10/11";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS X")) return "macOS";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  if (ua.includes("Linux")) return "Linux";
  return "Unknown OS";
}
