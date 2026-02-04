"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bell, Trash2, CheckCheck, MoreHorizontal, RefreshCw, ExternalLink } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { de } from "date-fns/locale"
import type { Notification } from "./types"

interface NotificationsTabProps {
  notifications: Notification[]
  isLoading: boolean
  unreadCount: number
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDelete: (id: string) => void
  searchQuery: string
}

export function NotificationsTab({
  notifications,
  isLoading,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  searchQuery,
}: NotificationsTabProps) {
  const filteredNotifications = notifications.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <div className="border rounded-lg bg-card h-full flex flex-col">
      <div className="flex items-center justify-between p-3 border-b">
        <span className="text-sm font-medium">{filteredNotifications.length} Benachrichtigungen</span>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onMarkAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-1" />
            Alle gelesen
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1">
        {isLoading ? (
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
                          if (!notification.is_read) onMarkAsRead(notification.id)
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
                          <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)}>
                            <CheckCheck className="h-4 w-4 mr-2" />
                            Als gelesen markieren
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onDelete(notification.id)} className="text-destructive">
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
  )
}
