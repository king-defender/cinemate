import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * Singleton browser client — Realtime must share one WebSocket.
 * Always auth Realtime with the user JWT (never the publishable key alone),
 * or WebSocket can fail with CHANNEL_ERROR / transport failure.
 */
export function createClient() {
  if (browserClient) return browserClient;

  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      realtime: {
        params: { eventsPerSecond: 20 },
        heartbeatIntervalMs: 15000,
        reconnectAfterMs: (tries: number) =>
          Math.min(1000 * 2 ** tries, 12_000),
      },
    },
  );

  void browserClient.auth.getSession().then(({ data }) => {
    void browserClient?.realtime.setAuth(data.session?.access_token ?? "");
  });

  browserClient.auth.onAuthStateChange((_event, session) => {
    void browserClient?.realtime.setAuth(session?.access_token ?? "");
  });

  return browserClient;
}
