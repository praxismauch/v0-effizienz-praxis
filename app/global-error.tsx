"use client"

import { useEffect } from "react"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log to console in production since Logger might not be available
    console.error("[GlobalError]", error.message, error.digest)
  }, [error])

  return (
    <html lang="de">
      <body className={`${inter.className} antialiased`}>
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <svg
                className="h-8 w-8 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Kritischer Fehler</h1>
              <p className="mt-2 text-muted-foreground">
                Ein schwerwiegender Fehler ist aufgetreten. Die Anwendung konnte nicht geladen werden.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={reset}
                className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Erneut versuchen
              </button>
              <a
                href="/"
                className="inline-flex w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Zur Startseite
              </a>
            </div>
            {process.env.NODE_ENV === "development" && (
              <pre className="mt-4 rounded-md bg-muted p-3 text-left text-xs overflow-auto max-h-32">
                {error.message}
                {error.digest && `\nDigest: ${error.digest}`}
              </pre>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
