import BackupsClient from "./page-client"

export const metadata = {
  title: "Backup | Super Admin",
  description: "Erstellen, verwalten und wiederherstellen Sie Datenbank-Backups",
}

export default function BackupsPage() {
  return <BackupsClient />
}
