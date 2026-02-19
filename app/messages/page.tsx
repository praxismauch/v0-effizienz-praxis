"use client"

import { useState, useEffect, useCallback } from "react"
import { usePractice } from "@/contexts/practice-context"
import { useAuth } from "@/contexts/auth-context"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, MessageSquare, RefreshCw, Search, Plus } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { de } from "date-fns/locale"
import { toast } from "sonner"
import { isActiveMember } from "@/lib/utils/team-member-filter"
import { NotificationList } from "@/components/communication/notification-list"
import { MessageList } from "@/components/communication/message-list"
import { MessageDetail } from "@/components/communication/message-detail"
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
import { TeamMemberSelectItem } from "@/components/team-member-select-item"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send } from "lucide-react"
import { getRoleLabel } from "@/lib/roles"

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
        const members = data.teamMembers || []
        setTeamMembers(members.filter((m: TeamMember) => m.user_id !== user?.id && isActiveMember(m)))
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
      const recipientId = selectedMessage.sender_id === user?.id ? selectedMessage.recipient_id : selectedMessage.sender_id

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
                      <SelectContent position="popper" className="max-h-[300px]">
                        {teamMembers.map((member) => {
                          const memberId = member.user_id || member.id || member.team_member_id
                          if (!memberId) return null
                          return (
                            <TeamMemberSelectItem
                              key={memberId}
                              value={memberId}
                              firstName={member.first_name}
                              lastName={member.last_name}
                              avatarUrl={member.avatar_url}
                              role={getRoleLabel(member.role)}
                            />
                          )
                        })}
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
          <Input placeholder="Suchen..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
            <NotificationList
              notifications={filteredNotifications}
              isLoading={isLoadingNotifications}
              onMarkAsRead={markNotificationAsRead}
              onMarkAllAsRead={markAllNotificationsAsRead}
              onDelete={deleteNotification}
              formatTime={formatTime}
            />
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="flex-1 min-h-0">
            <div className="flex h-full gap-4">
              <MessageList
                messages={filteredMessages}
                isLoading={isLoadingMessages}
                activeTab={activeMessageTab}
                selectedMessageId={selectedMessage?.id || null}
                userId={user?.id}
                onSelectMessage={handleSelectMessage}
                onTabChange={setActiveMessageTab}
                formatTime={formatTime}
              />

              <MessageDetail
                selectedMessage={selectedMessage}
                threadMessages={threadMessages}
                replyContent={replyContent}
                isSending={isSending}
                userId={user?.id}
                activeTab={activeMessageTab}
                onReplyChange={setReplyContent}
                onReply={handleReply}
                onDelete={deleteMessage}
                formatTime={formatTime}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
