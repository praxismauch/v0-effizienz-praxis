"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, Suspense } from "react"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const redirectTo = searchParams.get("redirectTo") || "/dashboard"

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Login: Starting for:", email)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Important: include cookies in request/response
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("[v0] Login error:", data.error)
        throw new Error(data.error || "Authentifizierung fehlgeschlagen")
      }

      if (!data.success) {
        throw new Error(data.error || "Keine Benutzerdaten erhalten")
      }

      console.log("[v0] Login successful, redirecting to:", redirectTo)
      router.push(redirectTo)
      router.refresh()
    } catch (error) {
      console.error("[v0] Login error:", error)
      let errorMessage = "Ein Fehler ist aufgetreten"
      if (error instanceof Error) {
        const msg = error.message.toLowerCase()
        if (msg.includes("invalid") || msg.includes("credentials")) {
          errorMessage = "Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort."
        } else if (msg.includes("email") && msg.includes("confirm")) {
          errorMessage = "Bitte bestätigen Sie Ihre E-Mail-Adresse, bevor Sie sich anmelden."
        } else if (msg.includes("genehmigung") || msg.includes("administrator")) {
          errorMessage = error.message
        } else {
          errorMessage = error.message
        }
      }
      setError(errorMessage)
    } finally {
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Wird angemeldet..." : "Anmelden"}
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
