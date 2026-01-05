"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Mic, MicOff, Loader2, Sparkles, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface VoiceCommand {
  command: string
  action: string
  parameters?: Record<string, any>
}

export function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [response, setResponse] = useState("")
  const [isSpeechSupported, setIsSpeechSupported] = useState(true)
  const [supportError, setSupportError] = useState("")
  const recognitionRef = useRef<any>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isSecureContext = window.isSecureContext || window.location.hostname === "localhost"

      if (!isSecureContext) {
        setIsSpeechSupported(false)
        setSupportError("Die Spracherkennung funktioniert nur über HTTPS. Bitte verwenden Sie eine sichere Verbindung.")
        return
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (!SpeechRecognition) {
        setIsSpeechSupported(false)
        setSupportError(
          "Ihr Browser unterstützt die Web Speech API nicht. Bitte verwenden Sie Chrome, Edge oder Safari.",
        )
        return
      }

      try {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = "de-DE"

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = ""
          let interimTranscript = ""

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPart = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcriptPart
            } else {
              interimTranscript += transcriptPart
            }
          }

          setTranscript(finalTranscript || interimTranscript)

          if (finalTranscript) {
            processVoiceCommand(finalTranscript)
          }
        }

        recognitionRef.current.onerror = (event: any) => {
          if (event.error === "no-speech") {
            return
          }

          if (event.error === "not-allowed" || event.error === "permission-denied") {
            toast({
              title: "Berechtigung erforderlich",
              description: "Bitte erlauben Sie den Zugriff auf Ihr Mikrofon in den Browser-Einstellungen.",
              variant: "destructive",
            })
          } else if (event.error === "network") {
            toast({
              title: "Netzwerkfehler",
              description: "Bitte überprüfen Sie Ihre Internetverbindung.",
              variant: "destructive",
            })
          } else if (event.error === "aborted") {
            return
          }

          setIsListening(false)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }

        setIsSpeechSupported(true)
        setSupportError("")
      } catch (error) {
        setIsSpeechSupported(false)
        setSupportError("Fehler beim Initialisieren der Spracherkennung.")
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
          recognitionRef.current.onresult = null
          recognitionRef.current.onerror = null
          recognitionRef.current.onend = null
          recognitionRef.current = null
        } catch (error) {
          console.error("[v0] Error cleaning up speech recognition:", error)
        }
      }
    }
  }, [])

  const startListening = () => {
    if (!isSpeechSupported) {
      toast({
        title: "Nicht unterstützt",
        description: supportError,
        variant: "destructive",
      })
      return
    }

    if (recognitionRef.current) {
      setTranscript("")
      setResponse("")
      try {
        setIsListening(true)
        recognitionRef.current.start()
      } catch (error) {
        console.error("[v0] Error starting recognition:", error)
        setIsListening(false)
        toast({
          title: "Fehler",
          description: "Spracherkennung konnte nicht gestartet werden.",
          variant: "destructive",
        })
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }

  const processVoiceCommand = async (command: string) => {
    setIsProcessing(true)
    stopListening()

    try {
      const response = await fetch("/api/voice-assistant/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      })

      if (!response.ok) {
        throw new Error("Failed to process command")
      }

      const data: VoiceCommand = await response.json()

      setResponse(`Verstanden: ${data.action}`)

      await executeAction(data)

      setTimeout(() => {
        setIsOpen(false)
        setTranscript("")
        setResponse("")
      }, 2000)
    } catch (error) {
      console.error("[v0] Error processing voice command:", error)
      setResponse("Entschuldigung, ich konnte den Befehl nicht verarbeiten.")
      toast({
        title: "Fehler",
        description: "Der Sprachbefehl konnte nicht verarbeitet werden.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const executeAction = async (command: VoiceCommand) => {
    const { action, parameters } = command

    switch (action) {
      case "navigate":
        if (parameters?.route) {
          router.push(parameters.route)
          toast({ title: "Navigation", description: `Öffne ${parameters.label || parameters.route}` })
        }
        break

      case "create_todo":
        router.push("/todos")
        toast({ title: "Aufgabe erstellen", description: "Öffne Aufgaben-Seite" })
        break

      case "create_team_member":
        router.push("/team")
        toast({ title: "Team-Mitglied hinzufügen", description: "Öffne Team-Seite" })
        break

      case "view_analytics":
        router.push("/analytics")
        toast({ title: "Analytics", description: "Zeige Kennzahlen" })
        break

      case "open_documents":
        router.push("/documents")
        toast({ title: "Dokumente", description: "Öffne Dokumente" })
        break

      case "open_calendar":
        router.push("/calendar")
        toast({ title: "Kalender", description: "Öffne Kalender" })
        break

      case "open_settings":
        router.push("/settings")
        toast({ title: "Einstellungen", description: "Öffne Einstellungen" })
        break

      case "search":
        if (parameters?.query) {
          toast({ title: "Suche", description: `Suche nach "${parameters.query}"` })
        }
        break

      default:
        toast({
          title: "Aktion nicht erkannt",
          description: "Dieser Befehl wird noch nicht unterstützt.",
        })
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-2xl hover:shadow-purple-500/50 hover:scale-110 transition-all duration-200 z-50 border-2 border-white/20"
      >
        <Mic className="h-6 w-6" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Sprach-Assistent
            </DialogTitle>
            <DialogDescription>
              Sagen Sie mir, was ich für Sie tun soll. Zum Beispiel: "Öffne Aufgaben", "Zeige Kalender", "Erstelle neue
              Aufgabe"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!isSpeechSupported && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Nicht unterstützt</AlertTitle>
                <AlertDescription className="text-sm">
                  {supportError}
                  {supportError.includes("Browser") && (
                    <div className="mt-2 text-xs">
                      <p className="font-medium mb-1">Unterstützte Browser:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>Google Chrome (Desktop & Mobile)</li>
                        <li>Microsoft Edge</li>
                        <li>Safari (Desktop & iOS)</li>
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col items-center gap-4">
              <Button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing || !isSpeechSupported}
                size="lg"
                className={`h-24 w-24 rounded-full transition-all duration-300 ${
                  isListening
                    ? "bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/50"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : isListening ? (
                  <MicOff className="h-8 w-8" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
              </Button>

              {isListening && (
                <Badge variant="destructive" className="animate-pulse">
                  Höre zu...
                </Badge>
              )}
              {isProcessing && (
                <Badge variant="secondary" className="animate-pulse">
                  Verarbeite...
                </Badge>
              )}
            </div>

            {transcript && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm font-medium mb-1">Sie sagen:</p>
                <p className="text-sm text-muted-foreground">{transcript}</p>
              </div>
            )}

            {response && (
              <div className="rounded-lg border border-purple-200 bg-purple-50 dark:bg-purple-950/20 p-4">
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">{response}</p>
              </div>
            )}

            {!transcript && !response && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs font-medium mb-2">Beispiel-Befehle:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• "Öffne Aufgaben"</li>
                  <li>• "Zeige Kalender"</li>
                  <li>• "Gehe zu Analytics"</li>
                  <li>• "Öffne Dokumente"</li>
                  <li>• "Zeige Einstellungen"</li>
                  <li>• "Erstelle neue Aufgabe"</li>
                </ul>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default VoiceAssistant
