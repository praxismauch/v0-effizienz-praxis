"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Logo } from "@/components/logo"
import { ArrowLeft } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("Passwörter stimmen nicht überein")
      setIsLoading(false)
      return
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
          data: {
            name: name,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        const { error: userError } = await supabase.from("users").insert({
          id: authData.user.id,
          email: email,
          name: name,
          role: "user",
          is_active: false, // User needs approval
          created_at: new Date().toISOString(),
        })

        if (userError && !userError.message.includes("duplicate")) {
          throw userError
        }
      }

      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ein Fehler ist aufgetreten")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6 ml-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Logo className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xl font-bold">Effizienz Praxis</span>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Startseite
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Registrieren</CardTitle>
            <CardDescription>Erstellen Sie ein neues Konto, um auf die Anwendung zuzugreifen</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} method="post">
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Max Mustermann"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="meine-email@beispiel.de"
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
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="repeat-password">Passwort wiederholen</Label>
                  <Input
                    id="repeat-password"
                    name="password-confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Konto wird erstellt..." : "Registrieren"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Haben Sie bereits ein Konto?{" "}
                <Link href="/auth/login" className="underline underline-offset-4">
                  Anmelden
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
