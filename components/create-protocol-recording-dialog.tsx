"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mic, ExternalLink, Info, Loader2, Sparkles, Upload, FileAudio } from "lucide-react"
import { VoiceLevelIndicator } from "@/components/voice-level-indicator"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

interface CreateProtocolRecordingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTranscriptComplete?: (transcript: string, title: string, participants: string) => void
}

export default function CreateProtocolRecordingDialog({
  open,
  onOpenChange,
  onTranscriptComplete,
}: CreateProtocolRecordingDialogProps) {
  const [meetingTitle, setMeetingTitle] = useState(() => 
    `Protokoll - ${format(new Date(), "dd.MM.yyyy - HH:mm", { locale: de })}`
  )
  const [participants, setParticipants] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [liveTranscript, setLiveTranscript] = useState("")
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const allAudioChunksRef = useRef<Blob[]>([])
  const isUnmountingRef = useRef(false)
  const transcriptionIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      isUnmountingRef.current = true
      if (timerRef.current) clearInterval(timerRef.current)
      if (transcriptionIntervalRef.current) clearInterval(transcriptionIntervalRef.current)
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const openRecordingPopup = () => {
    const width = 600
    const height = 700
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2

    const popup = window.open(
      "/protocols/popup",
      "ProtocolRecording",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    )

    if (popup) {
      onOpenChange(false)

      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return
        if (event.data.type === "TRANSCRIPT_UPDATE") {
          if (event.data.transcript && onTranscriptComplete) {
            onTranscriptComplete(
              event.data.transcript,
              meetingTitle || `Protokoll vom ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: de })}`,
              participants,
            )
          }
          window.removeEventListener("message", handleMessage)
        }
      }
      window.addEventListener("message", handleMessage)

      const checkPopupClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopupClosed)
          window.removeEventListener("message", handleMessage)
        }
      }, 1000)
    } else {
      toast({
        title: "Popup blockiert",
        description: "Bitte erlauben Sie Popups für diese Seite",
        variant: "destructive",
      })
    }
  }

  const transcribeLiveChunks = async () => {
    if (audioChunksRef.current.length === 0) {
      console.log("[v0] No new audio chunks to transcribe, skipping this interval")
      return
    }

    const chunksToTranscribe = [...audioChunksRef.current]
    audioChunksRef.current = [] // Clear for next batch

    try {
      setIsTranscribing(true)
      const audioBlob = new Blob(chunksToTranscribe, { type: "audio/webm" })

      if (audioBlob.size < 1000) {
        console.log("[v0] Audio blob too small:", audioBlob.size, "bytes, skipping")
        return // Skip very small chunks
      }

      console.log("[v0] Transcribing audio chunk:", audioBlob.size, "bytes")

      const formData = new FormData()
      formData.append("audio", audioBlob, "chunk.webm")
      formData.append("language", "de")

      const response = await fetch("/api/protocols/transcribe", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Transcription response received:", data.text?.substring(0, 50))
        if (data.text && data.text.trim()) {
          setLiveTranscript((prev) => {
            const newText = prev ? `${prev} ${data.text}` : data.text
            console.log("[v0] Updated live transcript, length:", newText.length)
            return newText
          })
        }
      } else {
        const error = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] Transcription API error:", response.status, error)
      }
    } catch (err) {
      console.error("[v0] Live transcription error:", err)
    } finally {
      setIsTranscribing(false)
    }
  }

  const startRecording = async () => {
    console.log("[v0] Dialog: Starting recording...")
    setIsStarting(true)
    setError(null)
    setLiveTranscript("")
    isUnmountingRef.current = false

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Ihr Browser unterstützt keine Audio-Aufnahme")
      }

      console.log("[v0] Dialog: Requesting microphone access...")
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log("[v0] Dialog: Microphone access granted")

      setAudioStream(stream)

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4"

      console.log("[v0] Dialog: Using mime type:", mimeType)

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      allAudioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log("[v0] Audio chunk received:", event.data.size, "bytes, type:", event.data.type)
          audioChunksRef.current.push(event.data)
          allAudioChunksRef.current.push(event.data)
        } else {
          console.log("[v0] Empty audio chunk received (silence or no input)")
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error("[v0] Dialog: MediaRecorder error:", event)
        setError("Aufnahme-Fehler aufgetreten")
      }

      mediaRecorder.start(1000)
      console.log("[v0] Dialog: MediaRecorder started, state:", mediaRecorder.state)

      await new Promise((resolve) => setTimeout(resolve, 100))

      if (isUnmountingRef.current) {
        console.log("[v0] Dialog: Component unmounting, stopping recorder")
        mediaRecorder.stop()
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      setIsRecording(true)
      setIsStarting(false)

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)

      transcriptionIntervalRef.current = setInterval(() => {
        transcribeLiveChunks()
      }, 5000)

      toast({
        title: "Aufnahme gestartet",
        description: "Live-Transkription aktiv. Sprechen Sie jetzt.",
      })
    } catch (err) {
      console.error("[v0] Dialog: Error starting recording:", err)
      setIsStarting(false)

      let errorMessage = "Fehler beim Starten der Aufnahme"

      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          errorMessage =
            "Mikrofon-Zugriff wurde verweigert. Bitte erlauben Sie den Zugriff in Ihren Browser-Einstellungen."
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          errorMessage = "Kein Mikrofon gefunden. Bitte schließen Sie ein Mikrofon an."
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          errorMessage = "Mikrofon wird bereits verwendet oder ist nicht verfügbar."
        } else {
          errorMessage = err.message
        }
      }

      setError(errorMessage)
      toast({
        title: "Fehler",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const stopRecording = async () => {
    console.log("[v0] Dialog: Stopping recording...")

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    if (transcriptionIntervalRef.current) {
      clearInterval(transcriptionIntervalRef.current)
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      await new Promise<void>((resolve) => {
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.onstop = () => resolve()
          mediaRecorderRef.current.stop()
        } else {
          resolve()
        }
      })

      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      }
    }

    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop())
      setAudioStream(null)
    }

    setIsRecording(false)

    if (liveTranscript.trim()) {
      // We already have live transcript, use it
      if (onTranscriptComplete) {
        onTranscriptComplete(
          liveTranscript,
          meetingTitle || `Protokoll vom ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: de })}`,
          participants,
        )
      }
      onOpenChange(false)
    } else if (allAudioChunksRef.current.length > 0) {
      // Fallback to full transcription
      await transcribeAudio()
    }
  }

  const transcribeAudio = async () => {
    try {
      console.log("[v0] Dialog: Transcribing full audio...")
      setIsTranscribing(true)
      const audioBlob = new Blob(allAudioChunksRef.current, { type: "audio/webm" })
      console.log("[v0] Dialog: Audio blob size:", audioBlob.size, "bytes")

      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.webm")
      formData.append("language", "de")

      const response = await fetch("/api/protocols/transcribe", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Dialog: Transcription complete:", data.text?.substring(0, 100))

        if (data.text && onTranscriptComplete) {
          onTranscriptComplete(
            data.text,
            meetingTitle || `Protokoll vom ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: de })}`,
            participants,
          )
        }
        onOpenChange(false)
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] Dialog: Transcription failed:", errorData)
        toast({
          title: "Transkription fehlgeschlagen",
          description: errorData.error || "Bitte versuchen Sie es erneut",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("[v0] Dialog: Error transcribing audio:", err)
      toast({
        title: "Fehler",
        description: "Transkription fehlgeschlagen. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      })
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    setIsUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append("audio", file, file.name)
      formData.append("language", "de")

      const response = await fetch("/api/protocols/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `Transkription fehlgeschlagen (${response.status})`)
      }

      const data = await response.json()

      if (data.text && onTranscriptComplete) {
        onTranscriptComplete(
          data.text,
          meetingTitle || `Protokoll vom ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: de })}`,
          participants,
        )
        onOpenChange(false)
        toast({
          title: "Transkription abgeschlossen",
          description: `${data.text.split(/\s+/).length} Woerter erkannt`,
        })
      } else {
        throw new Error("Keine Transkription erhalten")
      }
    } catch (error) {
      console.error("[v0] File upload transcription error:", error)
      toast({
        title: "Fehler bei der Transkription",
        description: error instanceof Error ? error.message : "Bitte versuchen Sie es erneut",
        variant: "destructive",
      })
    } finally {
      setIsUploadingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleClose = () => {
    if (isRecording) {
      stopRecording()
    }
    onOpenChange(false)
    setMeetingTitle(`Protokoll - ${format(new Date(), "dd.MM.yyyy - HH:mm", { locale: de })}`)
    setParticipants("")
    setDuration(0)
    setError(null)
    setLiveTranscript("")
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neues Gesprächsprotokoll</DialogTitle>
          <DialogDescription>Starten Sie eine Aufnahme für Ihr Meeting oder Gespräch</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="ml-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Im Popup-Fenster aufnehmen</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Öffnen Sie die Aufnahme in einem separaten Fenster, um parallel in der App zu arbeiten
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openRecordingPopup}
                  className="shrink-0 border-blue-300 hover:bg-blue-100 dark:border-blue-700 dark:hover:bg-blue-900 bg-transparent"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Popup öffnen
                </Button>
              </div>
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* File Upload Option */}
          {!isRecording && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Upload className="h-4 w-4" />
                Audiodatei hochladen
              </div>
              <p className="text-xs text-muted-foreground">
                Laden Sie eine vorhandene Audio- oder Videodatei zur Transkription hoch (MP3, WAV, M4A, WebM, MP4 - max. 25 MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,video/*,.mp3,.wav,.m4a,.ogg,.webm,.mp4,.flac"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                }}
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingFile}
              >
                {isUploadingFile ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Transkribiere...
                  </>
                ) : (
                  <>
                    <FileAudio className="h-4 w-4" />
                    Datei auswählen
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="meeting-title">Meeting-Titel (optional)</Label>
            <Input
              id="meeting-title"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              placeholder="z.B. Team-Besprechung, Patientengespräch"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="participants">Teilnehmer (optional)</Label>
            <Input
              id="participants"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder="Namen durch Komma trennen"
            />
          </div>

          {isRecording && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-medium">Aufnahme läuft</span>
                  {isTranscribing && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Sparkles className="h-3 w-3 animate-pulse text-blue-500" />
                      <span>Transkribiert...</span>
                    </div>
                  )}
                </div>
                <span className="font-mono text-lg font-bold">{formatDuration(duration)}</span>
              </div>
              <div className="flex justify-center">
                <VoiceLevelIndicator stream={audioStream} isActive={isRecording} />
              </div>

              {liveTranscript && (
                <div className="mt-4 p-3 bg-background rounded-md border max-h-40 overflow-y-auto">
                  <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3 text-blue-500" />
                    <span>Live-Transkription</span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{liveTranscript}</p>
                </div>
              )}

              {!liveTranscript && duration > 5 && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Warte auf erste Transkription...</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Abbrechen
          </Button>
          {!isRecording ? (
            <Button onClick={startRecording} disabled={isStarting}>
              {isStarting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mikrofon wird aktiviert...
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Aufnahme starten
                </>
              )}
            </Button>
          ) : (
            <Button onClick={stopRecording} variant="destructive" disabled={isTranscribing}>
              {isTranscribing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transkribiert...
                </>
              ) : (
                "Aufnahme beenden"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { CreateProtocolRecordingDialog }
