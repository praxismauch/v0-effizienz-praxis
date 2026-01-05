"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface AIAnalysisDialogProps {
  practiceId: string
}

export function AIAnalysisDialog({ practiceId }: AIAnalysisDialogProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  const handleAnalyze = async () => {
    if (!user) {
      toast({
        title: "Fehler",
        description: "Bitte melden Sie sich erneut an",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch("/api/ai-analysis/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ practiceId, userId: user.id }),
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Analyse fehlgeschlagen")
      }

      const data = await response.json()
      setAnalysis(data.analysis)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ein Fehler ist aufgetreten"
      setError(errorMessage)
      toast({
        title: "Fehler",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div>
      <button onClick={handleAnalyze} disabled={isAnalyzing}>
        Analyse starten
      </button>
      {error && <p>{error}</p>}
      {analysis && <div>{analysis}</div>}
    </div>
  )
}

export default AIAnalysisDialog
