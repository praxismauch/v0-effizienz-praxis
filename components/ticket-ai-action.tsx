"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Copy, Check, Sparkles, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TicketAIActionProps {
  ticketId: string
  title: string
  description?: string
  type: string
  priority: string
  screenshots?: string[]
  autoGenerate?: boolean
}

export function TicketAIAction({
  ticketId,
  title,
  description,
  type,
  priority,
  screenshots,
  autoGenerate = true,
}: TicketAIActionProps) {
  const [actionItem, setActionItem] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const generateActionItem = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tickets/${ticketId}/ai-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          type,
          priority,
          screenshots,
        }),
      })

      if (!response.ok) {
        throw new Error("Fehler beim Generieren")
      }

      const data = await response.json()
      setActionItem(data.actionItem)
    } catch (error) {
      console.error("[v0] Error generating action item:", error)
      toast({
        title: "Fehler",
        description: "KI-Aktion konnte nicht generiert werden",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoGenerate && ticketId) {
      generateActionItem()
    }
  }, [ticketId, autoGenerate])

  const copyToClipboard = async () => {
    if (!actionItem) return

    try {
      await navigator.clipboard.writeText(actionItem)
      setCopied(true)
      toast({
        title: "Kopiert!",
        description: "Der Text wurde in die Zwischenablage kopiert. Fügen Sie ihn in V0 Chat ein.",
      })
      setTimeout(() => setCopied(false), 3000)
    } catch (error) {
      console.error("[v0] Error copying to clipboard:", error)
      toast({
        title: "Fehler",
        description: "Text konnte nicht kopiert werden",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">KI-Entwicklungsaufgabe</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            V0 Chat
          </Badge>
        </div>
        <CardDescription>
          Automatisch generierte Aufgabe zur Lösung dieses Tickets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span className="text-muted-foreground">KI generiert Aufgabe...</span>
          </div>
        ) : actionItem ? (
          <>
            <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap font-mono border">
              {actionItem}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={copyToClipboard}
                className="flex-1"
                variant={copied ? "secondary" : "default"}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Kopiert!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    In Zwischenablage kopieren
                  </>
                )}
              </Button>
              <Button
                onClick={generateActionItem}
                variant="outline"
                size="icon"
                title="Neu generieren"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Kopieren Sie den Text und fügen Sie ihn in V0 Chat ein, um das Problem zu lösen
            </p>
          </>
        ) : (
          <div className="text-center py-4">
            <Button onClick={generateActionItem} variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              KI-Aufgabe generieren
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
