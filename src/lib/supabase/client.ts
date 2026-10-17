// Supabase Browser Client
import { createBrowserClient } from "@supabase/ssr";
import { env } from "../config/env";

export function createClient() {
  return createBrowserClient(
    env.supabaseUrl || "https://placeholder.supabase.co",
    env.supabasePublishableKey || "placeholder_anon_key"
  );
}
