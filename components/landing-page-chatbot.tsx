"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Send, Loader2, User, Upload, ImageIcon, Sparkles } from "lucide-react"
import { useChat } from "ai/react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export function LandingPageChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [attachedImages, setAttachedImages] = useState<Array<{ url: string; file: File }>>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const chatAreaRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const {
    messages,
    input,
    setInput,
    handleSubmit: handleChatSubmit,
    isLoading,
    append,
  } = useChat({
    api: "/api/landing-chatbot",
  })

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages, isLoading])

  const removeImage = (idx: number) => {
    setAttachedImages((prev) => prev.filter((_, index) => index !== idx))
  }

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!isOpen) return

      const items = Array.from(e.clipboardData?.items || [])
      const imageItems = items.filter((item) => item.type.startsWith("image/"))

      if (imageItems.length > 0) {
        e.preventDefault()
        for (const item of imageItems) {
          const file = item.getAsFile()
          if (file) {
            await handleImageUpload(file)
          }
        }
      }
    }

    document.addEventListener("paste", handlePaste)
    return () => document.removeEventListener("paste", handlePaste)
  }, [isOpen])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter((file) => file.type.startsWith("image/"))

    for (const file of imageFiles) {
      await handleImageUpload(file)
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Fehler",
        description: "Bitte laden Sie nur Bilddateien hoch",
        variant: "destructive",
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Fehler",
        description: "Bild ist zu groß (max. 10MB)",
        variant: "destructive",
      })
      return
    }

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/ai-analysis/chat-upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload fehlgeschlagen")

      const { url } = await response.json()
      setAttachedImages((prev) => [...prev, { url, file }])

      toast({
        title: "Erfolg",
        description: "Bild hochgeladen",
      })
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Bild konnte nicht hochgeladen werden",
        variant: "destructive",
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    for (const file of files) {
      await handleImageUpload(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() && attachedImages.length === 0) return

    // Clear images after submit
    setAttachedImages([])
    handleChatSubmit(e)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      const form = e.currentTarget.form
      if (form) {
        form.requestSubmit()
      }
    }
  }

  const handleQuickQuestion = async (question: string) => {
    try {
      await append({
        role: "user",
        content: question,
      })
    } catch (error) {
      console.error("Error sending quick question:", error)
      toast({
        title: "Fehler",
        description: "Frage konnte nicht gesendet werden",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999]">
          {/* Pulsing ring animation */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 animate-ping opacity-30" />
          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border-0"
            aria-label="KI-Chat öffnen"
          >
            <div className="flex flex-col items-center gap-0.5">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </Button>
          {/* Tooltip - hidden on mobile */}
          <div className="hidden sm:block absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-foreground text-background text-sm rounded-lg shadow-lg whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
            Frag die KI
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-foreground" />
          </div>
        </div>
      )}

      {/* Chat Window - Made responsive for mobile */}
      {isOpen && (
        <Card
          className={cn(
            "fixed z-[9999] flex flex-col overflow-hidden border-0 shadow-2xl",
            // Mobile: full screen with safe area
            "inset-0 rounded-none",
            // Tablet and up: positioned bottom-right with fixed size
            "sm:inset-auto sm:bottom-4 sm:right-4 sm:w-[380px] sm:h-[550px] sm:rounded-2xl",
            "md:bottom-6 md:right-6 md:w-[420px] md:h-[600px]",
            isDragging && "ring-2 ring-purple-500",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-gradient-to-r from-purple-600 to-indigo-600 text-white safe-area-inset-top">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base">Effizienz Praxis KI</h3>
                <p className="text-xs opacity-90">Immer für Sie da</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 text-white h-8 w-8 sm:h-10 sm:w-10"
              aria-label="Chat schließen"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-3 sm:p-4 bg-background" ref={scrollAreaRef}>
            <div className="space-y-3 sm:space-y-4">
              {isDragging && (
                <div className="absolute inset-0 bg-purple-500/10 border-2 border-dashed border-purple-500 rounded-lg flex items-center justify-center z-10 pointer-events-none">
                  <div className="text-center">
                    <Upload className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 text-purple-500" />
                    <p className="text-sm font-medium">Lassen Sie die Bilder los</p>
                  </div>
                </div>
              )}

              {messages.length === 0 && (
                <div className="text-center py-4 sm:py-8 space-y-3 sm:space-y-4">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 flex items-center justify-center mx-auto">
                    <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-base sm:text-lg mb-1">Willkommen!</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground px-2">
                      Ich helfe Ihnen gerne bei Fragen zu Effizienz Praxis.
                    </p>
                  </div>
                  <div className="space-y-2 px-2">
                    <p className="text-xs text-muted-foreground font-medium">Beispielfragen:</p>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-auto py-2 sm:py-2.5 bg-transparent hover:bg-purple-50 dark:hover:bg-purple-950 hover:border-purple-300 transition-colors text-left justify-start"
                        onClick={() => handleQuickQuestion("Welche Funktionen bietet Effizienz Praxis?")}
                        disabled={isLoading}
                      >
                        Welche Funktionen bietet Effizienz Praxis?
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-auto py-2 sm:py-2.5 bg-transparent hover:bg-purple-50 dark:hover:bg-purple-950 hover:border-purple-300 transition-colors text-left justify-start"
                        onClick={() => handleQuickQuestion("Ist die Software DSGVO-konform?")}
                        disabled={isLoading}
                      >
                        Ist die Software DSGVO-konform?
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-auto py-2 sm:py-2.5 bg-transparent hover:bg-purple-50 dark:hover:bg-purple-950 hover:border-purple-300 transition-colors text-left justify-start"
                        onClick={() => handleQuickQuestion("Wie funktioniert die KI-Praxisanalyse?")}
                        disabled={isLoading}
                      >
                        Wie funktioniert die KI-Praxisanalyse?
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 sm:gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center shrink-0">
                      <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2 sm:px-4 sm:py-3 max-w-[85%] shadow-sm",
                      message.role === "user"
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
                    )}
                  >
                    {message.role === "assistant" ? (
                      <div className="text-xs sm:text-sm leading-relaxed space-y-2">
                        {message.content.split("\n\n").map((paragraph, i) => {
                          // Handle markdown-style headers
                          if (paragraph.startsWith("# ")) {
                            return (
                              <h3 key={i} className="font-bold text-sm sm:text-base mt-2 first:mt-0">
                                {paragraph.slice(2)}
                              </h3>
                            )
                          }
                          if (paragraph.startsWith("## ")) {
                            return (
                              <h4 key={i} className="font-semibold text-xs sm:text-sm mt-2">
                                {paragraph.slice(3)}
                              </h4>
                            )
                          }
                          // Handle bullet points
                          if (paragraph.includes("\n- ") || paragraph.startsWith("- ")) {
                            const lines = paragraph.split("\n")
                            return (
                              <ul key={i} className="space-y-1 ml-1">
                                {lines.map((line, j) => (
                                  <li key={j} className="flex items-start gap-2">
                                    {line.startsWith("- ") && (
                                      <>
                                        <span className="text-purple-500 mt-0.5">•</span>
                                        <span>{line.slice(2)}</span>
                                      </>
                                    )}
                                    {!line.startsWith("- ") && line.trim() && <span>{line}</span>}
                                  </li>
                                ))}
                              </ul>
                            )
                          }
                          return (
                            <p key={i} className="whitespace-pre-wrap">
                              {paragraph}
                            </p>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    )}
                  </div>
                  {message.role === "user" && (
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center shrink-0">
                      <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2 sm:gap-3 justify-start">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center shrink-0">
                    <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white animate-pulse" />
                  </div>
                  <div className="rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 bg-muted">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-purple-500" />
                      <span className="text-xs sm:text-sm text-muted-foreground">Die KI denkt nach...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input - Made responsive with safe area for mobile */}
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="p-3 sm:p-4 border-t bg-background safe-area-inset-bottom"
            data-chatbot-form
          >
            {attachedImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {attachedImages.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={URL.createObjectURL(img.file) || "/placeholder.svg"}
                      alt="Angehängtes Bild"
                      className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg object-cover border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      aria-label="Bild entfernen"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  disabled={uploadingImage}
                  asChild
                  className="rounded-xl bg-transparent h-9 w-9 sm:h-10 sm:w-10"
                >
                  <div>
                    {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                  </div>
                </Button>
              </label>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ihre Frage hier eingeben..."
                disabled={isLoading}
                className="flex-1 rounded-xl h-9 sm:h-10 text-sm"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || (!input.trim() && attachedImages.length === 0)}
                aria-label="Nachricht senden"
                className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 h-9 w-9 sm:h-10 sm:w-10"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 text-center">
              Powered by KI · DSGVO-konform · Bilder per Drag & Drop
            </p>
          </form>
        </Card>
      )}
    </>
  )
}

export default LandingPageChatbot
