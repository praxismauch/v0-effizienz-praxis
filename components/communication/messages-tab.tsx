"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Send, Trash2, Inbox, SendHorizontal, RefreshCw } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { de } from "date-fns/locale"
import type { Message, MessageTab } from "./types"

interface MessagesTabProps {
  messages: Message[]
  isLoading: boolean
  currentUserId: string | undefined
  searchQuery: string
  onSelectMessage: (message: Message) => void
  onReply: (message: Message, content: string) => Promise<boolean>
  onDelete: (messageId: string) => Promise<boolean>
}

export function MessagesTab({
  messages,
  isLoading,
  currentUserId,
  searchQuery,
  onSelectMessage,
  onReply,
  onDelete,
}: MessagesTabProps) {
  const [activeTab, setActiveTab] = useState<MessageTab>("inbox")
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [threadMessages, setThreadMessages] = useState<Message[]>([])
  const [replyContent, setReplyContent] = useState("")
  const [isSending, setIsSending] = useState(false)

  // Update thread messages when selected message changes
  useEffect(() => {
    if (selectedMessage) {
      const thread = messages.filter((m) => m.thread_id === selectedMessage.thread_id)
      setThreadMessages(thread.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()))
    }
  }, [selectedMessage, messages])

  const filteredMessages = messages
    .filter((m) => {
      if (activeTab === "inbox") return m.recipient_id === currentUserId
      return m.sender_id === currentUserId
    })
    .filter(
      (m) =>
        m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true, locale: de })
    }
    return format(date, "dd.MM.yyyy HH:mm", { locale: de })
  }

  const getInitials = (message: Message) => {
    if (activeTab === "sent") {
      return message.recipient?.first_name?.[0] || "?"
    }
    return message.sender?.first_name?.[0] || "?"
  }

  const getSenderName = (message: Message) => {
    if (activeTab === "sent") {
      return `${message.recipient?.first_name || ""} ${message.recipient?.last_name || ""}`.trim() || "Unbekannt"
    }
    return `${message.sender?.first_name || ""} ${message.sender?.last_name || ""}`.trim() || "Unbekannt"
  }

  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message)
    onSelectMessage(message)
  }

  const handleReply = async () => {
    if (!replyContent.trim() || !selectedMessage) return
    setIsSending(true)
    const success = await onReply(selectedMessage, replyContent)
    if (success) {
      setReplyContent("")
    }
    setIsSending(false)
  }

  const handleDelete = async () => {
    if (!selectedMessage) return
    const success = await onDelete(selectedMessage.id)
    if (success) {
      setSelectedMessage(null)
    }
  }

  return (
    <div className="border rounded-lg bg-card h-full flex">
      {/* Message List */}
      <div className="w-full md:w-80 lg:w-96 border-r flex flex-col">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === "inbox"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Inbox className="h-4 w-4" />
            Posteingang
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === "sent"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <SendHorizontal className="h-4 w-4" />
            Gesendet
          </button>
        </div>
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Keine Nachrichten</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredMessages.map((message) => (
                <button
                  key={message.id}
                  onClick={() => handleSelectMessage(message)}
                  className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                    selectedMessage?.id === message.id ? "bg-muted" : ""
                  } ${!message.is_read && message.recipient_id === currentUserId ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-xs">{getInitials(message)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">
                          {activeTab === "sent" ? "An: " : ""}
                          {getSenderName(message)}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(message.created_at), "dd.MM.", { locale: de })}
                        </span>
                      </div>
                      <p className="text-sm truncate text-muted-foreground">{message.subject}</p>
                    </div>
                    {!message.is_read && message.recipient_id === currentUserId && (
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Message Detail */}
      <div className="hidden md:flex flex-1 flex-col">
        {selectedMessage ? (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{selectedMessage.subject}</h2>
                <p className="text-sm text-muted-foreground">{threadMessages.length} Nachricht(en)</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {threadMessages.map((msg) => {
                  const isOwnMessage = msg.sender_id === currentUserId
                  return (
                    <div key={msg.id} className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-xs">
                          {isOwnMessage ? "Ich" : msg.sender?.first_name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-xs mt-1 ${isOwnMessage ? "opacity-70" : "text-muted-foreground"}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Antwort schreiben..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[60px]"
                />
                <Button onClick={handleReply} disabled={isSending || !replyContent.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Wählen Sie eine Nachricht aus
          </div>
        )}
      </div>
    </div>
  )
}
