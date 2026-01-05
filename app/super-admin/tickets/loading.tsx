import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex h-full items-center justify-center p-12">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <p className="text-lg font-medium">Ticketmanager wird geladen...</p>
        <p className="text-sm text-muted-foreground">Bitte warten Sie einen Moment</p>
      </div>
    </div>
  )
}
