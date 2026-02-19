/**
 * Centralized public route definitions.
 * Used by both the root layout (server-side) and providers (client-side)
 * to determine if a route is public (no auth required).
 */
export const PUBLIC_ROUTES = [
  "/",
  // Auth routes
  "/login",
  "/register",
  "/auth/login",
  "/auth/register",
  "/auth/sign-up",
  "/auth/reset-password",
  "/auth/callback",
  "/auth/pending-approval",
  "/auth/sign-up-success",
  // Landing pages
  "/features",
  "/effizienz",
  "/about",
  "/contact",
  "/kontakt",
  "/preise",
  "/coming-soon",
  "/demo",
  "/help",
  "/careers",
  "/karriere",
  "/ueber-uns",
  "/team",
  "/info",
  "/wunschpatient",
  "/whats-new",
  "/updates",
  "/blog",
  // Legal pages
  "/impressum",
  "/datenschutz",
  "/agb",
  "/sicherheit",
  "/cookies",
  // Feature pages
  "/alle-funktionen",
  "/selbst-check",
  "/roi-analysis",
] as const

export const PUBLIC_ROUTE_PREFIXES = ["/features/", "/blog/", "/auth/"] as const

export function isPublicRoute(pathname: string): boolean {
  if ((PUBLIC_ROUTES as readonly string[]).includes(pathname)) return true
  for (const prefix of PUBLIC_ROUTE_PREFIXES) {
    if (pathname.startsWith(prefix)) return true
  }
  return false
}
