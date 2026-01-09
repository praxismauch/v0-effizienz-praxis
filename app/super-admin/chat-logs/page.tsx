import type { Metadata } from "next"
import ChatLogsViewer from "@/components/super-admin/chat-logs-viewer"

export const metadata: Metadata = {
  title: "Chat-Protokolle | Super Admin",
  description: "Alle Chatbot-Anfragen von der Landingpage",
}

export default function ChatLogsPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <ChatLogsViewer />
    </div>
  )
}
