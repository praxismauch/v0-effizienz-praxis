"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { Loader2, Database } from "lucide-react"

const BackupManager = dynamic(
  () => import("@/components/backup-manager").then((mod) => ({ default: mod.BackupManager })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    ),
    ssr: false,
  },
)

function BackupsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Database className="h-8 w-8" />
          Backup
        </h1>
        <p className="text-muted-foreground mt-2">
          Erstellen, verwalten und wiederherstellen Sie Datenbank-Backups
        </p>
      </div>

      <BackupManager userId="super-admin" practices={[]} />
    </div>
  )
}

export default function BackupsClient() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <BackupsContent />
    </Suspense>
  )
}
