"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Mic, MicOff, Pause, Play, Copy, Check, Clock, Sparkles, Upload, FileAudio, Loader2 } from "lucide-react"

export default function ProtocolPopupPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [transcript, setTranscript] = useState("")
  const [liveTranscript, setLiveTranscript] = useState("")
  const [isTranscribingLive, setIsTranscribingLive] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [copied, setCopied] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const allAudioChunksRef = useRef<Blob[]>([])
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const transcriptionIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (transcriptionIntervalRef.current) clearInterval(transcriptionIntervalRef.current)
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [liveTranscript, transcript])

  const transcribeLiveChunks = async () => {
    if (audioChunksRef.current.length === 0 || isPaused) {
      if (audioChunksRef.current.length === 0) {
      }
      return
    }

    const chunksToTranscribe = [...audioChunksRef.current]
    audioChunksRef.current = []

    try {
      setIsTranscribingLive(true)
      const audioBlob = new Blob(chunksToTranscribe, { type: "audio/webm" })

      if (audioBlob.size < 1000) {
        return
      }

      const formData = new FormData()
      formData.append("audio", audioBlob, "chunk.webm")
      formData.append("language", "de")

      const response = await fetch("/api/protocols/transcribe", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        if (data.text && data.text.trim()) {
          setLiveTranscript((prev) => {
            const newText = prev ? `${prev} ${data.text}` : data.text
            return newText
          })
        }
      } else {
        const error = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] Popup: Transcription API error:", response.status, error)
      }
    } catch (err) {
      console.error("[v0] Popup: Live transcription error:", err)
    } finally {
      setIsTranscribingLive(false)
    }
  }

  const startRecording = async () => {
    try {

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Ihr Browser unterstuetzt keine Audio-Aufnahme. Bitte verwenden Sie die Datei-Upload-Option.")
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      setAudioStream(stream)

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4"

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      allAudioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
          allAudioChunksRef.current.push(event.data)
        } else {
        }
      }

      mediaRecorder.start(1000)

      setIsRecording(true)
      setIsPaused(false)
      setTranscript("")
      setLiveTranscript("")

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
    } catch (error) {
      console.error("[v0] Popup: Error starting recording:", error)
      let errorMessage = "Mikrofon-Zugriff wurde verweigert"
      if (error instanceof Error) {
        console.error("[v0] Popup: Error name:", error.name, "message:", error.message)
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          errorMessage = "Mikrofon-Zugriff wurde verweigert. Bitte erlauben Sie den Zugriff in den Browser-Einstellungen und laden Sie die Seite neu."
        } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
          errorMessage = "Kein Mikrofon gefunden. Bitte schließen Sie ein Mikrofon an."
        } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
          errorMessage = "Mikrofon wird bereits verwendet oder ist nicht verfügbar."
        } else if (error.name === "AbortError") {
          errorMessage = "Aufnahme wurde abgebrochen."
        } else {
          errorMessage = `Mikrofon-Fehler: ${error.message}`
        }
      }
      toast({
        title: "Fehler",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsPaused(true)
    toast({
      title: "Aufnahme pausiert",
      description: "Klicken Sie auf Fortsetzen, um weiterzumachen",
    })
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume()
    }
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1)
    }, 1000)
    setIsPaused(false)
    toast({
      title: "Aufnahme fortgesetzt",
    })
  }

  const stopRecording = async () => {

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (transcriptionIntervalRef.current) {
      clearInterval(transcriptionIntervalRef.current)
      transcriptionIntervalRef.current = null
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
    setIsPaused(false)

    if (liveTranscript.trim()) {
      setTranscript(liveTranscript)

      // Send to parent window
      if (window.opener) {
        window.opener.postMessage(
          {
            type: "TRANSCRIPT_UPDATE",
            transcript: liveTranscript,
            duration,
          },
          window.location.origin,
        )
      }

      toast({
        title: "Aufnahme beendet",
        description: "Transkription aus Live-Daten übernommen",
      })
    } else if (allAudioChunksRef.current.length > 0) {
      await transcribeAudio()
    } else {
      toast({
        title: "Keine Aufnahme",
        description: "Es wurde keine Audio-Daten aufgenommen",
        variant: "destructive",
      })
    }
  }

  const transcribeAudio = async () => {
    setIsProcessing(true)

    try {
      const audioBlob = new Blob(allAudioChunksRef.current, { type: "audio/webm" })

      if (audioBlob.size === 0) {
        throw new Error("Audio recording is empty")
      }

      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.webm")
      formData.append("language", "de")

      const response = await fetch("/api/protocols/transcribe", {
        method: "POST",
        body: formData,
      })

      const contentType = response.headers.get("content-type")

      if (!response.ok) {
        let errorMessage = "Transcription failed"

        if (contentType?.includes("application/json")) {
          const errorData = await response.json()
          console.error("[v0] Popup: Transcription API error:", response.status, errorData)
          errorMessage = errorData.details || errorData.error || `HTTP ${response.status}`
        } else {
          const errorText = await response.text()
          console.error("[v0] Popup: Transcription API non-JSON error:", errorText.substring(0, 200))
          errorMessage = `Server error (${response.status})`
        }

        throw new Error(errorMessage)
      }

      if (!contentType?.includes("application/json")) {
        const text = await response.text()
        console.error("[v0] Popup: Expected JSON response but got:", text.substring(0, 200))
        throw new Error("Invalid response format from transcription API")
      }

      const data = await response.json()

      if (data.text) {
        setTranscript(data.text)

        if (window.opener) {
          window.opener.postMessage(
            {
              type: "TRANSCRIPT_UPDATE",
              transcript: data.text,
              duration,
            },
            window.location.origin,
          )
        }

        toast({
          title: "Transkription abgeschlossen",
          description: "Das Protokoll wurde erfolgreich erstellt",
        })
      } else {
        console.error("[v0] Popup: No text in response:", data)
        throw new Error("No transcript text received from API")
      }
    } catch (error) {
      console.error("[v0] Popup: Error transcribing audio:", error)
      toast({
        title: "Fehler bei der Transkription",
        description: error instanceof Error ? error.message : "Bitte versuchen Sie es erneut",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file)
    setIsUploading(true)
    setTranscript("")

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

      if (data.text) {
        setTranscript(data.text)

        if (window.opener) {
          window.opener.postMessage(
            { type: "TRANSCRIPT_UPDATE", transcript: data.text, duration: 0 },
            window.location.origin,
          )
        }

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
      setIsUploading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const copyTranscript = async () => {
    const textToCopy = transcript || liveTranscript
    if (textToCopy) {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Kopiert",
        description: "Transkription wurde in die Zwischenablage kopiert",
      })
    }
  }

  const displayTranscript = transcript || liveTranscript

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-xl mx-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Meeting-Aufnahme</CardTitle>
            {isRecording && (
              <Badge variant={isPaused ? "secondary" : "destructive"} className="animate-pulse">
                {isPaused ? "Pausiert" : "Aufnahme laeuft"}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Tabs defaultValue="record" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="record" className="gap-2" disabled={isUploading}>
                <Mic className="h-4 w-4" />
                Live-Aufnahme
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-2" disabled={isRecording}>
                <Upload className="h-4 w-4" />
                Datei hochladen
              </TabsTrigger>
            </TabsList>

            {/* Live Recording Tab */}
            <TabsContent value="record" className="space-y-4 mt-4">
              {/* Timer */}
              <div className="flex items-center justify-center py-6">
                <div className="text-center">
                  <div className="text-5xl font-mono font-bold tracking-tight">{formatDuration(duration)}</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {isRecording && !isPaused && (
                      <div className="flex items-center justify-center gap-2">
                        <span>Aufnahme laeuft</span>
                        {isTranscribingLive && (
                          <div className="flex items-center gap-1 text-blue-500">
                            <Sparkles className="h-3 w-3 animate-pulse" />
                            <span className="text-xs">Transkribiert...</span>
                          </div>
                        )}
                      </div>
                    )}
                    {isPaused && "Pausiert"}
                    {!isRecording && duration > 0 && "Aufnahme beendet"}
                  </div>
                </div>
              </div>

              {/* Audio Visualizer */}
              {isRecording && audioStream && (
                <div className="h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  <AudioVisualizer stream={audioStream} isActive={!isPaused} />
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center justify-center gap-3">
                {!isRecording ? (
                  <Button onClick={startRecording} size="lg" className="gap-2">
                    <Mic className="h-5 w-5" />
                    Aufnahme starten
                  </Button>
                ) : (
                  <>
                    {isPaused ? (
                      <Button onClick={resumeRecording} variant="outline" size="lg" className="gap-2 bg-transparent">
                        <Play className="h-5 w-5" />
                        Fortsetzen
                      </Button>
                    ) : (
                      <Button onClick={pauseRecording} variant="outline" size="lg" className="gap-2 bg-transparent">
                        <Pause className="h-5 w-5" />
                        Pausieren
                      </Button>
                    )}
                    <Button
                      onClick={stopRecording}
                      variant="destructive"
                      size="lg"
                      className="gap-2"
                      disabled={isProcessing}
                    >
                      <MicOff className="h-5 w-5" />
                      Beenden
                    </Button>
                  </>
                )}
              </div>

              {/* Live Transcription Display */}
              {isRecording && liveTranscript && (
                <div className="border rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2 mb-2 text-xs text-blue-600 dark:text-blue-400">
                    <Sparkles className="h-3 w-3" />
                    <span className="font-medium">Live-Transkription</span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">{liveTranscript}</p>
                </div>
              )}

              {/* Processing indicator */}
              {isProcessing && (
                <div className="border rounded-lg p-6 bg-muted/50">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-pulse" />
                      </div>
                      <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-ping" />
                    </div>
                    <p className="text-blue-600 dark:text-blue-400 font-medium">KI analysiert Ihre Aufnahme...</p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* File Upload Tab */}
            <TabsContent value="upload" className="space-y-4 mt-4">
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

              {!uploadedFile && !isUploading ? (
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const file = e.dataTransfer.files[0]
                    if (file) handleFileUpload(file)
                  }}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Audio- oder Videodatei hochladen</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        MP3, WAV, M4A, OGG, WebM, MP4, FLAC (max. 25 MB)
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <FileAudio className="h-4 w-4" />
                      Datei auswählen
                    </Button>
                  </div>
                </div>
              ) : isUploading ? (
                <div className="border rounded-lg p-8 bg-muted/50">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <div className="text-center">
                      <p className="font-medium">Transkribiere...</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {uploadedFile?.name} ({(uploadedFile?.size ?? 0 / 1024 / 1024).toFixed(1)} MB)
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <FileAudio className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{uploadedFile?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {((uploadedFile?.size ?? 0) / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUploadedFile(null)
                        setTranscript("")
                        if (fileInputRef.current) fileInputRef.current.value = ""
                      }}
                    >
                      Andere Datei
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Final Transcript - shown for both tabs */}
          {transcript && !isRecording && !isUploading && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Check className="h-4 w-4 text-green-500" />
                  Transkription
                </div>
                <Button variant="ghost" size="sm" onClick={copyTranscript} className="gap-1">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Kopiert" : "Kopieren"}
                </Button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {duration > 0 && <><span>Dauer: {formatDuration(duration)}</span><span>-</span></>}
                  <span>{transcript.split(/\s+/).length} Woerter</span>
                </div>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/50 to-transparent rounded-full" />
                  <div className="pl-4 max-h-60 overflow-y-auto">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{transcript}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={transcriptEndRef} />
        </CardContent>
      </Card>
    </div>
  )
}

// Simple audio visualizer component
function AudioVisualizer({ stream, isActive }: { stream: MediaStream; isActive: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const analyserRef = useRef<AnalyserNode>()

  useEffect(() => {
    if (!stream || !canvasRef.current) return

    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)
    analyser.fftSize = 256
    analyserRef.current = analyser

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      if (!isActive) {
        animationRef.current = requestAnimationFrame(draw)
        return
      }

      analyser.getByteFrequencyData(dataArray)

      ctx.fillStyle = "transparent"
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const barWidth = (canvas.width / bufferLength) * 2.5
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight)
        gradient.addColorStop(0, "hsl(var(--primary))")
        gradient.addColorStop(1, "hsl(var(--primary) / 0.3)")

        ctx.fillStyle = gradient
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

        x += barWidth + 1
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      audioContext.close()
    }
  }, [stream, isActive])

  return <canvas ref={canvasRef} width={400} height={60} className="w-full h-full" />
}
