import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft } from "lucide-react"

export default function FeatureNotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <h2 className="text-xl text-muted-foreground">Feature nicht gefunden</h2>
        <p className="text-muted-foreground max-w-md">Die gesuchte Funktion existiert nicht oder wurde verschoben.</p>
        <div className="flex gap-4 justify-center">
          <Button asChild variant="outline">
            <Link href="/#funktionen">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Alle Funktionen
            </Link>
          </Button>
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Startseite
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
