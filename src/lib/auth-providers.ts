/**
 * Social login buttons only show when explicitly enabled.
 * Set in .env.local / Vercel after turning the provider on in Supabase Auth.
 */
export function getEnabledSocialProviders(): Array<"google" | "github"> {
  const providers: Array<"google" | "github"> = [];
  if (process.env.NEXT_PUBLIC_AUTH_GOOGLE === "true") {
    providers.push("google");
  }
  if (process.env.NEXT_PUBLIC_AUTH_GITHUB === "true") {
    providers.push("github");
  }
  return providers;
}
