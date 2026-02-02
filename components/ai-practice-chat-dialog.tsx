"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Send, Loader2, Sparkles, ImageIcon, X } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useAIDisclaimer } from "@/hooks/use-ai-disclaimer"
import { AIDisclaimerDialog } from "@/components/ai-disclaimer-dialog"
import { useAiEnabled } from "@/lib/hooks/use-ai-enabled"
import { FormattedAIContent } from "@/components/formatted-ai-content"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  imageUrl?: string
}

interface AIPracticeChatDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  initialMessage?: string
}

export function AIPracticeChatDialog({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  initialMessage,
}: AIPracticeChatDialogProps = {}) {
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()
  const { toast } = useToast()
  const { isAccepted, isLoading: disclaimerLoading, acceptDisclaimer } = useAIDisclaimer()
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  const { isAiEnabled, isLoading: aiEnabledLoading } = useAiEnabled()

  const [internalOpen, setInternalOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ url: string; file: File } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? setControlledOpen : setInternalOpen

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !aiEnabledLoading && !isAiEnabled) {
      toast({
        title: "KI-Funktionen deaktiviert",
        description:
          "KI-Funktionen sind für diese Praxis derzeit deaktiviert. Bitte kontaktieren Sie Ihren Administrator.",
        variant: "default",
      })
      return
    }

    if (newOpen && !disclaimerLoading) {
      if (!isAccepted) {
        setShowDisclaimer(true)
        return
      }
    }
    setOpen?.(newOpen)
  }

  const handleAcceptDisclaimer = async () => {
    const success = await acceptDisclaimer()
    if (success) {
      setShowDisclaimer(false)
      setOpen?.(true)
    }
  }

  const handleDeclineDisclaimer = () => {
    setShowDisclaimer(false)
    toast({
      title: "KI-Funktionen nicht verfügbar",
      description: "Sie müssen den Haftungsausschluss akzeptieren, um KI-Funktionen zu nutzen.",
      variant: "default",
    })
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!open) return

      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          e.preventDefault()
          const file = items[i].getAsFile()
          if (file) {
            await handleImageSelect(file)
          }
          break
        }
      }
    }

    document.addEventListener("paste", handlePaste)
    return () => document.removeEventListener("paste", handlePaste)
  }, [open])

  useEffect(() => {
    if (open && initialMessage) {
      setInput(initialMessage)
    }
  }, [open, initialMessage])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find((file) => file.type.startsWith("image/"))

    if (imageFile) {
      await handleImageSelect(imageFile)
    } else if (files.length > 0) {
      toast({
        title: "Ungültiger Dateityp",
        description: "Bitte wählen Sie eine Bilddatei.",
        variant: "destructive",
      })
    }
  }

  const handleImageSelect = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Datei zu groß",
        description: "Bilder dürfen maximal 10MB groß sein.",
        variant: "destructive",
      })
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setSelectedImage({ url: previewUrl, file })
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true)
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "chatImage")

      const response = await fetch("/api/upload/unified", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload fehlgeschlagen")
      }

      const data = await response.json()
      return data.url
    } catch (error) {
      console.error("[v0] Image upload error:", error)
      toast({
        title: "Bild-Upload fehlgeschlagen",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      })
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if ((!input.trim() && !selectedImage) || loading) return

    const practiceId = currentPractice?.id

    if (!practiceId) {
      toast({
        title: "Keine Praxis ausgewählt",
        description: "Bitte wählen Sie eine Praxis aus.",
        variant: "destructive",
      })
      return
    }

    let imageUrl: string | undefined
    if (selectedImage) {
      imageUrl = (await uploadImage(selectedImage.file)) || undefined
      if (!imageUrl) {
        return
      }
      URL.revokeObjectURL(selectedImage.url)
    }

    const userMessage: Message = {
      role: "user",
      content: input.trim() || "(Bild gesendet)",
      timestamp: new Date(),
      imageUrl,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setSelectedImage(null)
    setLoading(true)

    try {
      console.log("[v0] AI Chat - Sending request with:", {
        practiceId,
        messageLength: userMessage.content.length,
        historyLength: messages.length,
        hasImage: !!imageUrl,
      })

      const response = await fetch("/api/ai-analysis/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practiceId,
          userId: currentUser?.id, // Include userId in request body for preview environment authentication
          message: userMessage.content,
          history: messages.slice(-5),
          imageUrl,
        }),
      })

      console.log("[v0] AI Chat - Response status:", response.status)
      console.log("[v0] AI Chat - Response ok:", response.ok)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] AI Chat - Error response:", errorData)

        const errorMessage: Message = {
          role: "assistant",
          content: `❌ Fehler: ${errorData.error || `HTTP ${response.status}: ${response.statusText}`}\n\n${errorData.suggestion || "Bitte versuchen Sie es später erneut oder kontaktieren Sie den Support."}`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
        return
      }

      const data = await response.json()
      console.log("[v0] AI Chat - Response data received:", {
        hasResponse: !!data.response,
        responseLength: data.response?.length || 0,
      })

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      console.log("[v0] AI Chat - Message added successfully")
    } catch (error) {
      console.error("[v0] AI Chat - Error caught:", error)
      const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler"
      toast({
        title: "Fehler",
        description: `Die Nachricht konnte nicht gesendet werden: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <AIDisclaimerDialog open={showDisclaimer} onAccept={handleAcceptDisclaimer} onDecline={handleDeclineDisclaimer} />

      <Dialog open={open} onOpenChange={handleOpenChange}>
        {!isControlled && (
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-500/90 to-indigo-500/90 text-white shadow-md hover:shadow-lg transition-all border-0">
              <MessageSquare className="h-4 w-4 mr-2" />
              Frag die KI
            </Button>
          </DialogTrigger>
        )}
        <DialogContent
          className="max-w-3xl h-[700px] flex flex-col p-0 gap-0 overflow-hidden"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-background">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Frag die KI über Ihre Praxis
            </DialogTitle>
            <DialogDescription>
              Stellen Sie Fragen zu Ihrer Praxisleistung, KPIs, Team oder Workflows. Die KI hat Zugriff auf alle Ihre
              Praxisdaten.
              {typeof window !== "undefined" && window.location.hostname.includes("v0.app") && (
                <span className="block mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                  ⚠️ Hinweis: KI-Chat funktioniert nur in der Produktionsumgebung. In der Vorschau ist dieser Service
                  nicht verfügbar.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {isDragging && (
            <div className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-sm flex items-center justify-center rounded-lg border-2 border-dashed border-primary">
              <div className="text-center space-y-2">
                <ImageIcon className="h-12 w-12 mx-auto text-primary" />
                <p className="text-sm font-medium">Bild hier ablegen</p>
              </div>
            </div>
          )}

          <ScrollArea className="flex-1 px-6" ref={scrollRef}>
            <div className="space-y-4 py-4">
              {messages.length === 0 ? (
                <div className="text-center py-8 space-y-6">
                  <Sparkles className="h-12 w-12 mx-auto text-purple-500/50" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Willkommen beim KI-Assistenten</p>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Stellen Sie beliebige Fragen zu Ihrer Praxis. Sie können auch Bilder per Drag & Drop oder Strg+V
                      einfügen.
                    </p>
                  </div>
                  <div className="space-y-3 max-w-lg mx-auto">
                    <p className="text-xs text-muted-foreground font-medium">Beispielfragen:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "Wie ist die aktuelle Team-Performance?",
                        "Welche Ziele sollten priorisiert werden?",
                        "Gibt es Optimierungspotenzial bei den Workflows?",
                        "Wie steht es um die Patienten-Zufriedenheit?",
                      ].map((question) => (
                        <button
                          key={question}
                          type="button"
                          onClick={() => {
                            setInput(question)
                            setTimeout(() => {
                              formRef.current?.requestSubmit()
                            }, 100)
                          }}
                          className="flex items-start gap-2 p-3 text-left text-xs rounded-lg border border-border hover:bg-muted/50 hover:border-primary/30 transition-colors"
                        >
                          <span className="text-muted-foreground mt-0.5">•</span>
                          <span>{question}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn("flex gap-3 p-4 rounded-lg", message.role === "user" ? "bg-primary/10" : "bg-muted")}
                  >
                    <div className="flex-shrink-0">
                      {message.role === "user" ? (
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                          {currentUser?.name?.charAt(0) || "U"}
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {message.role === "user" ? currentUser?.name || "Sie" : "KI-Assistent"}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString("de-DE", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {message.imageUrl && (
                        <img
                          src={message.imageUrl || "/placeholder.svg"}
                          alt="Angehängtes Bild"
                          className="max-w-sm rounded-lg border"
                        />
                      )}
                      {message.role === "assistant" ? (
                        <div className="p-4 bg-background dark:bg-slate-900 border border-border rounded-lg">
                          <div className="text-foreground dark:text-slate-100">
                            <FormattedAIContent content={message.content} />
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-primary-foreground whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex gap-3 p-4 rounded-lg bg-muted">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white animate-pulse" />
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Die KI denkt nach...</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {selectedImage && (
            <div className="relative border rounded-lg p-2 bg-muted/50 mx-6">
              <div className="flex items-center gap-2">
                <img
                  src={selectedImage.url || "/placeholder.svg"}
                  alt="Vorschau"
                  className="h-20 w-20 object-cover rounded"
                />
                <div className="flex-1 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Bild ausgewählt</p>
                  <p>Bereit zum Senden</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    URL.revokeObjectURL(selectedImage.url)
                    setSelectedImage(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} className="flex gap-2 p-6 border-t bg-background">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImageSelect(file)
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={loading || uploadingImage}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
            </Button>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Stellen Sie eine Frage oder fügen Sie ein Bild ein (Strg+V)..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || (!input.trim() && !selectedImage)} size="icon">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default AIPracticeChatDialog
