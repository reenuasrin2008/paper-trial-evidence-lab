// Supabase Server Client for App Router
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "../config/env";

export async function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient(
    env.supabaseUrl || "https://placeholder.supabase.co",
    env.supabasePublishableKey || "placeholder_anon_key",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}
