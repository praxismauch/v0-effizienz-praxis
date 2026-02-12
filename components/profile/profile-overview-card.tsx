import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProfileImageEditor } from "@/components/profile-image-editor"
import { Camera, CheckCircle, Mail, Building2, Calendar, ShieldCheck } from "lucide-react"

interface ProfileOverviewCardProps {
  currentUser: {
    name: string
    email: string
    role: string
    isActive: boolean
    mfa_enabled: boolean
    joinedAt: string
  }
  formData: {
    name: string
    avatar: string
  }
  currentPractice?: {
    name: string
  }
  roleColors: Record<string, string>
  onAvatarChange: (avatarUrl: string) => void
  getRoleLabel: (role: string) => string
}

export function ProfileOverviewCard({
  currentUser,
  formData,
  currentPractice,
  roleColors,
  onAvatarChange,
  getRoleLabel,
}: ProfileOverviewCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={formData.avatar || "/placeholder.svg"} alt={formData.name} className="object-cover" />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {formData.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <ProfileImageEditor
              currentAvatar={formData.avatar}
              userName={formData.name}
              onAvatarChange={onAvatarChange}
              trigger={
                <Button size="icon" variant="secondary" className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-md">
                  <Camera className="h-4 w-4" />
                </Button>
              }
            />
          </div>
          <div className="flex-1 text-center sm:text-left space-y-2">
            <h2 className="text-2xl font-semibold">{currentUser.name}</h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <Badge className={roleColors[currentUser.role] || "bg-gray-500"}>{getRoleLabel(currentUser.role)}</Badge>
              {currentUser.isActive ? (
                <Badge variant="outline" className="border-green-500 text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Aktiv
                </Badge>
              ) : (
                <Badge variant="outline" className="border-red-500 text-red-600">
                  Inaktiv
                </Badge>
              )}
              {currentUser.mfa_enabled && (
                <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  2FA
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {currentUser.email}
              </span>
              {currentPractice && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {currentPractice.name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Mitglied seit {new Date(currentUser.joinedAt).toLocaleDateString("de-DE")}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
