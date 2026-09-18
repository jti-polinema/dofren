import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

let client = null;
let attempted = false;
let failReason = null; // null | "no-config" | "cdn-failed"

export function getBackendError() {
  return failReason;
}

// Kembalikan supabase client, atau null bila config kosong / CDN gagal (mode fallback seed.json).
export async function getSupabase() {
  if (client || attempted) return client;
  attempted = true;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) { failReason = "no-config"; return null; }
  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return client;
  } catch {
    failReason = "cdn-failed";
    return null;
  }
}
