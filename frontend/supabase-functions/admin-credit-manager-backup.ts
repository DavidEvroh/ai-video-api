import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const ADMIN_EMAIL = "davidevroh1989@gmail.com";
function reply(status: number, body: object) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return reply(405, { error: "Method not allowed." });
  }
  const authorization = req.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token || token === authorization) {
    return reply(401, { error: "Please sign in first." });
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    return reply(500, {
      error: "Server configuration is incomplete.",
    });
  }
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  // Verify the supplied access token with Supabase.
  const { data: authData, error: authError } =
    await admin.auth.getUser(token);
  if (authError || !authData.user) {
    return reply(401, { error: "Your login is invalid or expired." });
  }
  // Only the designated admin email may adjust credits.
  if (
    authData.user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()
  ) {
    return reply(403, { error: "Admin access required." });
  }
  let body: { targetEmail?: string; credits?: number };
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: "Invalid JSON request." });
  }
  const targetEmail = body.targetEmail?.trim().toLowerCase();
  const credits = body.credits;
  if (
    !targetEmail ||
    typeof credits !== "number" ||
    !Number.isSafeInteger(credits) ||
    credits < 0 ||
    credits > 1000000
  ) {
    return reply(400, {
      error: "Enter a valid customer email and whole-number credit balance (0–1000000).",
    });
  }
  // Find the customer's Supabase Auth account by email.
  let targetUser: { id: string } | undefined;
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) {
      return reply(500, { error: "Could not look up the customer." });
    }
    targetUser = data.users.find(
      (user) => user.email?.toLowerCase() === targetEmail
    );
    if (targetUser || data.users.length < 1000) {
      break;
    }
  }
  if (!targetUser) {
    return reply(404, {
      error: "Customer not found. Check the email address.",
    });
  }
  // Update only the customer's existing profile.
  const { data: profile, error: updateError } = await admin
    .from("profiles")
    .update({ credits })
    .eq("id", targetUser.id)
    .select("id, credits")
    .maybeSingle();
  if (updateError) {
    return reply(500, { error: "Credit update failed." });
  }
  if (!profile) {
    return reply(404, {
      error: "Customer profile not found. No credits were changed.",
    });
  }
  return reply(200, {
    success: true,
    message: "Customer credit balance updated.",
    credits: profile.credits,
  });
});