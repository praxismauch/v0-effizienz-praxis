import { type NextRequest, NextResponse } from "next/server"

// Next.js 16 proxy function (replaces middleware)
// This is a simplified version without rate limiting for the v0 preview environment
export async function proxy(request: NextRequest) {
  // Pass through all requests to their handlers
  const response = NextResponse.next({
    request,
  })

  // Add security headers
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  return response
}

// Match all routes except static assets
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}
