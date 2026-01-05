import { Button } from "@/components/ui/button"
import { FileQuestion } from "lucide-react"
import Link from "next/link"

export default function SuperAdminNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="flex justify-center">
          <FileQuestion className="h-16 w-16 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Seite nicht gefunden</h2>
        <p className="text-muted-foreground">Die angeforderte Super Admin Seite existiert nicht.</p>
        <Button asChild>
          <Link href="/super-admin">Zurück zum Super Admin Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
