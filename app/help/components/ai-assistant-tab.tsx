"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import {
  Bot,
  Sparkles,
  User,
  Send,
  Loader2,
  RotateCcw,
  Maximize2,
  Minimize2,
  Lightbulb,
  FileText,
  Database,
  Mail,
  Phone,
  MessageSquare,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import type { ChatMessage } from "../types"

interface AIAssistantTabProps {
  suggestedQuestions: string[]
}

export function AIAssistantTab({ suggestedQuestions }: AIAssistantTabProps) {
  const { toast } = useToast()
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [isChatExpanded, setIsChatExpanded] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages])

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isAiTyping) return

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: message,
        timestamp: new Date(),
      }

      setChatMessages((prev) => [...prev, userMessage])
      setChatInput("")
      setIsAiTyping(true)

      try {
        const response = await fetch("/api/help/ai-assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            message,
            history: chatMessages.slice(-10),
          }),
        })

        if (!response.ok) throw new Error("Fehler bei der KI-Anfrage")

        const data = await response.json()

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
          sources: data.sources,
          suggestions: data.suggestions,
          practiceContext: data.usedPracticeContext,
        }

        setChatMessages((prev) => [...prev, assistantMessage])
      } catch (error) {
        console.error("AI error:", error)
        toast({
          title: "Fehler",
          description: "Die KI konnte nicht antworten. Bitte versuchen Sie es erneut.",
          variant: "destructive",
        })
      } finally {
        setIsAiTyping(false)
      }
    },
    [chatMessages, isAiTyping, toast],
  )

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(chatInput)
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Chat Area */}
      <div className="lg:col-span-2">
        <Card
          className={cn(
            "flex flex-col transition-all",
            isChatExpanded ? "fixed inset-4 z-50 rounded-2xl" : "h-[700px]",
          )}
        >
          {/* Chat Header */}
          <CardHeader className="border-b flex-shrink-0 py-4 bg-gradient-to-r from-primary/5 to-purple-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/25">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Praxis KI-Assistent
                    <Badge className="bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary border-0">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Intelligent
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Online
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setChatMessages([])}
                        disabled={chatMessages.length === 0}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Chat leeren</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button variant="ghost" size="icon" onClick={() => setIsChatExpanded(!isChatExpanded)}>
                  {isChatExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Chat Messages */}
          <ScrollArea ref={chatScrollRef} className="flex-1 p-4">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-6">
                  <Sparkles className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Hallo!</h3>
                <p className="text-muted-foreground mb-8 max-w-md">
                  Ich bin Ihr persönlicher KI-Assistent für Effizienz Praxis.
                </p>
                <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-sm text-left h-auto py-3 px-4 justify-start hover:bg-primary/5 hover:border-primary/50 bg-transparent"
                      onClick={() => sendMessage(question)}
                    >
                      <Lightbulb className="h-4 w-4 mr-2 flex-shrink-0 text-amber-500" />
                      <span className="line-clamp-2">{question}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {chatMessages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={cn("flex gap-3", message.role === "user" ? "flex-row-reverse" : "")}
                    >
                      <Avatar
                        className={cn(
                          "w-9 h-9 flex-shrink-0",
                          message.role === "assistant" && "bg-gradient-to-br from-primary to-purple-500",
                        )}
                      >
                        <AvatarFallback
                          className={message.role === "assistant" ? "text-white bg-transparent" : ""}
                        >
                          {message.role === "assistant" ? (
                            <Bot className="h-5 w-5" />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-3",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/80 border",
                        )}
                      >
                        {message.practiceContext && message.role === "assistant" && (
                          <div className="flex items-center gap-1.5 mb-2 text-xs text-primary">
                            <Database className="h-3 w-3" />
                            <span>Basierend auf Ihren Praxisdaten</span>
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {message.content}
                          {message.isStreaming && (
                            <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
                          )}
                        </p>
                        {message.role === "assistant" && message.sources && !message.isStreaming && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-xs text-muted-foreground mb-2">Quellen:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {message.sources.map((source, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="text-xs cursor-pointer hover:bg-primary/10"
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  {source.title}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {message.role === "assistant" && message.suggestions && !message.isStreaming && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-xs text-muted-foreground mb-2">Weiterführende Fragen:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {message.suggestions.map((suggestion, i) => (
                                <Button
                                  key={i}
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto py-1 px-2 text-xs"
                                  onClick={() => sendMessage(suggestion)}
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isAiTyping && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                    <Avatar className="w-9 h-9 flex-shrink-0 bg-gradient-to-br from-primary to-purple-500">
                      <AvatarFallback className="text-white bg-transparent">
                        <Bot className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted/80 border rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Schreibt...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Chat Input */}
          <div className="border-t p-4 flex-shrink-0 bg-background">
            <div className="flex gap-2">
              <Textarea
                placeholder="Stellen Sie Ihre Frage..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className="min-h-[50px] max-h-[150px] resize-none"
                rows={1}
              />
              <Button
                onClick={() => sendMessage(chatInput)}
                disabled={!chatInput.trim() || isAiTyping}
                className="bg-gradient-to-r from-primary to-purple-500 hover:opacity-90 h-auto"
              >
                {isAiTyping ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Noch Fragen?</CardTitle>
            <CardDescription>Unser Support-Team hilft Ihnen gerne.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-2">
              <Mail className="h-4 w-4" />
              support@effizienz-praxis.de
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Phone className="h-4 w-4" />
              +49 123 456 789
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <MessageSquare className="h-4 w-4" />
              Live-Chat starten
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
