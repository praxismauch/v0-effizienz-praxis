"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Gift, Copy, Mail, Check, Users, Calendar, Loader2, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { usePractice } from "@/contexts/practice-context"

interface ReferralDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Referral {
  id: string
  referral_code: string
  referred_email: string
  status: string
  reward_months: number
  created_at: string
}

export function ReferralDialog({ open, onOpenChange }: ReferralDialogProps) {
  const { user } = useAuth()
  const { currentPractice } = usePractice()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [copied, setCopied] = useState(false)
  const [referralCode, setReferralCode] = useState<string>("")
  const [referralLink, setReferralLink] = useState<string>("")
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [email, setEmail] = useState("")
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (hasMounted && open && user) {
      loadReferralData()
    }
  }, [open, user, hasMounted])

  useEffect(() => {
    if (hasMounted && user && !referralCode) {
      const fallbackCode = `REF-${user.id.substring(0, 8).toUpperCase()}`
      setReferralCode(fallbackCode)
      if (typeof window !== "undefined") {
        const appUrl = window.location.origin
        setReferralLink(`${appUrl}/register?ref=${fallbackCode}`)
      }
    }
  }, [hasMounted, user, referralCode])

  const loadReferralData = async () => {
    if (!user) return

    setLoadingData(true)
    try {
      const response = await fetch(`/api/referrals?userId=${user.id}`)

      if (!response.ok) {
        throw new Error("Failed to load referral data")
      }

      const data = await response.json()

      if (data.referralCode) {
        setReferralCode(data.referralCode)
        if (typeof window !== "undefined") {
          const appUrl = window.location.origin
          setReferralLink(`${appUrl}/register?ref=${data.referralCode}`)
        }
      }

      if (data.referrals) {
        setReferrals(data.referrals)
      }
    } catch (error) {
      console.error("Error loading referral data:", error)
      if (user && !referralCode) {
        const fallbackCode = `REF-${user.id.substring(0, 8).toUpperCase()}`
        setReferralCode(fallbackCode)
        if (typeof window !== "undefined") {
          const appUrl = window.location.origin
          setReferralLink(`${appUrl}/register?ref=${fallbackCode}`)
        }
      }
    } finally {
      setLoadingData(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      toast({
        title: "Link kopiert!",
        description: "Der Empfehlungslink wurde in die Zwischenablage kopiert.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Link konnte nicht kopiert werden.",
        variant: "destructive",
      })
    }
  }

  const sendEmailInvite = async () => {
    if (!email || !referralCode) {
      console.log("[v0] Referral: Email or referral code missing", { email, referralCode })
      return
    }

    setLoading(true)
    try {
      console.log("[v0] Referral: Sending invite to", email)
      const response = await fetch("/api/referrals/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          referralCode,
          userId: user?.id,
          practiceId: currentPractice?.id,
        }),
      })

      console.log("[v0] Referral: API response status", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] Referral: API error", errorData)
        throw new Error(errorData.error || "Failed to send invite")
      }

      const result = await response.json()
      console.log("[v0] Referral: API success", result)

      if (!result.emailSent && result.emailError) {
        toast({
          title: "Teilweise erfolgreich",
          description: `Einladung erstellt, aber E-Mail konnte nicht versendet werden: ${result.emailError}`,
          variant: "destructive",
        })
      } else if (result.success) {
        toast({
          title: "Einladung versendet!",
          description: `Eine Einladung wurde an ${email} gesendet.`,
        })
        setEmail("")
        loadReferralData()
      }
    } catch (error) {
      console.error("[v0] Referral: Exception", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Einladung konnte nicht versendet werden.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const completedReferrals = referrals.filter((r) => r.status === "completed").length
  const pendingReferrals = referrals.filter((r) => r.status === "pending" || r.status === "registered").length
  const totalMonthsEarned = referrals
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + (r.reward_months || 3), 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Gift className="h-6 w-6 text-primary" />
            Freunde einladen
          </DialogTitle>
          <DialogDescription className="text-base">
            Einladen – und beide erhalten{" "}
            <span className="font-semibold text-primary">3 Monate Effizienz-Praxis kostenlos!</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-primary/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Eingeladen</span>
              </div>
              <p className="text-2xl font-bold">{referrals.length}</p>
            </div>
            <div className="bg-green-500/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Erfolgreich</span>
              </div>
              <p className="text-2xl font-bold">{completedReferrals}</p>
            </div>
            <div className="bg-purple-500/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Gratis-Monate</span>
              </div>
              <p className="text-2xl font-bold">{totalMonthsEarned}</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 rounded-xl p-6 text-center">
            <Sparkles className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="text-xl font-bold mb-2">3 Monate geschenkt – für Sie und Ihre Empfehlung!</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Laden Sie Kollegen ein und Sie beide erhalten jeweils 3 Monate Effizienz-Praxis kostenlos nach
              erfolgreicher Registrierung.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-lg">So funktioniert es:</h3>
            <ol className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="font-semibold text-primary">1.</span>
                <span>Teilen Sie Ihren persönlichen Empfehlungslink mit Kollegen</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary">2.</span>
                <span>Ihre Empfehlung registriert sich über Ihren Link</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary">3.</span>
                <span>
                  Nach erfolgreicher Registrierung erhalten <strong>Sie beide</strong> jeweils 3 Monate kostenlos!
                </span>
              </li>
            </ol>
          </div>

          {/* Referral Link */}
          <div className="space-y-2">
            <Label>Ihr Empfehlungslink</Label>
            <div className="flex gap-2">
              {loadingData && !referralLink ? (
                <div className="flex-1 flex items-center justify-center h-10 border rounded-md bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Input
                  value={referralLink}
                  readOnly
                  className="font-mono text-sm"
                  placeholder={!user ? "Bitte einloggen..." : "Laden..."}
                />
              )}
              <Button onClick={copyToClipboard} variant="outline" size="icon" disabled={!referralLink}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Code: {referralCode || (loadingData ? "Laden..." : "-")}</p>
          </div>

          {/* Email Invite */}
          <div className="space-y-2">
            <Label>Einladung per E-Mail senden</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@beispiel.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendEmailInvite()}
              />
              <Button onClick={sendEmailInvite} disabled={!email || loading} variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Senden
              </Button>
            </div>
          </div>

          {/* Referral History */}
          {referrals.length > 0 && (
            <div className="space-y-2">
              <Label>Empfehlungsverlauf</Label>
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {referrals.map((referral) => (
                  <div key={referral.id} className="p-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{referral.referred_email}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(referral.created_at).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          referral.status === "completed"
                            ? "bg-green-500/10 text-green-600"
                            : referral.status === "registered"
                              ? "bg-blue-500/10 text-blue-600"
                              : "bg-yellow-500/10 text-yellow-600"
                        }`}
                      >
                        {referral.status === "completed"
                          ? "Abgeschlossen"
                          : referral.status === "registered"
                            ? "Registriert"
                            : "Ausstehend"}
                      </span>
                      {referral.status === "completed" && (
                        <p className="text-xs text-muted-foreground mt-1">+{referral.reward_months || 3} Monate</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ReferralDialog
