import { Button } from "@/components/ui/button"
import { AppLayout } from "@/components/app-layout"
import { ArrowLeft, Search } from "lucide-react"
import Link from "next/link"

export default function TeamMemberEditNotFound() {
  return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-6">
              <Search className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Teammitglied nicht gefunden</h1>
            <p className="text-muted-foreground">
              Das gesuchte Teammitglied existiert nicht oder wurde gelöscht.
            </p>
          </div>

          <div className="flex gap-2 justify-center">
            <Link href="/team">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück zum Team
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
