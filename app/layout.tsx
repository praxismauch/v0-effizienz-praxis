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
    } catch (error) {
      console.error('[v0] Failed to get user profile:', error)
    }
  }

  const cookieStore = await cookies()
  const sidebarStateCookie = cookieStore.get("sidebar_state")
  const defaultSidebarOpen = sidebarStateCookie?.value !== "false"

  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        {/* DNS prefetch and preconnect for external resources */}
        <link rel="dns-prefetch" href="https://sytvmjmvwkqdzcfvjqkr.supabase.co" />
        <link rel="preconnect" href="https://sytvmjmvwkqdzcfvjqkr.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  'use strict';
  
  // Guard: Only patch once
  if (typeof window === 'undefined') return;
  
  // SUPPRESS SUPABASE AUTH FETCH ERRORS - Must be FIRST
  if (!window.__supabaseErrorSuppressed) {
    window.__supabaseErrorSuppressed = true;
    
    // Suppress unhandled promise rejections for auth errors
    window.addEventListener('unhandledrejection', function(event) {
      var msg = (event.reason && event.reason.message) || String(event.reason || '');
      if (msg.indexOf('Failed to fetch') !== -1 || 
          msg.indexOf('_getUser') !== -1 || 
          msg.indexOf('_useSession') !== -1 ||
          msg.indexOf('auth-js') !== -1 ||
          msg.indexOf('supabase') !== -1) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return false;
      }
    }, true);
    
    // Also suppress global errors
    var origOnError = window.onerror;
    window.onerror = function(msg, src, line, col, err) {
      var message = String(msg || '');
      if (message.indexOf('Failed to fetch') !== -1 ||
          message.indexOf('_getUser') !== -1 ||
          message.indexOf('_useSession') !== -1) {
        return true;
      }
      return origOnError ? origOnError.apply(this, arguments) : false;
    };
  }
  
  if (window.__btoaPatched === true) return;
  
  // Mark as patched immediately to prevent race conditions
  window.__btoaPatched = true;
  
  try {
    // Store original functions with proper binding
    var _btoa = window.btoa;
    var _atob = window.atob;
    var originalBtoa = function(str) { return _btoa.call(window, str); };
    var originalAtob = function(str) { return _atob.call(window, str); };
    
    // Check if TextEncoder is available
    var hasTextEncoder = typeof TextEncoder !== 'undefined';
    var hasTextDecoder = typeof TextDecoder !== 'undefined';
    
    // BTOA: String to Base64 with Unicode support
    window.btoa = function(str) {
      try {
        // Handle null/undefined/empty
        if (str == null || str === '') {
          return originalBtoa('');
        }
        
        str = String(str);
        
        // Fast path: Check if ASCII-only
        var isAscii = true;
        for (var i = 0; i < str.length; i++) {
          if (str.charCodeAt(i) > 127) {
            isAscii = false;
            break;
          }
        }
        
        // Use native btoa for ASCII strings
        if (isAscii) {
          return originalBtoa(str);
        }
        
        // Unicode path: Use TextEncoder if available
        if (hasTextEncoder) {
          try {
            var encoder = new TextEncoder();
            var bytes = encoder.encode(str);
            var binaryString = '';
            for (var j = 0; j < bytes.length; j++) {
              binaryString += String.fromCharCode(bytes[j]);
            }
            return originalBtoa(binaryString);
          } catch (unicodeError) {
            console.error('[v0-btoa] Unicode encoding failed:', unicodeError);
            // Fallback: Strip non-ASCII
            var asciiOnly = str.replace(/[^\\x00-\\x7F]/g, '?');
            return originalBtoa(asciiOnly);
          }
        } else {
          // No TextEncoder: Strip non-ASCII immediately
          console.warn('[v0-btoa] TextEncoder not available, replacing non-ASCII with ?');
          var stripped = str.replace(/[^\\x00-\\x7F]/g, '?');
          return originalBtoa(stripped);
        }
      } catch (outerError) {
        console.error('[v0-btoa] Fatal error:', outerError, 'Input type:', typeof str);
        return originalBtoa('');
      }
    };
    
    // ATOB: Base64 to String with Unicode support
    window.atob = function(str) {
      try {
        if (str == null || str === '') {
          return originalAtob('');
        }
        
        str = String(str);
        var decoded = originalAtob(str);
        
        // Try to decode as UTF-8 if TextDecoder is available
        if (hasTextDecoder) {
          try {
            var bytes = new Uint8Array(decoded.length);
            for (var i = 0; i < decoded.length; i++) {
              bytes[i] = decoded.charCodeAt(i);
            }
            var decoder = new TextDecoder('utf-8', { fatal: false });
            return decoder.decode(bytes);
          } catch (decodeError) {
            // Return raw decoded string if UTF-8 decode fails
            return decoded;
          }
        }
        
        return decoded;
      } catch (error) {
        console.error('[v0-atob] Decoding failed:', error);
        return '';
      }
    };
  } catch (patchError) {
    console.error('[v0] btoa/atob patching failed:', patchError);
  }
})();
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
