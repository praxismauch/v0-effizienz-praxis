"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { usePractice } from "@/contexts/practice-context"
import { useAuth } from "@/contexts/auth-context"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
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
  Mail,
  MailOpen,
  Clock,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { de } from "date-fns/locale"
import { toast } from "sonner"
import { isActiveMember } from "@/lib/utils/team-member-filter"
import { cn } from "@/lib/utils"

// Types
interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error" | "system"
  link?: string
  is_read: boolean
  created_at: string
  metadata?: Record<string, unknown>
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
  updated_at: string
  deleted_at: string | null
  sender?: {
    id: string
    first_name: string
    last_name: string
    email?: string
    avatar?: string
  }
  recipient?: {
    id: string
    first_name: string
    last_name: string
    email?: string
    avatar?: string
  }
}

interface TeamMember {
  user_id: string
  first_name: string
  last_name: string
  role: string
  avatar?: string
  status?: string
}

// Notification type config
const notificationTypeConfig = {
  info: { icon: Info, color: "bg-blue-500", bgColor: "bg-blue-50 dark:bg-blue-950" },
  success: { icon: CheckCircle, color: "bg-green-500", bgColor: "bg-green-50 dark:bg-green-950" },
  warning: { icon: AlertCircle, color: "bg-amber-500", bgColor: "bg-amber-50 dark:bg-amber-950" },
  error: { icon: XCircle, color: "bg-red-500", bgColor: "bg-red-50 dark:bg-red-950" },
  system: { icon: Bell, color: "bg-purple-500", bgColor: "bg-purple-50 dark:bg-purple-950" },
}

export default function CommunicationPage() {
  const { currentPractice } = usePractice()
  const { user } = useAuth()

  // Tab state
  const [activeMainTab, setActiveMainTab] = useState<"notifications" | "messages">("notifications")
  const [activeMessageTab, setActiveMessageTab] = useState<"inbox" | "sent">("inbox")

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true)

  // Messages state
  const [messages, setMessages] = useState<Message[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [threadMessages, setThreadMessages] = useState<Message[]>([])

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

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Computed counts
  const unreadNotificationCount = notifications.filter((n) => !n.is_read).length
  const unreadMessageCount = messages.filter((m) => m.recipient_id === user?.id && !m.is_read).length
  const totalUnread = unreadNotificationCount + unreadMessageCount

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const response = await fetch("/api/notifications?limit=50")
      if (response.ok) {
        const data = await response.json()
        setNotifications(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setIsLoadingNotifications(false)
    }
  }, [user])

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!user?.id) return
    try {
      const response = await fetch("/api/messages?limit=50")
      if (response.ok) {
        const data = await response.json()
        setMessages(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setIsLoadingMessages(false)
    }
  }, [user?.id])

  // Fetch team members
  const fetchTeamMembers = useCallback(async () => {
    if (!currentPractice?.id) return
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/team-members`)
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(
          (Array.isArray(data) ? data : []).filter((m: TeamMember) => m.user_id !== user?.id && isActiveMember(m)),
        )
      }
    } catch (error) {
      console.error("Error fetching team members:", error)
    }
  }, [currentPractice?.id, user?.id])

  // Initial load and polling
  useEffect(() => {
    fetchNotifications()
    fetchMessages()
    fetchTeamMembers()

    const interval = setInterval(() => {
      fetchNotifications()
      fetchMessages()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchNotifications, fetchMessages, fetchTeamMembers])

  // Update thread when message selected
  useEffect(() => {
    if (selectedMessage) {
      const thread = messages
        .filter((m) => m.thread_id === selectedMessage.thread_id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      setThreadMessages(thread)
    }
  }, [selectedMessage, messages])

  // Scroll to bottom of thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [threadMessages])

  // Notification handlers
  const markNotificationAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: true }),
      })
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllNotificationsAsRead = async () => {
    try {
      await fetch("/api/notifications/mark-all-read", { method: "POST" })
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      toast.success("Alle Benachrichtigungen als gelesen markiert")
    } catch (error) {
      toast.error("Fehler beim Markieren")
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" })
      setNotifications((prev) => prev.filter((n) => n.id !== id))
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
        await fetch(`/api/messages/${message.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_read: true }),
        })
        setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, is_read: true } : m)))
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
          recipient_id: newMessage.recipient_id,
          subject: newMessage.subject,
          content: newMessage.content,
          practice_id: currentPractice?.id,
        }),
      })

      if (response.ok) {
        toast.success("Nachricht gesendet")
        setIsComposeOpen(false)
        setNewMessage({ recipient_id: "", subject: "", content: "" })
        fetchMessages()
      } else {
        throw new Error("Failed to send message")
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
          subject: `Re: ${selectedMessage.subject.replace(/^Re: /, "")}`,
          content: replyContent,
          practice_id: currentPractice?.id,
          thread_id: selectedMessage.thread_id,
          parent_message_id: selectedMessage.id,
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
      await fetch(`/api/messages/${messageId}`, { method: "DELETE" })
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null)
      }
      toast.success("Nachricht gelöscht")
    } catch (error) {
      toast.error("Fehler beim Löschen")
    }
  }

  // Filters
  const filteredNotifications = notifications.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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

  // Helpers
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true, locale: de })
    }
    return format(date, "dd.MM.yyyy HH:mm", { locale: de })
  }

  const getMessagePerson = (message: Message) => {
    const person = activeMessageTab === "sent" ? message.recipient : message.sender
    return {
      name: person ? `${person.first_name || ""} ${person.last_name || ""}`.trim() : "Unbekannt",
      initials: person?.first_name?.[0] || "?",
      avatar: person?.avatar,
    }
  }

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-3 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Kommunikation</h1>
            <p className="text-sm text-muted-foreground">
              Ihre Benachrichtigungen und Nachrichten
              {totalUnread > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {totalUnread} ungelesen
                </Badge>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchNotifications()
                fetchMessages()
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Aktualisieren
            </Button>
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
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">{member.first_name?.[0]}</AvatarFallback>
                              </Avatar>
                              {member.first_name} {member.last_name}
                              <span className="text-muted-foreground">({member.role})</span>
                            </div>
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
                    <Send className="h-4 w-4 mr-2" />
                    {isSending ? "Senden..." : "Senden"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
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

        {/* Main Content */}
        <Tabs
          value={activeMainTab}
          onValueChange={(v) => setActiveMainTab(v as typeof activeMainTab)}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Benachrichtigungen
              {unreadNotificationCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 text-xs">
                  {unreadNotificationCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Nachrichten
              {unreadMessageCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 text-xs">
                  {unreadMessageCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="flex-1 min-h-0">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">Benachrichtigungen</CardTitle>
                  <CardDescription>{filteredNotifications.length} Einträge</CardDescription>
                </div>
                {unreadNotificationCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllNotificationsAsRead}>
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Alle gelesen
                  </Button>
                )}
              </CardHeader>
              <CardContent className="flex-1 p-0 min-h-0">
                <ScrollArea className="h-full">
                  {isLoadingNotifications ? (
                    <LoadingSkeleton />
                  ) : filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Bell className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">Keine Benachrichtigungen</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Neue Benachrichtigungen werden hier angezeigt
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredNotifications.map((notification) => {
                        const config =
                          notificationTypeConfig[notification.type as keyof typeof notificationTypeConfig] ||
                          notificationTypeConfig.info
                        const Icon = config.icon

                        return (
                          <div
                            key={notification.id}
                            className={cn(
                              "p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                              !notification.is_read && config.bgColor,
                            )}
                            onClick={() => {
                              if (!notification.is_read) markNotificationAsRead(notification.id)
                              if (notification.link) window.location.href = notification.link
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  "h-9 w-9 rounded-full flex items-center justify-center text-white",
                                  config.color,
                                )}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "text-sm truncate",
                                      !notification.is_read ? "font-semibold" : "font-medium",
                                    )}
                                  >
                                    {notification.title}
                                  </span>
                                  {!notification.is_read && (
                                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {formatTime(notification.created_at)}
                                  </span>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {!notification.is_read && (
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        markNotificationAsRead(notification.id)
                                      }}
                                    >
                                      <CheckCheck className="h-4 w-4 mr-2" />
                                      Als gelesen markieren
                                    </DropdownMenuItem>
                                  )}
                                  {notification.link && (
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        window.location.href = notification.link!
                                      }}
                                    >
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Öffnen
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteNotification(notification.id)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Löschen
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="flex-1 min-h-0">
            <div className="flex h-full gap-4">
              {/* Message List */}
              <Card className="w-full md:w-96 flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex border-b -mx-6 -mt-2 px-2">
                    <button
                      onClick={() => setActiveMessageTab("inbox")}
                      className={cn(
                        "flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                        activeMessageTab === "inbox"
                          ? "border-b-2 border-primary text-primary"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Inbox className="h-4 w-4" />
                      Posteingang
                    </button>
                    <button
                      onClick={() => setActiveMessageTab("sent")}
                      className={cn(
                        "flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                        activeMessageTab === "sent"
                          ? "border-b-2 border-primary text-primary"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <SendHorizontal className="h-4 w-4" />
                      Gesendet
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 min-h-0">
                  <ScrollArea className="h-full">
                    {isLoadingMessages ? (
                      <LoadingSkeleton />
                    ) : filteredMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                          <Mail className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">Keine Nachrichten</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredMessages.map((message) => {
                          const person = getMessagePerson(message)
                          const isSelected = selectedMessage?.id === message.id

                          return (
                            <div
                              key={message.id}
                              onClick={() => handleSelectMessage(message)}
                              className={cn(
                                "p-4 cursor-pointer transition-colors",
                                isSelected ? "bg-primary/10" : "hover:bg-muted/50",
                                !message.is_read && message.recipient_id === user?.id && "bg-blue-50 dark:bg-blue-950",
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
                                    {person.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={cn(
                                        "text-sm truncate",
                                        !message.is_read && message.recipient_id === user?.id
                                          ? "font-semibold"
                                          : "font-medium",
                                      )}
                                    >
                                      {person.name}
                                    </span>
                                    {!message.is_read && message.recipient_id === user?.id && (
                                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-sm font-medium truncate mt-0.5">{message.subject}</p>
                                  <p className="text-xs text-muted-foreground truncate mt-1">{message.content}</p>
                                  <p className="text-xs text-muted-foreground mt-2">{formatTime(message.created_at)}</p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Message Detail */}
              <Card className="hidden md:flex flex-1 flex-col">
                {selectedMessage ? (
                  <>
                    <CardHeader className="pb-3 border-b">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{selectedMessage.subject}</CardTitle>
                          <CardDescription className="mt-1">
                            {activeMessageTab === "inbox" ? "Von" : "An"}: {getMessagePerson(selectedMessage).name} •{" "}
                            {formatTime(selectedMessage.created_at)}
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteMessage(selectedMessage.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 min-h-0 flex flex-col">
                      <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                          {threadMessages.map((msg) => {
                            const isOwnMessage = msg.sender_id === user?.id
                            return (
                              <div key={msg.id} className={cn("flex", isOwnMessage ? "justify-end" : "justify-start")}>
                                <div
                                  className={cn(
                                    "max-w-[80%] rounded-lg p-3",
                                    isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted",
                                  )}
                                >
                                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                  <p
                                    className={cn(
                                      "text-xs mt-2",
                                      isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground",
                                    )}
                                  >
                                    {formatTime(msg.created_at)}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>
                      {/* Reply */}
                      <div className="p-4 border-t">
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Antwort schreiben..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            rows={2}
                            className="resize-none"
                          />
                          <Button onClick={handleReply} disabled={isSending || !replyContent.trim()}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <MailOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">Keine Nachricht ausgewählt</p>
                    <p className="text-sm text-muted-foreground mt-1">Wählen Sie eine Nachricht aus der Liste</p>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
