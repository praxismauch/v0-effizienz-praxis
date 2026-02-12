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
import { Logo } from "@/components/logo"

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
    try {
      const client = createClient()
      setSupabase(client)
    } catch {
      // Supabase not configured - will show error on form submit
    }
  }, [])

  // Check if already logged in on mount
  useEffect(() => {
    if (!supabase) return

    let isMounted = true

    const checkSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user && isMounted) {
          router.replace(redirectTo)
        }
      } catch {
        // No session - user can login fresh
      }
    }

    checkSession()
    
    return () => {
      isMounted = false
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
      // Direct login
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        throw authError
      }

      if (!data.user || !data.session) {
        throw new Error("Keine Benutzerdaten erhalten")
      }

      setStatus("Weiterleitung zum Dashboard...")
      
      // Hard navigation to ensure fresh cookies are sent to server
      window.location.href = redirectTo
      return // Prevent any further code execution
    } catch (error: any) {
      let errorMessage = "Ein Fehler ist aufgetreten"
      if (error.message) {
        const msg = error.message.toLowerCase()
        if (msg.includes("failed to fetch") || msg.includes("network") || msg.includes("fetch")) {
          errorMessage = "Verbindungsfehler - bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut."
        } else if (msg.includes("invalid") || msg.includes("credentials")) {
          errorMessage = "Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort."
        } else if (msg.includes("email") && msg.includes("confirm")) {
          errorMessage = "Bitte bestätigen Sie Ihre E-Mail-Adresse, bevor Sie sich anmelden."
        } else if (msg.includes("timeout")) {
          errorMessage = "Zeitüberschreitung - bitte versuchen Sie es erneut oder laden Sie die Seite neu."
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
              <Logo className="h-16 w-16 relative" />
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
