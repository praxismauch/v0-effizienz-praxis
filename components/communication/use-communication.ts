"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { usePractice } from "@/contexts/practice-context"
import { toast } from "sonner"
import { isActiveMember } from "@/lib/utils/team-member-filter"
import type { Notification, Message, TeamMember, NewMessageData } from "./types"

export function useCommunication() {
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
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)

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
          (data.messages || []).filter((m: Message) => m.recipient_id === user.id && !m.is_read).length
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
    } catch {
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
    } catch {
      toast.error("Fehler beim Löschen")
    }
  }

  // Message handlers
  const markMessageAsRead = async (message: Message) => {
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

  const sendMessage = async (newMessage: NewMessageData): Promise<boolean> => {
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
        fetchMessages()
        return true
      }
      return false
    } catch {
      toast.error("Nachricht konnte nicht gesendet werden")
      return false
    }
  }

  const sendReply = async (
    selectedMessage: Message,
    replyContent: string
  ): Promise<boolean> => {
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
        fetchMessages()
        toast.success("Antwort gesendet")
        return true
      }
      return false
    } catch {
      toast.error("Antwort konnte nicht gesendet werden")
      return false
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
      toast.success("Nachricht gelöscht")
      return true
    } catch {
      toast.error("Fehler beim Löschen")
      return false
    }
  }

  return {
    // User
    user,
    // Notifications
    notifications,
    isLoadingNotifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    // Messages
    messages,
    teamMembers,
    isLoadingMessages,
    unreadMessageCount,
    markMessageAsRead,
    sendMessage,
    sendReply,
    deleteMessage,
  }
}
