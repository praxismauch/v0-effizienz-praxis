"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { CronJobsList } from "./cron/cron-jobs-list"
import { CronDebuggingGuide } from "./cron/cron-debugging-guide"

export function CronSetupGuide() {
  const { toast } = useToast()
  const [copiedItem, setCopiedItem] = useState<string | null>(null)

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedItem(label)
    toast({
      title: "Kopiert!",
      description: `${label} wurde in die Zwischenablage kopiert.`,
    })
    setTimeout(() => setCopiedItem(null), 2000)
  }

  return (
    <div className="space-y-6">
      <CronJobsList copiedItem={copiedItem} onCopy={handleCopy} />
      <CronDebuggingGuide copiedItem={copiedItem} onCopy={handleCopy} />
    </div>
  )
}

export default CronSetupGuide
