"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShieldAlert, RefreshCw, CheckCircle, XCircle } from "lucide-react"

// CAPTCHA site key from environment
const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || ""

interface CaptchaModalProps {
  open: boolean
  onClose: () => void
  onVerified: (token: string) => void
  title?: string
  description?: string
}

/**
 * Progressive CAPTCHA Modal
 * Shows when suspicious activity is detected (449 response)
 * Uses hCaptcha for GDPR-compliant verification
 * Falls back to a math challenge if hCaptcha is not configured
 */
export function CaptchaModal({
  open,
  onClose,
  onVerified,
  title = "Sicherheitsuberprufung",
  description = "Bitte bestatigen Sie, dass Sie kein Bot sind.",
}: CaptchaModalProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const captchaRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)

  // Math challenge fallback state
  const [mathChallenge, setMathChallenge] = useState({ a: 0, b: 0 })
  const [mathAnswer, setMathAnswer] = useState("")
  const useHCaptcha = HCAPTCHA_SITE_KEY.length > 0

  const generateMathChallenge = useCallback(() => {
    const a = Math.floor(Math.random() * 20) + 1
    const b = Math.floor(Math.random() * 20) + 1
    setMathChallenge({ a, b })
    setMathAnswer("")
    setStatus("idle")
    setErrorMessage("")
  }, [])

  // Load hCaptcha script dynamically
  useEffect(() => {
    if (!open || !useHCaptcha) return

    const existingScript = document.querySelector('script[src*="hcaptcha"]')
    if (existingScript) return

    const script = document.createElement("script")
    script.src = "https://js.hcaptcha.com/1/api.js?render=explicit"
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    return () => {
      // Cleanup not necessary - script can stay loaded
    }
  }, [open, useHCaptcha])

  // Render hCaptcha widget when ready
  useEffect(() => {
    if (!open || !useHCaptcha || !captchaRef.current) return

    const renderCaptcha = () => {
      if (typeof window !== "undefined" && (window as Record<string, unknown>).hcaptcha && captchaRef.current) {
        const hcaptcha = (window as Record<string, unknown>).hcaptcha as {
          render: (container: HTMLElement, options: Record<string, unknown>) => string
          reset: (widgetId: string) => void
        }

        // Clear previous widget
        if (widgetId.current) {
          try {
            hcaptcha.reset(widgetId.current)
          } catch {
            // Widget might not exist anymore
          }
        }

        widgetId.current = hcaptcha.render(captchaRef.current, {
          sitekey: HCAPTCHA_SITE_KEY,
          callback: (token: string) => {
            setStatus("success")
            setTimeout(() => onVerified(token), 500)
          },
          "error-callback": () => {
            setStatus("error")
            setErrorMessage("CAPTCHA-Uberprufung fehlgeschlagen. Bitte versuchen Sie es erneut.")
          },
          "expired-callback": () => {
            setStatus("idle")
            setErrorMessage("CAPTCHA abgelaufen. Bitte erneut losen.")
          },
          theme: "dark",
          size: "normal",
        })
      }
    }

    // Wait for hCaptcha to load
    const interval = setInterval(() => {
      if ((window as Record<string, unknown>).hcaptcha) {
        clearInterval(interval)
        renderCaptcha()
      }
    }, 100)

    const timeout = setTimeout(() => clearInterval(interval), 10000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [open, useHCaptcha, onVerified])

  // Generate math challenge on open (fallback)
  useEffect(() => {
    if (open && !useHCaptcha) {
      generateMathChallenge()
    }
  }, [open, useHCaptcha, generateMathChallenge])

  const handleMathSubmit = () => {
    const correctAnswer = mathChallenge.a + mathChallenge.b
    if (parseInt(mathAnswer, 10) === correctAnswer) {
      setStatus("success")
      // Generate a pseudo-token for the math challenge
      const token = `math-verified-${Date.now()}-${btoa(String(correctAnswer))}`
      setTimeout(() => onVerified(token), 500)
    } else {
      setStatus("error")
      setErrorMessage("Falsche Antwort. Bitte versuchen Sie es erneut.")
      generateMathChallenge()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--foreground)]">
            <ShieldAlert className="h-5 w-5 text-[var(--warning)]" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* Status indicators */}
          {status === "success" && (
            <div className="flex items-center gap-2 rounded-lg bg-[var(--success)]/10 px-4 py-3 text-[var(--success)]">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Verifizierung erfolgreich</span>
            </div>
          )}

          {status === "error" && errorMessage && (
            <div className="flex items-center gap-2 rounded-lg bg-[var(--destructive)]/10 px-4 py-3 text-[var(--destructive)]">
              <XCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{errorMessage}</span>
            </div>
          )}

          {/* hCaptcha widget */}
          {useHCaptcha && status !== "success" && (
            <div ref={captchaRef} className="flex items-center justify-center min-h-[78px]">
              <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">CAPTCHA wird geladen...</span>
              </div>
            </div>
          )}

          {/* Math challenge fallback */}
          {!useHCaptcha && status !== "success" && (
            <div className="flex flex-col items-center gap-4 w-full">
              <p className="text-sm text-[var(--muted-foreground)]">
                Bitte losen Sie die folgende Rechenaufgabe:
              </p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold font-mono text-[var(--foreground)]">
                  {mathChallenge.a} + {mathChallenge.b} =
                </span>
                <input
                  type="number"
                  value={mathAnswer}
                  onChange={(e) => setMathAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleMathSubmit()}
                  className="w-20 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-center text-lg font-mono text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  autoFocus
                  aria-label="Rechenaufgabe Antwort"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={generateMathChallenge}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Neue Aufgabe
                </Button>
                <Button size="sm" onClick={handleMathSubmit} disabled={!mathAnswer}>
                  Bestätigen
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CaptchaModal
