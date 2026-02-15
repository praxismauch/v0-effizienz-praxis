"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, UserPlus, Building2, Users } from "lucide-react"
import { toast } from "sonner"

interface Practice {
  id: string
  name: string
  type: string
  approval_status: string
}

interface User {
  id: string
  email: string
  name: string
  practice_id: string | null
  role: string
  is_active: boolean
}

interface TeamMember {
  practice_id: string
  user_id: string
  role: string
  status: string
}

export function PracticeManagementClient() {
  const [practices, setPractices] = useState<Practice[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedPracticeId, setSelectedPracticeId] = useState<string>("")
  const [selectedRole, setSelectedRole] = useState<string>("user")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [practicesRes, usersRes, teamMembersRes] = await Promise.all([
        fetch("/api/practices"),
        fetch("/api/super-admin/users"),
        fetch("/api/super-admin/team-members"),
      ])

      const practicesData = await practicesRes.json()
      const usersData = await usersRes.json()
      const teamMembersData = await teamMembersRes.json()

      setPractices(practicesData.practices || [])
      setUsers(usersData.users || [])
      setTeamMembers(teamMembersData.teamMembers || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const assignUserToPractice = async () => {
    if (!selectedUserId || !selectedPracticeId) {
      toast.error("Please select both a user and a practice")
      return
    }

    try {
      const response = await fetch("/api/super-admin/assign-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          practiceId: selectedPracticeId,
          role: selectedRole,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to assign user")
      }

      toast.success("User assigned to practice successfully")
      fetchData()
      setSelectedUserId("")
      setSelectedPracticeId("")
      setSelectedRole("user")
    } catch (error) {
      console.error("Error assigning user:", error)
      toast.error(error instanceof Error ? error.message : "Failed to assign user")
    }
  }

  const removeUserFromPractice = async (userId: string, practiceId: string) => {
    if (!confirm("Are you sure you want to remove this user from the practice?")) return

    try {
      const response = await fetch("/api/super-admin/assign-practice", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, practiceId }),
      })

      if (!response.ok) throw new Error("Failed to remove user")

      toast.success("User removed from practice")
      fetchData()
    } catch (error) {
      console.error("Error removing user:", error)
      toast.error("Failed to remove user")
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getUserPractices = (userId: string) => {
    return teamMembers.filter((tm) => tm.user_id === userId)
  }

  const getPracticeName = (practiceId: string) => {
    return practices.find((p) => p.id === practiceId)?.name || "Unbekannt"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Laden...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Praxisverwaltung</h1>
          <p className="text-muted-foreground">Benutzer zu Praxen zuweisen und Teammitgliedschaften verwalten</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Praxen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{practices.length}</div>
            <p className="text-sm text-muted-foreground">
              {practices.filter((p) => p.approval_status === "approved").length} genehmigt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Benutzer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{users.length}</div>
            <p className="text-sm text-muted-foreground">{users.filter((u) => u.is_active).length} aktiv</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Zuweisungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{teamMembers.length}</div>
            <p className="text-sm text-muted-foreground">Gesamte Praxis-Mitgliedschaften</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Benutzer zu Praxis zuweisen</CardTitle>
          <CardDescription>Einen Benutzer mit einer bestimmten Rolle einem Praxis-Team hinzufugen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Benutzer</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Benutzer auswahlen" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.email} - {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Praxis</Label>
              <Select value={selectedPracticeId} onValueChange={setSelectedPracticeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Praxis auswahlen" />
                </SelectTrigger>
                <SelectContent>
                  {practices
                    .filter((p) => p.approval_status === "approved")
                    .map((practice) => (
                      <SelectItem key={practice.id} value={practice.id}>
                        {practice.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rolle</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Benutzer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="practice_admin">Praxis Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={assignUserToPractice} className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Zuweisen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Benutzer-Praxis-Zuweisungen</CardTitle>
          <CardDescription>Alle Benutzer-Praxis-Zuweisungen anzeigen und verwalten</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Benutzer nach E-Mail oder Name suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Benutzer</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Zugewiesene Praxen</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const userPractices = getUserPractices(user.id)
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {userPractices.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {userPractices.map((tm) => (
                            <Badge key={`${tm.practice_id}-${tm.user_id}`} variant="secondary">
                              {getPracticeName(tm.practice_id)} ({tm.role})
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Keine Zuweisungen</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {userPractices.map((tm) => (
                        <Button
                          key={`${tm.practice_id}-${tm.user_id}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUserFromPractice(user.id, tm.practice_id)}
                        >
                          Entfernen aus {getPracticeName(tm.practice_id)}
                        </Button>
                      ))}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
