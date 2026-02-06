import { type NextRequest, NextResponse } from "next/server"

// Main proxy function (renamed from middleware in Next.js 16)
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Note: Rate limiting disabled in v0 preview environment
  // In production, add Upstash Redis rate limiting here

  // Create response that passes through to API routes
  const response = NextResponse.next({
    request,
  })

  // Add security headers
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}
