"use client"

import { Clock, MessageSquare, CheckCircle, XCircle } from "lucide-react"
import { formatDateDE } from "@/lib/utils"

interface TicketStatusIndicatorProps {
  status: string
  updatedAt?: string
}

export function TicketStatusIndicator({ status, updatedAt }: TicketStatusIndicatorProps) {
  switch (status) {
    case "open":
      return (
        <div className="flex items-center gap-2 text-blue-600">
          <Clock className="h-4 w-4" />
          <span>Warten auf Bearbeitung</span>
        </div>
      )
    case "in_progress":
      return (
        <div className="flex items-center gap-2 text-yellow-600">
          <MessageSquare className="h-4 w-4" />
          <span>Wird bearbeitet</span>
        </div>
      )
    case "to_test":
      return (
        <div className="flex items-center gap-2 text-purple-600">
          <Clock className="h-4 w-4" />
          <span>Zu testen</span>
        </div>
      )
    case "resolved":
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>Gelöst am {updatedAt ? formatDateDE(updatedAt) : ""}</span>
        </div>
      )
    case "closed":
      return (
        <div className="flex items-center gap-2 text-gray-600">
          <CheckCircle className="h-4 w-4" />
          <span>Geschlossen</span>
        </div>
      )
    case "wont_fix":
      return (
        <div className="flex items-center gap-2 text-gray-600">
          <XCircle className="h-4 w-4" />
          <span>Wird nicht behoben</span>
        </div>
      )
    default:
      return null
  }
}
