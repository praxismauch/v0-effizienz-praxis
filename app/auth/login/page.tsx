"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, Suspense, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

async function verifySessionWithRetry(maxRetries = 8, initialDelay = 300): Promise<{ success: boolean; user?: any }> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Exponential backoff: 300ms, 450ms, 675ms, 1012ms, 1518ms, 2277ms, 3416ms, 5124ms
    const delay = initialDelay * Math.pow(1.5, attempt)

    // Wait before each attempt to let cookies propagate
    await new Promise((resolve) => setTimeout(resolve, delay))

    try {
      const response = await fetch("/api/user/me", {
        credentials: "include",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          console.log(`[v0] Session verified on attempt ${attempt + 1}`)
          return { success: true, user: data.user }
        }
      }

      // 401 means session not ready yet, keep trying
      if (response.status === 401) {
        console.log(`[v0] Session not ready (attempt ${attempt + 1}/${maxRetries}), waiting ${Math.round(delay)}ms...`)
        continue
      }

      // Other errors, log but continue trying
      console.warn(`[v0] Session verification attempt ${attempt + 1} failed with status ${response.status}`)
    } catch (error) {
      console.warn(`[v0] Session verification attempt ${attempt + 1} error:`, error)
    }
  }

  return { success: false }
}

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<string>("")
  const [supabase, setSupabase] = useState<any>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const redirectTo = searchParams.get("redirectTo") || "/dashboard"

  useEffect(() => {
    const client = createClient()
    if (client) {
      setSupabase(client)
    }
  }, [])

  useEffect(() => {
    if (!supabase) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      console.log("[LoginPage] Auth state changed:", event)

      if (event === "SIGNED_IN" && session) {
        console.log("[LoginPage] User signed in, redirecting to:", redirectTo)
        setStatus("Erfolgreich angemeldet! Weiterleitung...")

        // Small delay to ensure session is fully established
        setTimeout(() => {
          router.push(redirectTo)
          router.refresh()
        }, 500)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, redirectTo, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setStatus("Anmeldung wird durchgeführt...")

    if (!supabase) {
      setError("Supabase Client ist nicht verfügbar")
      setIsLoading(false)
      return
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        throw authError
      }

      if (!data.user) {
        throw new Error("Keine Benutzerdaten erhalten")
      }

      console.log("[LoginPage] Login successful, waiting for auth state change...")
      // onAuthStateChange will handle the redirect
    } catch (error: any) {
      let errorMessage = "Ein Fehler ist aufgetreten"
      if (error.message) {
        const msg = error.message.toLowerCase()
        if (msg.includes("invalid") || msg.includes("credentials")) {
          errorMessage = "Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort."
        } else if (msg.includes("email") && msg.includes("confirm")) {
          errorMessage = "Bitte bestätigen Sie Ihre E-Mail-Adresse, bevor Sie sich anmelden."
        } else {
          errorMessage = error.message
        }
      }
      setError(errorMessage)
      setStatus("")
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Anmelden</CardTitle>
        <CardDescription>Geben Sie Ihre E-Mail und Ihr Passwort ein</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@beispiel.de"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <div className="rounded-md bg-red-50 p-3 dark:bg-red-950">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            {status && !error && (
              <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-950">
                <p className="text-sm text-blue-600 dark:text-blue-400">{status}</p>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading || !supabase}>
              {isLoading ? status || "Wird angemeldet..." : "Anmelden"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function LoginFormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Anmelden</CardTitle>
        <CardDescription>Geben Sie Ihre E-Mail und Ihr Passwort ein</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="grid gap-2">
            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
            <div className="h-10 w-full bg-muted animate-pulse rounded" />
          </div>
          <div className="grid gap-2">
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            <div className="h-10 w-full bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-full bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="group flex flex-col items-center gap-3 transition-transform hover:scale-105">
            <div className="relative">
              <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-cyan-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              {/* Logo component is assumed to be imported elsewhere */}
              {/* <Logo className="h-16 w-16 relative" /> */}
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Effizienz Praxis
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Praxismanagement der Zukunft</p>
            </div>
          </Link>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Startseite
        </Link>

        <Suspense fallback={<LoginFormSkeleton />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
