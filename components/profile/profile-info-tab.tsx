import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { User, Save, Loader2, Building2 } from "lucide-react"

interface ProfileInfoTabProps {
  formData: {
    name: string
    email: string
    preferred_language: string
  }
  isLoading: boolean
  userTeams: any[]
  onFormDataChange: (data: any) => void
  onSave: () => void
}

export function ProfileInfoTab({ formData, isLoading, userTeams, onFormDataChange, onSave }: ProfileInfoTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Persönliche Informationen
          </CardTitle>
          <CardDescription>Aktualisieren Sie Ihre grundlegenden Profilinformationen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Vollständiger Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
                placeholder="Ihr Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
                placeholder="ihre@email.de"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="language">Bevorzugte Sprache</Label>
            <Select
              value={formData.preferred_language}
              onValueChange={(value) => onFormDataChange({ ...formData, preferred_language: value })}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button onClick={onSave} disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Speichere...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Änderungen speichern
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Teams */}
      {userTeams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Meine Teams
            </CardTitle>
            <CardDescription>Teams, denen Sie zugewiesen sind</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {userTeams.map((team) => (
                <Badge key={team.id} variant="secondary" className="py-1.5 px-3">
                  {team.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
