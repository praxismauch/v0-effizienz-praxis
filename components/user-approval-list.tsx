"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserCheck, RefreshCw, Clock, CheckCircle2, XCircle } from "lucide-react"
import { formatDateDE } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface User {
  id: string
  name: string
  email: string
  created_at: string
  is_active: boolean
  approval_status: "pending" | "approved" | "rejected"
  approved_at?: string
  approved_by?: string
  rejected_at?: string
  rejected_by?: string
}

interface StatusCounts {
  pending: number
  approved: number
  rejected: number
}

export function UserApprovalList() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [processingUserId, setProcessingUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending")
  const [counts, setCounts] = useState<StatusCounts>({ pending: 0, approved: 0, rejected: 0 })

  const fetchCounts = async () => {
    try {
      const response = await fetch("/api/super-admin/pending-users/counts")
      if (!response.ok) throw new Error("Failed to fetch counts")

      const data = await response.json()
      setCounts(data.counts || { pending: 0, approved: 0, rejected: 0 })
    } catch (error) {
      console.error("[v0] Error fetching counts:", error)
    }
  }

  const fetchUsers = async (status: "pending" | "approved" | "rejected") => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/super-admin/pending-users?status=${status}`)
      if (!response.ok) throw new Error("Failed to fetch users")

      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("[v0] Error fetching users:", error)
      toast({
        title: "Fehler",
        description: "Benutzer konnten nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCounts()
    fetchUsers(activeTab)
  }, [activeTab])

  const handleApproveUser = async (userId: string, userName: string) => {
    setProcessingUserId(userId)
    try {
      const response = await fetch(`/api/super-admin/approve-user/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve: true }),
      })

      if (!response.ok) throw new Error("Failed to approve user")

      toast({
        title: "Benutzer genehmigt",
        description: `${userName} wurde erfolgreich genehmigt und kann sich jetzt anmelden.`,
      })

      fetchCounts()
      fetchUsers(activeTab)
    } catch (error) {
      console.error("[v0] Error approving user:", error)
      toast({
        title: "Fehler",
        description: "Benutzer konnte nicht genehmigt werden",
        variant: "destructive",
      })
    } finally {
      setProcessingUserId(null)
    }
  }

  const handleRejectUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Möchten Sie den Benutzer "${userName}" wirklich ablehnen?`)) {
      return
    }

    setProcessingUserId(userId)
    try {
      const response = await fetch(`/api/super-admin/approve-user/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve: false }),
      })

      if (!response.ok) throw new Error("Failed to reject user")

      toast({
        title: "Benutzer abgelehnt",
        description: `${userName} wurde abgelehnt.`,
      })

      fetchCounts()
      fetchUsers(activeTab)
    } catch (error) {
      console.error("[v0] Error rejecting user:", error)
      toast({
        title: "Fehler",
        description: "Benutzer konnte nicht abgelehnt werden",
        variant: "destructive",
      })
    } finally {
      setProcessingUserId(null)
    }
  }

  const renderUserRow = (user: User) => {
    const statusConfig = {
      pending: {
        icon: Clock,
        color: "text-orange-600 dark:text-orange-400",
        bgColor: "bg-orange-50 dark:bg-orange-950",
        borderColor: "border-orange-200 dark:border-orange-800",
        label: "Ausstehend",
      },
      approved: {
        icon: CheckCircle2,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-950",
        borderColor: "border-green-200 dark:border-green-800",
        label: "Genehmigt",
      },
      rejected: {
        icon: XCircle,
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-50 dark:bg-red-950",
        borderColor: "border-red-200 dark:border-red-800",
        label: "Abgelehnt",
      },
    }

    const config = statusConfig[user.approval_status]
    const StatusIcon = config.icon

    return (
      <TableRow key={user.id}>
        <TableCell>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 ${config.bgColor} rounded-full flex items-center justify-center`}>
              <StatusIcon className={`h-4 w-4 ${config.color}`} />
            </div>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="text-sm">{formatDateDE(user.created_at)}</div>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={`${config.bgColor} ${config.color} ${config.borderColor}`}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
          {user.approval_status === "approved" && user.approved_at && (
            <div className="text-xs text-muted-foreground mt-1">{formatDateDE(user.approved_at)}</div>
          )}
          {user.approval_status === "rejected" && user.rejected_at && (
            <div className="text-xs text-muted-foreground mt-1">{formatDateDE(user.rejected_at)}</div>
          )}
        </TableCell>
        <TableCell className="text-right">
          {user.approval_status === "pending" && (
            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => handleApproveUser(user.id, user.name)}
                disabled={processingUserId === user.id}
              >
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Genehmigen
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleRejectUser(user.id, user.name)}
                disabled={processingUserId === user.id}
              >
                <XCircle className="mr-1 h-4 w-4" />
                Ablehnen
              </Button>
            </div>
          )}
        </TableCell>
      </TableRow>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Benutzer-Freigaben
            </CardTitle>
            <CardDescription>Neue Benutzerregistrierungen genehmigen oder ablehnen</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchCounts()
              fetchUsers(activeTab)
            }}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Aktualisieren
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Ausstehend
              {counts.pending > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-full">
                  {counts.pending}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Genehmigt
              {counts.approved > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                  {counts.approved}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Abgelehnt
              {counts.rejected > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full">
                  {counts.rejected}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {["pending", "approved", "rejected"].map((status) => (
            <TabsContent key={status} value={status} className="mt-4">
              {isLoading && users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin" />
                  <p>Lade Benutzer...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {status === "pending" && <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />}
                  {status === "approved" && <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />}
                  {status === "rejected" && <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />}
                  <p>
                    Keine{" "}
                    {status === "pending" ? "ausstehenden" : status === "approved" ? "genehmigten" : "abgelehnten"}{" "}
                    Benutzer
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Benutzer</TableHead>
                      <TableHead>Registriert am</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{users.map(renderUserRow)}</TableBody>
                </Table>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default UserApprovalList
