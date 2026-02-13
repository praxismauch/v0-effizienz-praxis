import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Bell,
  CheckCheck,
  MoreHorizontal,
  Clock,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  ExternalLink,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"

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

interface NotificationListProps {
  notifications: Notification[]
  isLoading: boolean
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDelete: (id: string) => void
  formatTime: (dateString: string) => string
}

const notificationTypeConfig = {
  info: { icon: Info, color: "bg-blue-500", bgColor: "bg-blue-50 dark:bg-blue-950" },
  success: { icon: CheckCircle, color: "bg-green-500", bgColor: "bg-green-50 dark:bg-green-950" },
  warning: { icon: AlertCircle, color: "bg-amber-500", bgColor: "bg-amber-50 dark:bg-amber-950" },
  error: { icon: XCircle, color: "bg-red-500", bgColor: "bg-red-50 dark:bg-red-950" },
  system: { icon: Bell, color: "bg-purple-500", bgColor: "bg-purple-50 dark:bg-purple-950" },
}

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

export function NotificationList({
  notifications,
  isLoading,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  formatTime,
}: NotificationListProps) {
  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">Benachrichtigungen</CardTitle>
          <CardDescription>{notifications.length} Einträge</CardDescription>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onMarkAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-1" />
            Alle gelesen
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea className="h-full">
          {isLoading ? (
            <LoadingSkeleton />
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">Keine Benachrichtigungen</p>
              <p className="text-sm text-muted-foreground mt-1">Neue Benachrichtigungen werden hier angezeigt</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
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
                      if (!notification.is_read) onMarkAsRead(notification.id)
                      if (notification.link) window.location.href = notification.link
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("h-9 w-9 rounded-full flex items-center justify-center text-white", config.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm truncate", !notification.is_read ? "font-semibold" : "font-medium")}>
                            {notification.title}
                          </span>
                          {!notification.is_read && <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{formatTime(notification.created_at)}</span>
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
                                onMarkAsRead(notification.id)
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
                              onDelete(notification.id)
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
  )
}
