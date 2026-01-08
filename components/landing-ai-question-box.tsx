"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useChat, DefaultChatTransport } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Send, Loader2, Bot, MessageSquare, ArrowRight, Mic, ImageIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollReveal } from "@/components/scroll-reveal"

const suggestedQuestions = [
  "Welche Funktionen bietet Effizienz Praxis?",
  "Wie kann KI meine Praxis effizienter machen?",
  "Was kostet die Software?",
  "Ist die Software DSGVO-konform?",
]

export function LandingAIQuestionBox() {
  const [input, setInput] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/landing-chatbot" }),
  })

  const isLoading = status === "streaming" || status === "submitted"

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (messages.length > 0) {
      setIsExpanded(true)
    }
  }, [messages])

  const handleSubmit = async (question?: string) => {
    const messageToSend = question || input.trim()
    if (!messageToSend || isLoading) return

    setInput("")
    setIsExpanded(true)

    await sendMessage({ text: messageToSend })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const resetChat = () => {
    setMessages([])
    setIsExpanded(false)
    setInput("")
  }

  const getMessageContent = (message: (typeof messages)[0]): string => {
    if (typeof message.content === "string" && message.content) {
      return message.content
    }
    if (message.parts) {
      const textParts = message.parts
        .filter((part): part is { type: "text"; text: string } => part.type === "text")
        .map((part) => part.text)
        .join("")
      return textParts
    }
    return ""
  }

  return (
    <section className="w-full py-12 md:py-16 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-violet-500/20 via-primary/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      </div>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal variant="fadeUp" delay={100}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500/10 via-primary/10 to-cyan-500/10 border border-primary/20 px-4 py-2 text-sm font-medium text-primary mb-4">
              <Sparkles className="h-4 w-4 animate-pulse" />
              KI-Assistent
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Fragen Sie unseren{" "}
              <span className="bg-gradient-to-r from-violet-600 via-primary to-cyan-600 bg-clip-text text-transparent">
                KI-Assistenten
              </span>
            </h2>
            <p className="text-muted-foreground mt-2">Erhalten Sie sofort Antworten zu Effizienz Praxis</p>
          </div>
        </ScrollReveal>

        <ScrollReveal variant="scaleUp" delay={200}>
          <div className="max-w-3xl mx-auto">
            {/* Main AI input card */}
            <div
              className={cn(
                "relative rounded-2xl border bg-background/80 backdrop-blur-xl shadow-2xl shadow-primary/5 transition-all duration-500",
                isExpanded ? "border-primary/30" : "border-border/50 hover:border-primary/20",
              )}
            >
              {/* Glowing border effect */}
              <div className="absolute -inset-[1px] bg-gradient-to-r from-violet-500/20 via-primary/20 to-cyan-500/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Card content */}
              <div className="relative">
                {/* Messages area (shown when expanded) */}
                {isExpanded && messages.length > 0 && (
                  <div className="p-4 border-b border-border/50 max-h-[300px] overflow-y-auto">
                    <div className="flex justify-end items-center mb-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetChat}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Neu starten
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const content = getMessageContent(message)
                        return (
                          <div
                            key={message.id}
                            className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
                          >
                            {message.role === "assistant" && (
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 via-primary to-cyan-500 flex items-center justify-center">
                                <Bot className="h-4 w-4 text-white" />
                              </div>
                            )}
                            <div
                              className={cn(
                                "rounded-2xl px-4 py-2.5 max-w-[80%] text-sm",
                                message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                              )}
                            >
                              {content || (
                                <span className="flex items-center gap-2">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Denke nach...
                                </span>
                              )}
                            </div>
                            {message.role === "user" && (
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                                <MessageSquare className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                )}

                {/* Input area */}
                <div className="p-4">
                  <div className="flex items-end gap-3">
                    {/* AI Avatar */}
                    {!isExpanded && (
                      <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-primary to-cyan-500 flex items-center justify-center shadow-lg shadow-primary/20">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                    )}

                    {/* Input field */}
                    <div className="flex-1 relative">
                      <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Stellen Sie eine Frage zu Effizienz Praxis..."
                        className={cn(
                          "min-h-[56px] max-h-[120px] resize-none rounded-xl border-2 border-border/50 bg-background/50 pr-24 text-base transition-all",
                          "focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                          "placeholder:text-muted-foreground/60",
                        )}
                        rows={1}
                      />

                      {/* Action buttons inside input */}
                      <div className="absolute right-2 bottom-2 flex items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                          disabled
                          title="Sprachein­gabe (bald verfügbar)"
                        >
                          <Mic className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                          disabled
                          title="Bild hochladen (bald verfügbar)"
                        >
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleSubmit()}
                          disabled={!input.trim() || isLoading}
                          size="icon"
                          className={cn(
                            "h-8 w-8 rounded-lg transition-all",
                            input.trim() && !isLoading
                              ? "bg-gradient-to-r from-violet-500 via-primary to-cyan-500 hover:opacity-90"
                              : "",
                          )}
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Suggested questions */}
                  {!isExpanded && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {suggestedQuestions.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleSubmit(question)}
                          disabled={isLoading}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                            "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground",
                            "border border-border/50 hover:border-primary/30",
                            "transition-all duration-200 hover:scale-[1.02]",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                          )}
                        >
                          <ArrowRight className="h-3 w-3" />
                          {question}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
