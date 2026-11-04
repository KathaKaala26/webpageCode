import { createClient } from "@supabase/supabase-js";

/**
 * Client-safe Supabase client using the anon/public key — unlike supabaseAdmin(), this is
 * safe to import from "use client" components. It can only write to Storage with a
 * short-lived signed upload token minted server-side (see createProductVideoUploadUrl in
 * admin/actions.ts); the anon key alone grants no write access.
 */
export function supabasePublic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set");
  return createClient(url, key, { auth: { persistSession: false } });
}
