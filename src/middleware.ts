import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Only runs on page routes that need auth redirects.
 * Skipping /api/* avoids an Auth round-trip on every notification poll.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getSession reads the JWT locally; getUser always hits Supabase Auth (slow from IN→KR)
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const path = request.nextUrl.pathname;
  const protectedPaths = [
    "/settings",
    "/buddy",
    "/rooms/new",
    "/history",
    "/communities",
    "/dashboard",
  ];
  const isProtected =
    protectedPaths.some((p) => path === p || path.startsWith(p + "/")) ||
    (path.startsWith("/rooms/") && !path.startsWith("/rooms/join/"));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && (path === "/login" || path === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings",
    "/buddy",
    "/rooms/:path*",
    "/history",
    "/communities",
    "/login",
    "/register",
    "/profile/:path*",
  ],
};
