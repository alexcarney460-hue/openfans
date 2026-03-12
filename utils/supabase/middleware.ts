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

  // Dynamic username routes at root level (e.g., /somecreator)
  // These are public profile pages -- single segment after /
  if (/^\/[a-zA-Z0-9_-]+$/.test(pathname) && !pathname.startsWith("/api") && !pathname.startsWith("/dashboard")) {
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

  // If Supabase is not configured, skip auth entirely
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const method = request.method;
  const url = request.nextUrl.clone();

  // Always allow webhook routes through
  if (pathname.startsWith("/webhook")) {
    return supabaseResponse;
  }

  // Check if this is a public route
  if (isPublicRoute(pathname, method)) {
    // If user is logged in and visits root, redirect to dashboard
    if (user && pathname === "/") {
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // For API routes that need auth: let the route handler check auth
  // (returns 401 JSON instead of redirecting to login)
  if (pathname.startsWith("/api/")) {
    // API routes handle their own auth via getAuthenticatedUser()
    // The middleware just refreshes the session
    return supabaseResponse;
  }

  // For non-API protected routes (dashboard, etc.): redirect to login
  if (!user) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  return supabaseResponse;
}
