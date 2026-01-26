"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { X, Send, Loader2, User, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { FormattedAIContent } from "@/components/formatted-ai-content"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  isStreaming?: boolean
}

// Typewriter effect component for animated text display
function TypewriterText({ content, onComplete }: { content: string; onComplete?: () => void }) {
  const [displayedContent, setDisplayedContent] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < content.length) {
      // Variable speed: faster for spaces, slower for punctuation
      const char = content[currentIndex]
      const delay = char === " " ? 10 : char.match(/[.,!?]/) ? 80 : 20

      const timer = setTimeout(() => {
        setDisplayedContent((prev) => prev + char)
        setCurrentIndex((prev) => prev + 1)
      }, delay)

      return () => clearTimeout(timer)
    } else if (onComplete && currentIndex === content.length && content.length > 0) {
      onComplete()
    }
  }, [currentIndex, content, onComplete])

  // Reset when content changes significantly (new message)
  useEffect(() => {
    if (content.length < displayedContent.length) {
      setDisplayedContent("")
      setCurrentIndex(0)
    }
  }, [content, displayedContent.length])

  return <>{displayedContent}<span className="animate-pulse">|</span></>
}

export function LandingPageChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (isLoading) {
      scrollToBottom()
    }
  }, [isLoading, scrollToBottom])

  const resetChat = () => {
    setMessages([])
    setInput("")
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      isStreaming: true,
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setIsLoading(true)

    try {
      const response = await fetch("/api/landing-chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.userMessage || "Fehler bei der Anfrage")
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let fullText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk

        setMessages((prev) => prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: fullText } : m)))
      }

      // Mark streaming as complete
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, isStreaming: false, content: fullText.trim() || "Entschuldigung, ich konnte keine Antwort generieren." }
            : m,
        ),
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ein unbekannter Fehler ist aufgetreten."
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: `Entschuldigung, ${errorMessage}` } : m)),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    if (isLoading) return

    await sendMessage(input)
    setInput("")
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
    if (isLoading) return
    await sendMessage(question)
  }

  return (
    <>
      {!isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999]">
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
        </div>
      )}

      {isOpen && (
        <Card
          className={cn(
            "fixed z-[9999] flex flex-col overflow-hidden border-0 shadow-2xl",
            "inset-0 rounded-none",
            "sm:inset-auto sm:bottom-4 sm:right-4 sm:w-[380px] sm:h-[550px] sm:rounded-2xl",
            "md:bottom-6 md:right-6 md:w-[420px] md:h-[600px]",
          )}
        >
          <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-gradient-to-r from-purple-600 to-indigo-600 text-white safe-area-inset-top shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base">Effizienz Praxis KI</h3>
                <p className="text-xs opacity-90">Immer für Sie da</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetChat}
                  className="hover:bg-white/20 text-white text-xs h-8 px-2"
                  disabled={isLoading}
                >
                  Neu starten
                </Button>
              )}
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
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 bg-background" ref={scrollAreaRef}>
            <div className="space-y-3 sm:space-y-4">
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
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100",
                    )}
                  >
                    {message.role === "assistant" ? (
                      message.content ? (
                        <div className="text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          <FormattedAIContent
                            content={message.content}
                            showCard={false}
                            className="[&_h1]:text-base [&_h1]:mb-3 [&_h2]:text-sm [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-sm [&_p]:text-xs [&_p]:sm:text-sm [&_p]:mb-2 [&_p]:text-slate-800 [&_p]:dark:text-slate-200 [&_li]:text-xs [&_li]:sm:text-sm [&_li]:text-slate-800 [&_li]:dark:text-slate-200 [&_ul]:my-2 [&_ol]:my-2"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-purple-500" />
                          <span>Die KI antwortet</span>
                          <span className="inline-flex">
                            <span className="animate-bounce" style={{ animationDelay: "0ms" }}>
                              .
                            </span>
                            <span className="animate-bounce" style={{ animationDelay: "150ms" }}>
                              .
                            </span>
                            <span className="animate-bounce" style={{ animationDelay: "300ms" }}>
                              .
                            </span>
                          </span>
                        </div>
                      )
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

              <div ref={messagesEndRef} />
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-3 sm:p-4 border-t bg-background safe-area-inset-bottom shrink-0"
            data-chatbot-form
          >
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Stellen Sie eine Frage..."
                className="flex-1 text-sm"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="h-10 w-10 shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </>
  )
}
