"use client"

import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeftRight, Check, X, Clock } from "lucide-react"
import type { SwapRequest } from "../types"

interface SwapRequestsTabProps {
  swapRequests: SwapRequest[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
  isLoading?: boolean
}

export default function SwapRequestsTab({ swapRequests, onApprove, onReject, isLoading }: SwapRequestsTabProps) {
  const pendingRequests = (swapRequests || []).filter((r) => r.status === "pending")
  const processedRequests = (swapRequests || []).filter((r) => r.status !== "pending")

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Offene Anfragen ({pendingRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Keine offenen Tausch-Anfragen</p>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.requester?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>
                        {getInitials(request.requester?.first_name || "", request.requester?.last_name || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {request.requester?.first_name} {request.requester?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {request.requester_shift?.date
                          ? format(new Date(request.requester_shift.date), "EEEE, d. MMMM", { locale: de })
                          : "Datum unbekannt"}
                      </p>
                    </div>
                    <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.target?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>
                        {getInitials(request.target?.first_name || "", request.target?.last_name || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {request.target?.first_name} {request.target?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {request.target_shift?.date
                          ? format(new Date(request.target_shift.date), "EEEE, d. MMMM", { locale: de })
                          : "Datum unbekannt"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => onReject(request.id)}>
                      <X className="h-4 w-4 mr-1" />
                      Ablehnen
                    </Button>
                    <Button size="sm" onClick={() => onApprove(request.id)}>
                      <Check className="h-4 w-4 mr-1" />
                      Genehmigen
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bearbeitete Anfragen ({processedRequests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processedRequests.slice(0, 10).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <span className="text-sm">
                      {request.requester?.first_name} {request.requester?.last_name}
                    </span>
                    <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">
                      {request.target?.first_name} {request.target?.last_name}
                    </span>
                  </div>
                  <Badge variant={request.status === "approved" ? "default" : "destructive"}>
                    {request.status === "approved" ? "Genehmigt" : "Abgelehnt"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
