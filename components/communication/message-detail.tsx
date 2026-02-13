import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Trash2, Send, MailOpen } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  sender_id: string
  recipient_id: string
  subject: string
  content: string
  created_at: string
  sender?: {
    first_name: string
    last_name: string
  }
  recipient?: {
    first_name: string
    last_name: string
  }
}

interface MessageDetailProps {
  selectedMessage: Message | null
  threadMessages: Message[]
  replyContent: string
  isSending: boolean
  userId: string | undefined
  activeTab: "inbox" | "sent"
  onReplyChange: (content: string) => void
  onReply: () => void
  onDelete: (messageId: string) => void
  formatTime: (dateString: string) => string
}

export function MessageDetail({
  selectedMessage,
  threadMessages,
  replyContent,
  isSending,
  userId,
  activeTab,
  onReplyChange,
  onReply,
  onDelete,
  formatTime,
}: MessageDetailProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [threadMessages])

  const getMessagePerson = (message: Message) => {
    const person = activeTab === "sent" ? message.recipient : message.sender
    return {
      name: person ? `${person.first_name || ""} ${person.last_name || ""}`.trim() : "Unbekannt",
    }
  }

  if (!selectedMessage) {
    return (
      <Card className="hidden md:flex flex-1 flex-col">
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <MailOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">Keine Nachricht ausgewählt</p>
          <p className="text-sm text-muted-foreground mt-1">Wählen Sie eine Nachricht aus der Liste</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="hidden md:flex flex-1 flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{selectedMessage.subject}</CardTitle>
            <CardDescription className="mt-1">
              {activeTab === "inbox" ? "Von" : "An"}: {getMessagePerson(selectedMessage).name} •{" "}
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
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(selectedMessage.id)}>
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
              const isOwnMessage = msg.sender_id === userId
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
              onChange={(e) => onReplyChange(e.target.value)}
              rows={2}
              className="resize-none"
            />
            <Button onClick={onReply} disabled={isSending || !replyContent.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
