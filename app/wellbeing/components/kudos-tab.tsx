"use client"

import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Award, ChevronRight, PartyPopper } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import type { Kudos } from "../types"
import { KUDOS_CATEGORIES } from "../types"

interface KudosTabProps {
  kudosList: Kudos[]
  onShowKudosDialog: () => void
  onReactToKudos: (kudosId: string, emoji: string) => void
}

export function KudosTab({ kudosList, onShowKudosDialog, onReactToKudos }: KudosTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Peer-Recognition</h2>
          <p className="text-sm text-muted-foreground">{"Anerkennung und Wertschätzung im Team"}</p>
        </div>
        <Button onClick={onShowKudosDialog}>
          <Award className="h-4 w-4 mr-2" />
          Kudos senden
        </Button>
      </div>

      {kudosList.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {kudosList.map((kudos) => {
            const category = KUDOS_CATEGORIES.find((c) => c.value === kudos.category)
            return (
              <Card key={kudos.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${category?.color || "bg-gray-500"}`}>
                      {category?.icon && <category.icon className="h-5 w-5 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        {kudos.is_anonymous ? (
                          <span className="text-muted-foreground">Anonym</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={kudos.from_user_avatar || "/placeholder.svg"} />
                              <AvatarFallback>{kudos.from_user_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <span>{kudos.from_user_name}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={kudos.to_user_avatar || "/placeholder.svg"} />
                            <AvatarFallback>{kudos.to_user_name?.[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{kudos.to_user_name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{kudos.message}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline" className="text-xs">
                      {category?.label || kudos.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(kudos.created_at), "dd. MMM", { locale: de })}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="flex items-center gap-2">
                    {["\u2764\uFE0F", "\uD83C\uDF89", "\uD83D\uDC4F", "\uD83D\uDE4C"].map((emoji) => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => onReactToKudos(kudos.id, emoji)}
                      >
                        {emoji}
                        {kudos.reactions?.[emoji] ? (
                          <span className="ml-1 text-xs">{kudos.reactions[emoji]}</span>
                        ) : null}
                      </Button>
                    ))}
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <PartyPopper className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Noch keine Kudos</h3>
            <p className="text-muted-foreground mb-4">Starten Sie die Peer-Recognition-Kultur in Ihrem Team!</p>
            <Button onClick={onShowKudosDialog}>
              <Award className="h-4 w-4 mr-2" />
              Ersten Kudos senden
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
