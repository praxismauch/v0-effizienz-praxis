"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Users } from "lucide-react"
import { WunschpatientCard } from "@/components/wunschpatient/wunschpatient-card"
import { WunschpatientDetailView } from "@/components/wunschpatient/wunschpatient-detail-view"
import { CreateWunschpatientDialog } from "@/components/wunschpatient/create-wunschpatient-dialog"
import { Skeleton } from "@/components/ui/skeleton"

type PageClientProps = {}

export default function PageClient(_props: PageClientProps) {
  const { currentUser: user, loading: authLoading } = useUser()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null)

  useEffect(() => {
    if (currentPractice?.id) {
      fetchProfiles()
    }
  }, [currentPractice?.id])

  const fetchProfiles = async () => {
    if (!currentPractice?.id) return
    try {
      setLoading(true)
      const response = await fetch(`/api/wunschpatient?practice_id=${currentPractice.id}`)

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("API returned non-JSON response:", text.substring(0, 100))
        setProfiles([])
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("API error:", errorData)
        setProfiles([])
        return
      }

      const data = await response.json()
      setProfiles(data || [])
    } catch (error) {
      console.error("Error fetching profiles:", error)
      setProfiles([])
    } finally {
      setLoading(false)
    }
  }

  const filteredProfiles = profiles.filter((profile) => profile.name?.toLowerCase().includes(searchQuery.toLowerCase()))

  if (authLoading || practiceLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  if (!user || !currentPractice) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <p className="text-muted-foreground">Bitte melden Sie sich an</p>
      </div>
    )
  }

  // Show detail view when a profile is selected
  if (selectedProfile) {
    return (
      <WunschpatientDetailView
        profile={selectedProfile}
        onBack={() => setSelectedProfile(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wunschpatient-Generator</h1>
          <p className="text-muted-foreground">Definieren Sie Ihre idealen Patientenprofile</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Neues Profil
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Profile durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredProfiles.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProfiles.map((profile) => (
            <WunschpatientCard
              key={profile.id}
              profile={profile}
              onDeleted={fetchProfiles}
              onUpdated={fetchProfiles}
              onViewProfile={(p) => setSelectedProfile(p)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Profile gefunden</h3>
            <p className="text-muted-foreground text-center mb-4">
              Erstellen Sie Ihr erstes Wunschpatient-Profil um Ihre Zielgruppe zu definieren
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Erstes Profil erstellen
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateWunschpatientDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchProfiles}
        practiceId={currentPractice.id}
        userId={user.id}
      />
    </div>
  )
}
