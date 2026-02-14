"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Clock, Building2, Users, Mail, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PendingPractice {
  id: string
  name: string
  type: string
  address: string
  email: string
  phone: string
  created_at: string
  created_by: string
}

interface PendingUser {
  id: string
  email: string
  name: string
  first_name: string
  last_name: string
  role: string
  created_at: string
  practice: {
    id: string
    name: string
    approval_status: string
  }
}

export default function ApprovalsPageClient() {
  const [practices, setPractices] = useState<PendingPractice[]>([])
  const [users, setUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadApprovals()
  }, [])

  async function loadApprovals() {
    try {
      const response = await fetch("/api/super-admin/approvals")
      if (!response.ok) throw new Error("Failed to load approvals")
      const data = await response.json()
      setPractices(data.practices || [])
      setUsers(data.users || [])
    } catch (error) {
      console.error("Error loading approvals:", error)
      toast({
        title: "Fehler",
        description: "Genehmigungen konnten nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleApproval(type: "practice" | "user", id: string, status: "approved" | "rejected") {
    setProcessing(id)
    try {
      const response = await fetch("/api/super-admin/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, status }),
      })

      if (!response.ok) throw new Error("Approval failed")

      toast({
        title: "Erfolg",
        description: `${type === "practice" ? "Praxis" : "Benutzer"} wurde ${status === "approved" ? "genehmigt" : "abgelehnt"}`,
      })

      // Reload approvals
      await loadApprovals()
    } catch (error) {
      console.error("Error handling approval:", error)
      toast({
        title: "Fehler",
        description: "Genehmigung fehlgeschlagen",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Genehmigungen</h1>
        <p className="text-muted-foreground">Praxen und Benutzer zur Genehmigung verwalten</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Ausstehende Praxen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{practices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Ausstehende Benutzer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="practices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="practices">
            <Building2 className="mr-2 h-4 w-4" />
            Praxen ({practices.length})
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            Benutzer ({users.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="practices" className="space-y-4">
          {practices.length === 0 ? (
            <Alert>
              <AlertDescription>Keine ausstehenden Praxen zur Genehmigung</AlertDescription>
            </Alert>
          ) : (
            practices.map((practice) => (
              <Card key={practice.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>{practice.name}</CardTitle>
                      <CardDescription>
                        <Badge variant="outline">{practice.type}</Badge>
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      <Clock className="mr-1 h-3 w-3" />
                      Ausstehend
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {practice.email}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {practice.address || "Keine Adresse angegeben"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApproval("practice", practice.id, "approved")}
                      disabled={processing === practice.id}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Genehmigen
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleApproval("practice", practice.id, "rejected")}
                      disabled={processing === practice.id}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Ablehnen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {users.length === 0 ? (
            <Alert>
              <AlertDescription>Keine ausstehenden Benutzer zur Genehmigung</AlertDescription>
            </Alert>
          ) : (
            users.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>{user.name}</CardTitle>
                      <CardDescription>{user.email}</CardDescription>
                    </div>
                    <Badge variant="secondary">
                      <Clock className="mr-1 h-3 w-3" />
                      Ausstehend
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2 text-sm">
                    <div>
                      <span className="font-medium">Rolle:</span> {user.role}
                    </div>
                    <div>
                      <span className="font-medium">Praxis:</span> {user.practice?.name || "Unbekannt"}
                    </div>
                    {user.practice?.approval_status === "pending" && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          Warnung: Die zugehörige Praxis ist noch nicht genehmigt
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApproval("user", user.id, "approved")}
                      disabled={processing === user.id}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Genehmigen
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleApproval("user", user.id, "rejected")}
                      disabled={processing === user.id}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Ablehnen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
