import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { cookies, headers } from "next/headers"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from "@/components/providers"
import { SidebarProvider } from "@/components/ui/sidebar"
import { getCurrentUserProfile } from "@/lib/auth/get-current-user"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Effizienz Praxis",
  description: "Struktur. Erfolg. Leichtigkeit. - Moderne Praxismanagement Software",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  generator: "v0.app",
}

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/auth/login",
  "/auth/register",
  "/auth/sign-up",
  "/auth/reset-password",
  "/auth/callback",
  "/auth/pending-approval",
  "/auth/sign-up-success",
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
  "/impressum",
  "/datenschutz",
  "/agb",
  "/sicherheit",
  "/cookies",
]

const PUBLIC_PREFIXES = ["/features/", "/blog/", "/auth/"]

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return true
  }
  return false
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Next.js 16: headers() and cookies() must be awaited
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") || headersList.get("x-invoke-path") || "/"

  let initialUser = null
  if (!isPublicRoute(pathname)) {
    try {
      initialUser = await getCurrentUserProfile()
    } catch {
      // Silently fail - user will be redirected to login if needed
    }
  }

  const cookieStore = await cookies()
  const sidebarStateCookie = cookieStore.get("sidebar_state")
  const defaultSidebarOpen = sidebarStateCookie?.value !== "false"

  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes"
        />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* DNS prefetch for common domains */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        {/* Apple touch icon */}
        <link rel="apple-touch-icon" href="/logo.png" />
        {/* Manifest for PWA */}
        <link rel="manifest" href="/manifest.json" />
        {/* Open Graph meta tags */}
        <meta property="og:title" content="Effizienz Praxis" />
        <meta
          property="og:description"
          content="Struktur. Erfolg. Leichtigkeit. - Moderne Praxismanagement Software"
        />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:type" content="website" />
        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Effizienz Praxis" />
        <meta
          name="twitter:description"
          content="Struktur. Erfolg. Leichtigkeit. - Moderne Praxismanagement Software"
        />
        <meta name="twitter:image" content="/logo.png" />
        {/* Apple-specific meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Effizienz Praxis" />
        {/* Microsoft specific */}
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
          suppressHydrationWarning
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <Providers initialUser={initialUser}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <SidebarProvider defaultOpen={true}>
              {children}
              <Toaster />
            </SidebarProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
