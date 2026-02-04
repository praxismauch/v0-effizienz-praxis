"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Bell, MessageSquare, Search } from "lucide-react"
import {
  useCommunication,
  NotificationsTab,
  MessagesTab,
  ComposeMessageDialog,
} from "@/components/communication"

interface CommunicationCenterProps {
  defaultTab?: "notifications" | "messages"
}

export function CommunicationCenter({ defaultTab = "notifications" }: CommunicationCenterProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const {
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
  } = useCommunication()

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
        <ComposeMessageDialog teamMembers={teamMembers} onSend={sendMessage} />
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
          <NotificationsTab
            notifications={notifications}
            isLoading={isLoadingNotifications}
            unreadCount={unreadNotificationCount}
            onMarkAsRead={markNotificationAsRead}
            onMarkAllAsRead={markAllNotificationsAsRead}
            onDelete={deleteNotification}
            searchQuery={searchQuery}
          />
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="flex-1 mt-4">
          <MessagesTab
            messages={messages}
            isLoading={isLoadingMessages}
            currentUserId={user?.id}
            searchQuery={searchQuery}
            onSelectMessage={markMessageAsRead}
            onReply={sendReply}
            onDelete={deleteMessage}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
