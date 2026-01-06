import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { cookies } from "next/headers"
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
    icon: "/favicon.svg",
    apple: "/icon.svg",
  },
  generator: "v0.app",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const initialUser = await getCurrentUserProfile()

  const cookieStore = await cookies()
  const sidebarStateCookie = cookieStore.get("sidebar_state")
  const defaultSidebarOpen = sidebarStateCookie?.value !== "false"

  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  'use strict';
  
  // Guard: Only patch once
  if (typeof window === 'undefined') return;
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
    
    console.log('[v0] btoa/atob polyfill loaded successfully');
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
