// Environment Configuration & Safe Accessor

export const isServer = typeof window === "undefined";

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
  
  // Privileged server-only keys
  get geminiApiKey(): string {
    if (!isServer) {
      throw new Error("SECURITY VIOLATION: GEMINI_API_KEY accessed on the client-side!");
    }
    return process.env.GEMINI_API_KEY || "";
  },

  isConfigured: {
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    gemini: Boolean(process.env.GEMINI_API_KEY),
  },
};
