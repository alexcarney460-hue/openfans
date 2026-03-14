import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that are always publicly accessible (no auth required)
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/auth",
  "/forgot-password",
  "/explore",
  "/webhook",
  "/pricing",
  "/terms",
  "/privacy",
  "/help",
  "/contact",
  "/subscriptions",
  "/transactions",
  "/invest",
  "/content-policy",
  "/dmca",
  "/usc2257",
  "/anti-slavery",
  "/complaints",
  "/acceptable-use",
  "/refund-policy",
  "/error",
  "/ref",
];

// API routes that allow public GET access
const PUBLIC_API_GET_PATHS = ["/api/creators", "/api/posts"];

// API routes that require authentication for all methods
const PROTECTED_API_PATHS = [
  "/api/messages",
  "/api/tips",
  "/api/earnings",
  "/api/subscriptions",
];

function isPublicRoute(pathname: string, method: string): boolean {
  // Static public pages
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"))) {
    return true;
  }

  // Public API GET routes (creators list, creator profiles, posts list/detail)
  if (method === "GET" && PUBLIC_API_GET_PATHS.some((path) => pathname.startsWith(path))) {
    return true;
  }

  // Dynamic username routes (e.g., /somecreator or /somecreator/post/123)
  // These are public profile and post pages
  if (/^\/[a-zA-Z0-9_-]+(\/post\/[a-zA-Z0-9_-]+)?$/.test(pathname) && !pathname.startsWith("/api") && !pathname.startsWith("/dashboard") && !pathname.startsWith("/admin")) {
    return true;
  }

  return false;
}

function isProtectedApiRoute(pathname: string): boolean {
  // POST/DELETE to posts requires auth
  if (pathname.startsWith("/api/posts")) {
    return true; // Method check happens in the route handler via getAuthenticatedUser
  }

  return PROTECTED_API_PATHS.some((path) => pathname.startsWith(path));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // Always allow webhook routes through immediately
  if (pathname.startsWith("/webhook")) {
    return supabaseResponse;
  }

  // If Supabase is not configured, allow public routes and block protected ones
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isPublicRoute(pathname, method)) {
      return supabaseResponse;
    }
    return new NextResponse(
      JSON.stringify({ error: "Service unavailable", code: "SERVICE_UNAVAILABLE" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  // For public routes that don't need auth context (API endpoints, explore, etc.),
  // attempt Supabase session refresh but don't block on failure.
  // For the root path ("/"), we still need auth to decide on redirect.
  const routeIsPublic = isPublicRoute(pathname, method);
  const needsAuthForRedirect = routeIsPublic && pathname === "/";
  const needsAuth = !routeIsPublic || needsAuthForRedirect;

  let user = null;

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch {
    // Supabase client creation or auth check failed.
    // For public routes, continue without auth context.
    // For protected routes, deny access.
    if (!routeIsPublic) {
      if (pathname.startsWith("/api/")) {
        return new NextResponse(
          JSON.stringify({ error: "Service unavailable", code: "SERVICE_UNAVAILABLE" }),
          { status: 503, headers: { "Content-Type": "application/json" } },
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Public route handling
  if (routeIsPublic) {
    // If user is logged in and visits root, redirect to dashboard
    if (user && pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // For protected API routes: enforce auth at middleware level
  if (pathname.startsWith("/api/")) {
    if (isProtectedApiRoute(pathname) && !user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized", code: "AUTH_REQUIRED" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
    return supabaseResponse;
  }

  // For non-API protected routes (dashboard, etc.): redirect to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  return supabaseResponse;
}
