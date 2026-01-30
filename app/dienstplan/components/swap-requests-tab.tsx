"use client"

import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeftRight, Check, X, Clock, Calendar, MessageSquare, Sparkles } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { SwapRequest } from "../types"

interface SwapRequestsTabProps {
  swapRequests: SwapRequest[]
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  isLoading?: boolean
}

export default function SwapRequestsTab({ swapRequests, onApprove, onReject, isLoading }: SwapRequestsTabProps) {
  // Safe handlers with fallbacks
  const handleApprove = (id: string) => {
    if (typeof onApprove === "function") {
      onApprove(id)
    } else {
      console.log("[v0] Approve swap clicked - handler not provided:", id)
    }
  }

  const handleReject = (id: string) => {
    if (typeof onReject === "function") {
      onReject(id)
    } else {
      console.log("[v0] Reject swap clicked - handler not provided:", id)
    }
  }
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
            <div className="text-center py-12">
              <ArrowLeftRight className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Keine offenen Tausch-Anfragen</p>
              <p className="text-sm text-muted-foreground mt-1">
                Neue Anfragen erscheinen hier sobald Mitarbeiter Schichten tauschen möchten
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingRequests.map((request) => (
                <Card key={request.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header with avatars and swap arrow */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <Avatar className="h-12 w-12 border-2">
                            <AvatarImage src={request.requester?.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>
                              {getInitials(request.requester?.first_name || "", request.requester?.last_name || "")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold">
                              {request.requester?.first_name} {request.requester?.last_name}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Calendar className="h-3 w-3" />
                              {request.requester_shift?.date || request.requester_shift?.shift_date
                                ? format(
                                    new Date(
                                      request.requester_shift.date || request.requester_shift.shift_date || "",
                                    ),
                                    "EEEE, d. MMMM",
                                    { locale: de },
                                  )
                                : "Datum unbekannt"}
                            </div>
                            {request.requester_shift?.start_time && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {request.requester_shift.start_time.slice(0, 5)} -{" "}
                                {request.requester_shift.end_time?.slice(0, 5)}
                              </div>
                            )}
                          </div>
                        </div>

                        <ArrowLeftRight className="h-6 w-6 text-primary mt-3 flex-shrink-0" />

                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex-1 text-right">
                            <p className="font-semibold">
                              {request.target?.first_name} {request.target?.last_name}
                            </p>
                            <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground mt-1">
                              <Calendar className="h-3 w-3" />
                              {request.target_shift?.date || request.target_shift?.shift_date
                                ? format(
                                    new Date(request.target_shift.date || request.target_shift.shift_date || ""),
                                    "EEEE, d. MMMM",
                                    { locale: de },
                                  )
                                : "Datum unbekannt"}
                            </div>
                            {request.target_shift?.start_time && (
                              <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {request.target_shift.start_time.slice(0, 5)} -{" "}
                                {request.target_shift.end_time?.slice(0, 5)}
                              </div>
                            )}
                          </div>
                          <Avatar className="h-12 w-12 border-2">
                            <AvatarImage src={request.target?.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>
                              {getInitials(request.target?.first_name || "", request.target?.last_name || "")}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>

                      {/* Reason */}
                      {request.reason && (
                        <Alert>
                          <MessageSquare className="h-4 w-4" />
                          <AlertDescription>
                            <span className="font-medium">Begründung: </span>
                            {request.reason}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* AI Recommendation */}
                      {request.ai_recommendation && (
                        <Alert className="bg-primary/5 border-primary/20">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <AlertDescription>
                            <span className="font-medium text-primary">KI-Empfehlung: </span>
                            {request.ai_recommendation}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => handleReject(request.id)}>
                          <X className="h-4 w-4 mr-2" />
                          Ablehnen
                        </Button>
                        <Button size="sm" onClick={() => handleApprove(request.id)}>
                          <Check className="h-4 w-4 mr-2" />
                          Genehmigen
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
