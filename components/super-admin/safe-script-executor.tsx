"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Shield, ShieldAlert, Play, AlertTriangle, CheckCircle2, Loader2, Database, Lock } from "lucide-react"

interface ValidationResult {
  environment: {
    environment: string
    isProduction: boolean
    requiresConfirmation: boolean
  }
  warnings: { pattern: string; description: string }[]
  blocked: boolean
  alreadyRun: boolean
  canExecute: boolean
  message: string
}

interface SafeScriptExecutorProps {
  scriptName: string
  scriptContent: string
  onExecute: () => Promise<void>
  disabled?: boolean
}

export function SafeScriptExecutor({ scriptName, scriptContent, onExecute, disabled }: SafeScriptExecutorProps) {
  const [isValidating, setIsValidating] = useState(false)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [acceptedRisks, setAcceptedRisks] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)

  const validateScript = async () => {
    setIsValidating(true)
    try {
      const response = await fetch("/api/super-admin/scripts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptName, scriptContent }),
      })
      const data = await response.json()
      setValidation(data)

      if (data.canExecute || (!data.blocked && data.environment.isProduction)) {
        setShowConfirmDialog(true)
      }
    } catch (error) {
      console.error("Validation error:", error)
    } finally {
      setIsValidating(false)
    }
  }

  const handleExecute = async () => {
    if (validation?.environment.isProduction && confirmText !== "PRODUKTIV AUSFÜHREN") {
      return
    }

    setIsExecuting(true)
    try {
      await onExecute()
      setShowConfirmDialog(false)
      setConfirmText("")
      setAcceptedRisks(false)
    } catch (error) {
      console.error("Execution error:", error)
    } finally {
      setIsExecuting(false)
    }
  }

  const isProduction = validation?.environment.isProduction
  const hasWarnings = (validation?.warnings?.length || 0) > 0

  return (
    <>
      <Button
        onClick={validateScript}
        disabled={disabled || isValidating}
        variant={isProduction ? "destructive" : "default"}
        size="sm"
      >
        {isValidating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
        Script ausführen
      </Button>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isProduction ? (
                <>
                  <ShieldAlert className="h-5 w-5 text-red-500" />
                  Produktions-Ausführung bestätigen
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5 text-blue-500" />
                  Script-Ausführung bestätigen
                </>
              )}
            </DialogTitle>
            <DialogDescription>{scriptName}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Environment Badge */}
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="text-sm">Umgebung:</span>
              <Badge variant={isProduction ? "destructive" : "secondary"}>
                {validation?.environment.environment?.toUpperCase()}
              </Badge>
            </div>

            {/* Warnings */}
            {hasWarnings && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warnungen gefunden</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 list-disc list-inside text-sm space-y-1">
                    {validation?.warnings.map((w, i) => (
                      <li key={i}>{w.description}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Already run warning */}
            {validation?.alreadyRun && (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertTitle>Bereits ausgeführt</AlertTitle>
                <AlertDescription>
                  Dieses Script wurde bereits erfolgreich ausgeführt. Eine erneute Ausführung könnte zu Fehlern führen.
                </AlertDescription>
              </Alert>
            )}

            {/* Blocked in production */}
            {validation?.blocked && (
              <Alert variant="destructive">
                <Lock className="h-4 w-4" />
                <AlertTitle>Blockiert in Produktion</AlertTitle>
                <AlertDescription>
                  Dieses Script enthält destruktive Operationen, die in der Produktionsumgebung nicht erlaubt sind.
                </AlertDescription>
              </Alert>
            )}

            {/* Production confirmation */}
            {isProduction && !validation?.blocked && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="accept-risks"
                    checked={acceptedRisks}
                    onCheckedChange={(checked) => setAcceptedRisks(checked === true)}
                  />
                  <label htmlFor="accept-risks" className="text-sm leading-tight">
                    Ich verstehe, dass diese Änderung die Produktionsdatenbank betrifft und nicht rückgängig gemacht
                    werden kann.
                  </label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-text" className="text-sm font-medium">
                    Geben Sie <code className="bg-red-100 text-red-700 px-1 rounded">PRODUKTIV AUSFÜHREN</code> ein:
                  </Label>
                  <Input
                    id="confirm-text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="PRODUKTIV AUSFÜHREN"
                    className="font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleExecute}
              disabled={
                validation?.blocked ||
                isExecuting ||
                (isProduction && (confirmText !== "PRODUKTIV AUSFÜHREN" || !acceptedRisks))
              }
              variant={isProduction ? "destructive" : "default"}
            >
              {isExecuting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : isProduction ? (
                <ShieldAlert className="h-4 w-4 mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isProduction ? "Produktiv ausführen" : "Ausführen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
