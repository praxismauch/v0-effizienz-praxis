"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { fetchWithRetry, safeJsonParse } from "@/lib/fetch-with-retry"
import { Search, Calendar, Award, Euro, BookOpen, Filter } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Import types and components
import type {
  TrainingCourse,
  TrainingEvent,
  Certification,
  TeamMemberCertification,
  TrainingBudget,
} from "./types"
import { COURSE_CATEGORIES } from "./types"
import { CoursesTab } from "./components/courses-tab"
import { EventsTab } from "./components/events-tab"
import { CertificationsTab } from "./components/certifications-tab"
import { BudgetsTab } from "./components/budgets-tab"

export default function TrainingPageClient() {
  const { currentUser: user } = useUser()
  const { currentPractice } = usePractice()

  const [activeTab, setActiveTab] = useState("courses")
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  // Data states - using useState with functional updates
  const [courses, setCourses] = useState<TrainingCourse[]>([])
  const [events, setEvents] = useState<TrainingEvent[]>([])
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [teamMemberCertifications, setTeamMemberCertifications] = useState<TeamMemberCertification[]>([])
  const [budgets, setBudgets] = useState<TrainingBudget[]>([])

  // Delete confirmation state
  const [itemToDelete, setItemToDelete] = useState<{
    type: "course" | "event" | "certification"
    id: string
    name: string
  } | null>(null)

  const practiceId = currentPractice?.id

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (!practiceId) return

    try {
      const coursesRes = await fetchWithRetry(`/api/practices/${practiceId}/training/courses`)
      const coursesData = await safeJsonParse(coursesRes)
      setCourses(() => coursesData?.courses || [])

      const eventsRes = await fetchWithRetry(`/api/practices/${practiceId}/training/events`)
      const eventsData = await safeJsonParse(eventsRes)
      setEvents(() => eventsData?.events || [])

      const certificationsRes = await fetchWithRetry(`/api/practices/${practiceId}/training/certifications`)
      const certificationsData = await safeJsonParse(certificationsRes)
      setCertifications(() => certificationsData?.certifications || [])

      const teamCertsRes = await fetchWithRetry(`/api/practices/${practiceId}/training/team-member-certifications`)
      const teamCertsData = await safeJsonParse(teamCertsRes)
      setTeamMemberCertifications(() => teamCertsData?.team_member_certifications || [])

      const budgetsRes = await fetchWithRetry(`/api/practices/${practiceId}/training/budgets`)
      const budgetsData = await safeJsonParse(budgetsRes)
      setBudgets(() => budgetsData?.budgets || [])
    } catch (error) {
      console.error("Error fetching training data:", error)
    }
  }, [practiceId])

  // Initial load
  useEffect(() => {
    if (practiceId) {
      setIsLoading(true)
      fetchData().finally(() => setIsLoading(false))
    }
  }, [fetchData, practiceId])

  const handleDeleteItem = (type: "course" | "event" | "certification", id: string, name: string) => {
    setItemToDelete({ type, id, name })
  }

  const confirmDeleteItem = async () => {
    if (!practiceId || !itemToDelete) return

    try {
      if (itemToDelete.type === "course") {
        await fetch(`/api/practices/${practiceId}/training/courses/${itemToDelete.id}`, { method: "DELETE" })
        // Instant update using functional state
        setCourses(prev => prev.filter(c => c.id !== itemToDelete.id))
      } else if (itemToDelete.type === "event") {
        await fetch(`/api/practices/${practiceId}/training/events/${itemToDelete.id}`, { method: "DELETE" })
        // Instant update using functional state
        setEvents(prev => prev.filter(e => e.id !== itemToDelete.id))
      } else if (itemToDelete.type === "certification") {
        await fetch(`/api/practices/${practiceId}/training/certifications/${itemToDelete.id}`, { method: "DELETE" })
        // Instant update using functional state
        setCertifications(prev => prev.filter(c => c.id !== itemToDelete.id))
      }
    } catch (error) {
      console.error("Error deleting item:", error)
    } finally {
      setItemToDelete(null)
    }
  }

  // Filter functions
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || course.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const filteredCertifications = certifications.filter((cert) => {
    const matchesSearch =
      cert.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || cert.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Stats
  const totalBudget = budgets.reduce((sum, b) => sum + (b.budget_amount || 0), 0)
  const upcomingEvents = events.filter((e) => new Date(e.start_date) > new Date()).length
  const expiringCerts = teamMemberCertifications.filter((c) => {
    if (!c.expiry_date) return false
    const daysUntilExpiry = Math.ceil(
      (new Date(c.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
    )
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }).length

  if (!user || !currentPractice || isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fortbildung & Zertifikate</h1>
          <p className="text-muted-foreground">Verwalten Sie Schulungen, Zertifizierungen und Weiterbildungsbudgets</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kurse</p>
                <p className="text-2xl font-bold">{courses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Anstehende Events</p>
                <p className="text-2xl font-bold">{upcomingEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Award className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ablaufende Zertifikate</p>
                <p className="text-2xl font-bold">{expiringCerts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Euro className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gesamtbudget</p>
                <p className="text-2xl font-bold">{totalBudget.toLocaleString("de-DE")} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="space-y-3 mb-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1">
            <TabsTrigger value="courses">
              <BookOpen className="h-4 w-4 mr-2" />
              Kurse
            </TabsTrigger>
            <TabsTrigger value="events">
              <Calendar className="h-4 w-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="certifications">
              <Award className="h-4 w-4 mr-2" />
              Zertifikate
            </TabsTrigger>
            <TabsTrigger value="budgets">
              <Euro className="h-4 w-4 mr-2" />
              Budgets
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            {(activeTab === "courses" || activeTab === "certifications") && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Kategorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  {COURSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <TabsContent value="courses">
          <CoursesTab
            courses={filteredCourses}
            practiceId={practiceId!}
            onCoursesChange={setCourses}
            onDelete={(id, name) => handleDeleteItem("course", id, name)}
          />
        </TabsContent>

        <TabsContent value="events">
          <EventsTab
            events={filteredEvents}
            courses={courses}
            practiceId={practiceId!}
            onEventsChange={setEvents}
            onDelete={(id, name) => handleDeleteItem("event", id, name)}
          />
        </TabsContent>

        <TabsContent value="certifications">
          <CertificationsTab
            certifications={filteredCertifications}
            practiceId={practiceId!}
            onCertificationsChange={setCertifications}
            onDelete={(id, name) => handleDeleteItem("certification", id, name)}
          />
        </TabsContent>

        <TabsContent value="budgets">
          <BudgetsTab budgets={budgets} practiceId={practiceId!} onBudgetsChange={setBudgets} />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Löschen bestätigen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie &quot;{itemToDelete?.name}&quot; wirklich löschen? Diese Aktion kann nicht rückgängig gemacht
              werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteItem} className="bg-destructive text-destructive-foreground">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
