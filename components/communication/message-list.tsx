import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Mail, Inbox, SendHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  sender_id: string
  recipient_id: string
  subject: string
  content: string
  is_read: boolean
  created_at: string
  sender?: {
    id: string
    first_name: string
    last_name: string
  }
  recipient?: {
    id: string
    first_name: string
    last_name: string
  }
}

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
  activeTab: "inbox" | "sent"
  selectedMessageId: string | null
  userId: string | undefined
  onSelectMessage: (message: Message) => void
  onTabChange: (tab: "inbox" | "sent") => void
  formatTime: (dateString: string) => string
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

export function MessageList({
  messages,
  isLoading,
  activeTab,
  selectedMessageId,
  userId,
  onSelectMessage,
  onTabChange,
  formatTime,
}: MessageListProps) {
  const getMessagePerson = (message: Message) => {
    const person = activeTab === "sent" ? message.recipient : message.sender
    return {
      name: person ? `${person.first_name || ""} ${person.last_name || ""}`.trim() : "Unbekannt",
      initials: person?.first_name?.[0] || "?",
    }
  }

  return (
    <Card className="w-full md:w-96 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex border-b -mx-6 -mt-2 px-2">
          <button
            onClick={() => onTabChange("inbox")}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
              activeTab === "inbox"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Inbox className="h-4 w-4" />
            Posteingang
          </button>
          <button
            onClick={() => onTabChange("sent")}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
              activeTab === "sent"
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
          {isLoading ? (
            <LoadingSkeleton />
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Mail className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Keine Nachrichten</p>
            </div>
          ) : (
            <div className="divide-y">
              {messages.map((message) => {
                const person = getMessagePerson(message)
                const isSelected = selectedMessageId === message.id

                return (
                  <div
                    key={message.id}
                    onClick={() => onSelectMessage(message)}
                    className={cn(
                      "p-4 cursor-pointer transition-colors",
                      isSelected ? "bg-primary/10" : "hover:bg-muted/50",
                      !message.is_read && message.recipient_id === userId && "bg-blue-50 dark:bg-blue-950",
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
                              !message.is_read && message.recipient_id === userId ? "font-semibold" : "font-medium",
                            )}
                          >
                            {person.name}
                          </span>
                          {!message.is_read && message.recipient_id === userId && (
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
  )
}
