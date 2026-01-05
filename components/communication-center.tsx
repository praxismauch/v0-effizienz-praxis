"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { usePractice } from "@/contexts/practice-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Bell,
  MessageSquare,
  Send,
  Plus,
  Search,
  Trash2,
  CheckCheck,
  MoreHorizontal,
  Inbox,
  SendHorizontal,
  RefreshCw,
  ExternalLink,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { de } from "date-fns/locale"
import { toast } from "sonner"
import { isActiveMember } from "@/lib/utils/team-member-filter"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  link?: string
  is_read: boolean
  created_at: string
}

interface Message {
  id: string
  sender_id: string
  recipient_id: string
  subject: string
  content: string
  is_read: boolean
  read_at: string | null
  thread_id: string
  parent_message_id: string | null
  message_type: string
  created_at: string
  sender?: { first_name: string; last_name: string }
  recipient?: { first_name: string; last_name: string }
}

interface TeamMember {
  user_id: string
  first_name: string
  last_name: string
  role: string
}

interface CommunicationCenterProps {
  defaultTab?: "notifications" | "messages"
}

export function CommunicationCenter({ defaultTab = "notifications" }: CommunicationCenterProps) {
  const { user } = useAuth()
  const { currentPractice } = usePractice()

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)

  // Messages state
  const [messages, setMessages] = useState<Message[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const [activeMessageTab, setActiveMessageTab] = useState<"inbox" | "sent">("inbox")
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [threadMessages, setThreadMessages] = useState<Message[]>([])
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)

  // Common state
  const [searchQuery, setSearchQuery] = useState("")
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [newMessage, setNewMessage] = useState({
    recipient_id: "",
    subject: "",
    content: "",
  })

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const response = await fetch("/api/notifications?limit=50")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
        setUnreadNotificationCount(data.filter((n: Notification) => !n.is_read).length)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setIsLoadingNotifications(false)
    }
  }, [user])

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!currentPractice?.id || !user?.id) return
    try {
      const response = await fetch(`/api/messages?practiceId=${currentPractice.id}&userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        setUnreadMessageCount(
          (data.messages || []).filter((m: Message) => m.recipient_id === user.id && !m.is_read).length,
        )
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setIsLoadingMessages(false)
    }
  }, [currentPractice?.id, user?.id])

  // Fetch team members
  const fetchTeamMembers = useCallback(async () => {
    if (!currentPractice?.id) return
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/team-members`)
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data.filter((m: TeamMember) => m.user_id !== user?.id && isActiveMember(m)))
      }
    } catch (error) {
      console.error("Error fetching team members:", error)
    }
  }, [currentPractice?.id, user?.id])

  useEffect(() => {
    fetchNotifications()
    fetchMessages()
    fetchTeamMembers()

    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications()
      fetchMessages()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchNotifications, fetchMessages, fetchTeamMembers])

  // Update thread messages when selected message changes
  useEffect(() => {
    if (selectedMessage) {
      const thread = messages.filter((m) => m.thread_id === selectedMessage.thread_id)
      setThreadMessages(thread.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()))
    }
  }, [selectedMessage, messages])

  // Notification handlers
  const markNotificationAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: true }),
      })
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
      setUnreadNotificationCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllNotificationsAsRead = async () => {
    try {
      await fetch("/api/notifications/mark-all-read", { method: "POST" })
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadNotificationCount(0)
      toast.success("Alle Benachrichtigungen als gelesen markiert")
    } catch (error) {
      toast.error("Fehler beim Markieren")
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" })
      const notification = notifications.find((n) => n.id === id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      if (notification && !notification.is_read) {
        setUnreadNotificationCount((prev) => Math.max(0, prev - 1))
      }
      toast.success("Benachrichtigung gelöscht")
    } catch (error) {
      toast.error("Fehler beim Löschen")
    }
  }

  // Message handlers
  const handleSelectMessage = async (message: Message) => {
    setSelectedMessage(message)
    if (!message.is_read && message.recipient_id === user?.id) {
      try {
        await fetch(`/api/messages/${message.id}/read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ practiceId: currentPractice?.id }),
        })
        setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, is_read: true } : m)))
        setUnreadMessageCount((prev) => Math.max(0, prev - 1))
      } catch (error) {
        console.error("Error marking message as read:", error)
      }
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.recipient_id || !newMessage.subject || !newMessage.content) {
      toast.error("Bitte füllen Sie alle Felder aus")
      return
    }

    setIsSending(true)
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newMessage,
          practiceId: currentPractice?.id,
          senderId: user?.id,
        }),
      })

      if (response.ok) {
        toast.success("Nachricht gesendet")
        setIsComposeOpen(false)
        setNewMessage({ recipient_id: "", subject: "", content: "" })
        fetchMessages()
      }
    } catch (error) {
      toast.error("Nachricht konnte nicht gesendet werden")
    } finally {
      setIsSending(false)
    }
  }

  const handleReply = async () => {
    if (!replyContent.trim() || !selectedMessage) return

    setIsSending(true)
    try {
      const recipientId =
        selectedMessage.sender_id === user?.id ? selectedMessage.recipient_id : selectedMessage.sender_id

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_id: recipientId,
          subject: `Re: ${selectedMessage.subject}`,
          content: replyContent,
          practiceId: currentPractice?.id,
          senderId: user?.id,
          threadId: selectedMessage.thread_id,
          parentMessageId: selectedMessage.id,
        }),
      })

      if (response.ok) {
        setReplyContent("")
        fetchMessages()
        toast.success("Antwort gesendet")
      }
    } catch (error) {
      toast.error("Antwort konnte nicht gesendet werden")
    } finally {
      setIsSending(false)
    }
  }

  const deleteMessage = async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ practiceId: currentPractice?.id }),
      })
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null)
      }
      toast.success("Nachricht gelöscht")
    } catch (error) {
      toast.error("Fehler beim Löschen")
    }
  }

  // Filter messages
  const filteredMessages = messages
    .filter((m) => {
      if (activeMessageTab === "inbox") return m.recipient_id === user?.id
      return m.sender_id === user?.id
    })
    .filter(
      (m) =>
        m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.content.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Filter notifications
  const filteredNotifications = notifications.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
    if (activeMessageTab === "sent") {
      return message.recipient?.first_name?.[0] || "?"
    }
    return message.sender?.first_name?.[0] || "?"
  }

  const getSenderName = (message: Message) => {
    if (activeMessageTab === "sent") {
      return `${message.recipient?.first_name || ""} ${message.recipient?.last_name || ""}`.trim() || "Unbekannt"
    }
    return `${message.sender?.first_name || ""} ${message.sender?.last_name || ""}`.trim() || "Unbekannt"
  }

  const totalUnread = unreadNotificationCount + unreadMessageCount

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Kommunikation</h1>
          <p className="text-sm text-muted-foreground">
            Benachrichtigungen und Nachrichten
            {totalUnread > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalUnread} ungelesen
              </Badge>
            )}
          </p>
        </div>
        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Neue Nachricht
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Neue Nachricht</DialogTitle>
              <DialogDescription>Senden Sie eine Nachricht an ein Teammitglied.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Empfänger</label>
                <Select
                  value={newMessage.recipient_id}
                  onValueChange={(value) => setNewMessage((prev) => ({ ...prev, recipient_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Empfänger auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.first_name} {member.last_name} ({member.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Betreff</label>
                <Input
                  placeholder="Betreff eingeben..."
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage((prev) => ({ ...prev, subject: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nachricht</label>
                <Textarea
                  placeholder="Ihre Nachricht..."
                  rows={5}
                  value={newMessage.content}
                  onChange={(e) => setNewMessage((prev) => ({ ...prev, content: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSendMessage} disabled={isSending}>
                {isSending ? "Senden..." : "Senden"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Suchen..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue={defaultTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Benachrichtigungen
            {unreadNotificationCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5">
                {unreadNotificationCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Nachrichten
            {unreadMessageCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5">
                {unreadMessageCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="flex-1 mt-4">
          <div className="border rounded-lg bg-card h-full flex flex-col">
            <div className="flex items-center justify-between p-3 border-b">
              <span className="text-sm font-medium">{filteredNotifications.length} Benachrichtigungen</span>
              {unreadNotificationCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllNotificationsAsRead}>
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Alle gelesen
                </Button>
              )}
            </div>
            <ScrollArea className="flex-1">
              {isLoadingNotifications ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Keine Benachrichtigungen</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-muted/50 transition-colors ${
                        !notification.is_read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm truncate ${!notification.is_read ? "font-semibold" : "font-medium"}`}
                            >
                              {notification.title}
                            </span>
                            {!notification.is_read && <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">{formatTime(notification.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {notification.link && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (!notification.is_read) markNotificationAsRead(notification.id)
                                window.location.href = notification.link!
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!notification.is_read && (
                                <DropdownMenuItem onClick={() => markNotificationAsRead(notification.id)}>
                                  <CheckCheck className="h-4 w-4 mr-2" />
                                  Als gelesen markieren
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => deleteNotification(notification.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Löschen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="flex-1 mt-4">
          <div className="border rounded-lg bg-card h-full flex">
            {/* Message List */}
            <div className="w-full md:w-80 lg:w-96 border-r flex flex-col">
              <div className="flex border-b">
                <button
                  onClick={() => setActiveMessageTab("inbox")}
                  className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    activeMessageTab === "inbox"
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Inbox className="h-4 w-4" />
                  Posteingang
                </button>
                <button
                  onClick={() => setActiveMessageTab("sent")}
                  className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    activeMessageTab === "sent"
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <SendHorizontal className="h-4 w-4" />
                  Gesendet
                </button>
              </div>
              <ScrollArea className="flex-1">
                {isLoadingMessages ? (
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
                        } ${!message.is_read && message.recipient_id === user?.id ? "bg-primary/5" : ""}`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-xs">{getInitials(message)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium truncate">
                                {activeMessageTab === "sent" ? "An: " : ""}
                                {getSenderName(message)}
                              </span>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {format(new Date(message.created_at), "dd.MM.", { locale: de })}
                              </span>
                            </div>
                            <p className="text-sm truncate text-muted-foreground">{message.subject}</p>
                          </div>
                          {!message.is_read && message.recipient_id === user?.id && (
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
                    <Button variant="ghost" size="icon" onClick={() => deleteMessage(selectedMessage.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {threadMessages.map((msg) => {
                        const isOwnMessage = msg.sender_id === user?.id
                        return (
                          <div key={msg.id} className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-xs">
                                {isOwnMessage ? "Ich" : getInitials(msg)}
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
