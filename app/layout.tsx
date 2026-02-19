import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { headers } from "next/headers"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from "@/components/providers"
import { SidebarProvider } from "@/components/ui/sidebar"
import { getCurrentUserProfile } from "@/lib/auth/get-current-user"
import { isPublicRoute } from "@/lib/constants/routes"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const dynamic = "force-dynamic"

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://effizienz-praxis.de"

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Effizienz Praxis | Praxismanagement Software für Arztpraxen & MVZ",
    template: "%s | Effizienz Praxis",
  },
  description:
    "Die moderne Praxismanagement-Software für Arztpraxen, Zahnarztpraxen & MVZ. KI-gestützte Mitarbeiterentwicklung, Team-Management, Dienstplanung & Aufgabenverwaltung. DSGVO-konform. Jetzt kostenlos testen.",
  keywords: [
    "Praxismanagement Software",
    "Arztpraxis Software",
    "Zahnarztpraxis Management",
    "MVZ Software",
    "Praxisverwaltung",
    "Mitarbeiterentwicklung Arztpraxis",
    "Team-Management Praxis",
    "Dienstplanung Arztpraxis",
    "QM Software Arztpraxis",
    "Praxis Digitalisierung",
    "DSGVO-konforme Praxissoftware",
    "KI Praxismanagement",
  ],
  authors: [{ name: "Effizienz Praxis GmbH", url: BASE_URL }],
  creator: "Effizienz Praxis GmbH",
  publisher: "Effizienz Praxis GmbH",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: BASE_URL,
    siteName: "Effizienz Praxis",
    title: "Effizienz Praxis | Praxismanagement Software für Arztpraxen & MVZ",
    description:
      "Die moderne Praxismanagement-Software mit KI-gestützter Mitarbeiterentwicklung, Team-Management & Aufgabenverwaltung. DSGVO-konform. Jetzt kostenlos testen.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Effizienz Praxis - Praxismanagement Software",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Effizienz Praxis | Praxismanagement Software",
    description:
      "Moderne Praxismanagement-Software mit KI-gestützter Mitarbeiterentwicklung. DSGVO-konform. Jetzt kostenlos testen.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      "de-DE": BASE_URL,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  },
  category: "Healthcare Software",
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

  // Use static default to prevent hydration mismatch
  // Sidebar state will be managed client-side after hydration
  const defaultSidebarOpen = true

  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        {/* Apple-specific meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Effizienz Praxis" />
        {/* Microsoft specific */}
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        {/* Inline theme script to prevent FOUC */}
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
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers initialUser={initialUser}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <SidebarProvider defaultOpen={defaultSidebarOpen}>
              {children}
              <Toaster />
            </SidebarProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
