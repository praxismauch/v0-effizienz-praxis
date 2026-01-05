"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { useTeam } from "@/contexts/team-context"
import { fetchWithRetry, safeJsonParse } from "@/lib/fetch-with-retry"
import {
  Plus,
  Search,
  Calendar,
  Award,
  Euro,
  Users,
  BookOpen,
  Clock,
  MapPin,
  LinkIcon,
  Trash2,
  Edit,
  Filter,
} from "lucide-react"
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
import { useToast } from "@/components/ui/use-toast"

interface TrainingCourse {
  id: string
  name: string
  description: string
  category: string
  provider: string
  duration_hours: number
  cost: number
  currency: string
  is_online: boolean
  location: string
  registration_url: string
  is_mandatory: boolean
  recurrence_months: number
  max_participants: number
  is_active: boolean
  team_id: string
  created_at: string
}

interface TrainingEvent {
  id: string
  title: string
  description: string
  training_course_id: string
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  location: string
  meeting_link: string
  is_online: boolean
  max_participants: number
  cost_per_person: number
  currency: string
  status: string
  notes: string
  team_id: string
  training_course?: TrainingCourse
  registrations?: TrainingEventRegistration[]
}

interface TrainingEventRegistration {
  id: string
  training_event_id: string
  team_member_id: string
  status: string
  registered_at: string
  team_member?: { id: string; first_name: string; last_name: string }
}

interface Certification {
  id: string
  name: string
  description: string
  issuing_authority: string
  category: string
  validity_months: number
  is_mandatory: boolean
  reminder_days_before: number
  is_active: boolean
  icon: string
  color: string
  team_id: string
}

interface TeamMemberCertification {
  id: string
  team_member_id: string
  certification_id: string
  issue_date: string
  expiry_date: string
  status: string
  certificate_number: string
  certificate_file_url: string
  notes: string
  certification?: Certification
  team_member?: { id: string; first_name: string; last_name: string }
}

interface TrainingBudget {
  id: string
  year: number
  budget_amount: number
  currency: string
  team_member_id: string
  team_id: string
  notes: string
  team_member?: { id: string; first_name: string; last_name: string }
}

export default function TrainingPageClient() {
  const { currentUser: user } = useUser()
  const { currentPractice } = usePractice()
  const { teamMembers } = useTeam()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("courses")
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  // Data states
  const [courses, setCourses] = useState<TrainingCourse[]>([])
  const [events, setEvents] = useState<TrainingEvent[]>([])
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [teamMemberCertifications, setTeamMemberCertifications] = useState<TeamMemberCertification[]>([])
  const [budgets, setBudgets] = useState<TrainingBudget[]>([])

  // Dialog states
  const [showCourseDialog, setShowCourseDialog] = useState(false)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [showCertificationDialog, setShowCertificationDialog] = useState(false)
  const [editingCourse, setEditingCourse] = useState<TrainingCourse | null>(null)
  const [editingEvent, setEditingEvent] = useState<TrainingEvent | null>(null)
  const [editingCertification, setEditingCertification] = useState<Certification | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [itemToDelete, setItemToDelete] = useState<{
    type: "course" | "event" | "certification"
    id: string
    name: string
  } | null>(null)

  // Form states
  const [courseForm, setCourseForm] = useState({
    name: "",
    description: "",
    category: "fachlich",
    provider: "",
    duration_hours: 0,
    cost: 0,
    currency: "EUR",
    is_online: false,
    location: "",
    registration_url: "",
    is_mandatory: false,
    recurrence_months: 0,
    max_participants: 0,
  })

  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    training_course_id: "",
    start_date: "",
    end_date: "",
    start_time: "09:00",
    end_time: "17:00",
    location: "",
    meeting_link: "",
    is_online: false,
    max_participants: 20,
    cost_per_person: 0,
    currency: "EUR",
    status: "geplant",
    notes: "",
    team_id: "",
  })

  const [certificationForm, setCertificationForm] = useState({
    name: "",
    description: "",
    issuing_authority: "",
    category: "pflicht",
    validity_months: 12,
    is_mandatory: false,
    reminder_days_before: 30,
    icon: "award",
    color: "blue",
  })

  const practiceId = currentPractice?.id

  const fetchData = useCallback(async () => {
    if (!practiceId) return
    setIsLoading(true)

    try {
      // Fetch sequentially with delays to avoid rate limiting
      const coursesRes = await fetchWithRetry(`/api/practices/${practiceId}/training/courses`)
      const coursesData = await safeJsonParse(coursesRes)
      setCourses(coursesData?.courses || [])

      await new Promise((resolve) => setTimeout(resolve, 100))

      const eventsRes = await fetchWithRetry(`/api/practices/${practiceId}/training/events`)
      const eventsData = await safeJsonParse(eventsRes)
      setEvents(eventsData?.events || [])

      await new Promise((resolve) => setTimeout(resolve, 100))

      const certificationsRes = await fetchWithRetry(`/api/practices/${practiceId}/training/certifications`)
      const certificationsData = await safeJsonParse(certificationsRes)
      setCertifications(certificationsData?.certifications || [])

      await new Promise((resolve) => setTimeout(resolve, 100))

      const teamCertsRes = await fetchWithRetry(`/api/practices/${practiceId}/training/team-member-certifications`)
      const teamCertsData = await safeJsonParse(teamCertsRes)
      setTeamMemberCertifications(teamCertsData?.team_member_certifications || [])

      await new Promise((resolve) => setTimeout(resolve, 100))

      const budgetsRes = await fetchWithRetry(`/api/practices/${practiceId}/training/budgets`)
      const budgetsData = await safeJsonParse(budgetsRes)
      setBudgets(budgetsData?.budgets || [])
    } catch (error) {
      console.error("[v0] Error fetching training data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [practiceId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handlers
  const handleSaveCourse = async () => {
    if (!practiceId || !courseForm.name) return
    setIsSaving(true)

    try {
      const url = editingCourse
        ? `/api/practices/${practiceId}/training/courses/${editingCourse.id}`
        : `/api/practices/${practiceId}/training/courses`

      const response = await fetch(url, {
        method: editingCourse ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseForm),
      })

      if (response.ok) {
        const data = await response.json()
        if (editingCourse) {
          setCourses((prev) => prev.map((c) => (c.id === editingCourse.id ? data.course : c)))
        } else {
          setCourses((prev) => [...prev, data.course])
        }
        setShowCourseDialog(false)
        resetCourseForm()
      }
    } catch (error) {
      console.error("[v0] Error saving course:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveEvent = async () => {
    if (!practiceId || !eventForm.title) return
    setIsSaving(true)

    try {
      const url = editingEvent
        ? `/api/practices/${practiceId}/training/events/${editingEvent.id}`
        : `/api/practices/${practiceId}/training/events`

      const response = await fetch(url, {
        method: editingEvent ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventForm),
      })

      if (response.ok) {
        const data = await response.json()
        if (editingEvent) {
          setEvents((prev) => prev.map((e) => (e.id === editingEvent.id ? data.event : e)))
        } else {
          setEvents((prev) => [...prev, data.event])
        }
        setShowEventDialog(false)
        resetEventForm()
      }
    } catch (error) {
      console.error("[v0] Error saving event:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveCertification = async () => {
    if (!practiceId || !certificationForm.name) return
    setIsSaving(true)

    try {
      const url = editingCertification
        ? `/api/practices/${practiceId}/training/certifications/${editingCertification.id}`
        : `/api/practices/${practiceId}/training/certifications`

      const response = await fetch(url, {
        method: editingCertification ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(certificationForm),
      })

      if (response.ok) {
        const data = await response.json()
        if (editingCertification) {
          setCertifications((prev) => prev.map((c) => (c.id === editingCertification.id ? data.certification : c)))
        } else {
          setCertifications((prev) => [...prev, data.certification])
        }
        setShowCertificationDialog(false)
        resetCertificationForm()
      }
    } catch (error) {
      console.error("[v0] Error saving certification:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCourse = async (id: string, name: string) => {
    setItemToDelete({ type: "course", id, name })
  }

  const handleDeleteEvent = async (id: string, name: string) => {
    setItemToDelete({ type: "event", id, name })
  }

  const handleDeleteCertification = async (id: string, name: string) => {
    setItemToDelete({ type: "certification", id, name })
  }

  const confirmDeleteItem = async () => {
    if (!practiceId || !itemToDelete) return

    try {
      if (itemToDelete.type === "course") {
        setCourses((prev) => prev.filter((c) => c.id !== itemToDelete.id))
        await fetch(`/api/practices/${practiceId}/training/courses/${itemToDelete.id}`, { method: "DELETE" })
      } else if (itemToDelete.type === "event") {
        setEvents((prev) => prev.filter((e) => e.id !== itemToDelete.id))
        await fetch(`/api/practices/${practiceId}/training/events/${itemToDelete.id}`, { method: "DELETE" })
      } else if (itemToDelete.type === "certification") {
        setCertifications((prev) => prev.filter((c) => c.id !== itemToDelete.id))
        await fetch(`/api/practices/${practiceId}/training/certifications/${itemToDelete.id}`, { method: "DELETE" })
      }
    } catch (error) {
      console.error("[v0] Error deleting item:", error)
      fetchData()
    } finally {
      setItemToDelete(null)
    }
  }

  const resetCourseForm = () => {
    setCourseForm({
      name: "",
      description: "",
      category: "fachlich",
      provider: "",
      duration_hours: 0,
      cost: 0,
      currency: "EUR",
      is_online: false,
      location: "",
      registration_url: "",
      is_mandatory: false,
      recurrence_months: 0,
      max_participants: 0,
    })
    setEditingCourse(null)
  }

  const resetEventForm = () => {
    setEventForm({
      title: "",
      description: "",
      training_course_id: "",
      start_date: "",
      end_date: "",
      start_time: "09:00",
      end_time: "17:00",
      location: "",
      meeting_link: "",
      is_online: false,
      max_participants: 20,
      cost_per_person: 0,
      currency: "EUR",
      status: "geplant",
      notes: "",
      team_id: "",
    })
    setEditingEvent(null)
  }

  const resetCertificationForm = () => {
    setCertificationForm({
      name: "",
      description: "",
      issuing_authority: "",
      category: "pflicht",
      validity_months: 12,
      is_mandatory: false,
      reminder_days_before: 30,
      icon: "award",
      color: "blue",
    })
    setEditingCertification(null)
  }

  const openEditCourse = (course: TrainingCourse) => {
    setCourseForm({
      name: course.name,
      description: course.description || "",
      category: course.category || "fachlich",
      provider: course.provider || "",
      duration_hours: course.duration_hours || 0,
      cost: course.cost || 0,
      currency: course.currency || "EUR",
      is_online: course.is_online || false,
      location: course.location || "",
      registration_url: course.registration_url || "",
      is_mandatory: course.is_mandatory || false,
      recurrence_months: course.recurrence_months || 0,
      max_participants: course.max_participants || 0,
    })
    setEditingCourse(course)
    setShowCourseDialog(true)
  }

  const openEditEvent = (event: TrainingEvent) => {
    setEventForm({
      title: event.title,
      description: event.description || "",
      training_course_id: event.training_course_id || "",
      start_date: event.start_date || "",
      end_date: event.end_date || "",
      start_time: event.start_time || "09:00",
      end_time: event.end_time || "17:00",
      location: event.location || "",
      meeting_link: event.meeting_link || "",
      is_online: event.is_online || false,
      max_participants: event.max_participants || 20,
      cost_per_person: event.cost_per_person || 0,
      currency: event.currency || "EUR",
      status: event.status || "geplant",
      notes: event.notes || "",
      team_id: event.team_id || "",
    })
    setEditingEvent(event)
    setShowEventDialog(true)
  }

  const openEditCertification = (cert: Certification) => {
    setCertificationForm({
      name: cert.name,
      description: cert.description || "",
      issuing_authority: cert.issuing_authority || "",
      category: cert.category || "pflicht",
      validity_months: cert.validity_months || 12,
      is_mandatory: cert.is_mandatory || false,
      reminder_days_before: cert.reminder_days_before || 30,
      icon: cert.icon || "award",
      color: cert.color || "blue",
    })
    setEditingCertification(cert)
    setShowCertificationDialog(true)
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

  const courseCategories = [
    { value: "fachlich", label: "Fachlich" },
    { value: "software", label: "Software" },
    { value: "kommunikation", label: "Kommunikation" },
    { value: "fuehrung", label: "Führung" },
    { value: "compliance", label: "Compliance" },
    { value: "sicherheit", label: "Sicherheit" },
    { value: "sonstiges", label: "Sonstiges" },
  ]

  if (!user || !currentPractice) {
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

  if (isLoading) {
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <TabsList className="grid w-full grid-cols-4">
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
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
                  {courseCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                resetCourseForm()
                setShowCourseDialog(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Neuer Kurs
            </Button>
          </div>

          {filteredCourses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Keine Kurse gefunden</p>
                <p className="text-sm text-muted-foreground mb-4">Erstellen Sie Ihren ersten Fortbildungskurs</p>
                <Button
                  onClick={() => {
                    resetCourseForm()
                    setShowCourseDialog(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Kurs erstellen
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{course.name}</CardTitle>
                        <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                      </div>
                      <Badge variant={course.is_mandatory ? "destructive" : "secondary"}>
                        {course.is_mandatory ? "Pflicht" : "Optional"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{course.duration_hours || 0} Stunden</span>
                      </div>
                      {course.provider && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{course.provider}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {course.is_online ? (
                          <>
                            <LinkIcon className="h-4 w-4" />
                            <span>Online</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4" />
                            <span>{course.location || "Vor Ort"}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Euro className="h-4 w-4" />
                        <span>
                          {(course.cost || 0).toLocaleString("de-DE")} {course.currency || "EUR"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      <Button variant="outline" size="sm" onClick={() => openEditCourse(course)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Bearbeiten
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive bg-transparent"
                        onClick={() => handleDeleteCourse(course.id, course.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                resetEventForm()
                setShowEventDialog(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Neues Event
            </Button>
          </div>

          {filteredEvents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Keine Events gefunden</p>
                <p className="text-sm text-muted-foreground mb-4">Planen Sie Ihre erste Schulungsveranstaltung</p>
                <Button
                  onClick={() => {
                    resetEventForm()
                    setShowEventDialog(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Event erstellen
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <Card key={event.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${event.is_online ? "bg-blue-100" : "bg-green-100"}`}>
                        {event.is_online ? (
                          <LinkIcon className={`h-6 w-6 ${event.is_online ? "text-blue-600" : "text-green-600"}`} />
                        ) : (
                          <MapPin className="h-6 w-6 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.start_date && new Date(event.start_date).toLocaleDateString("de-DE")}
                          {event.start_time && ` um ${event.start_time}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {event.location || event.meeting_link || "Kein Ort angegeben"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={
                          event.status === "abgeschlossen"
                            ? "default"
                            : event.status === "abgesagt"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {event.status || "Geplant"}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditEvent(event)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive bg-transparent"
                          onClick={() => handleDeleteEvent(event.id, event.title)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                resetCertificationForm()
                setShowCertificationDialog(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Neue Zertifizierung
            </Button>
          </div>

          {filteredCertifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Keine Zertifizierungen gefunden</p>
                <p className="text-sm text-muted-foreground mb-4">Definieren Sie erforderliche Zertifizierungen</p>
                <Button
                  onClick={() => {
                    resetCertificationForm()
                    setShowCertificationDialog(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Zertifizierung erstellen
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCertifications.map((cert) => (
                <Card key={cert.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-${cert.color || "blue"}-100`}>
                          <Award className={`h-5 w-5 text-${cert.color || "blue"}-600`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{cert.name}</CardTitle>
                          <CardDescription>{cert.issuing_authority}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={cert.is_mandatory ? "destructive" : "secondary"}>
                        {cert.is_mandatory ? "Pflicht" : "Optional"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{cert.description}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Gültigkeit:</span>
                        <span>{cert.validity_months || 12} Monate</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Erinnerung:</span>
                        <span>{cert.reminder_days_before || 30} Tage vorher</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      <Button variant="outline" size="sm" onClick={() => openEditCertification(cert)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Bearbeiten
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive bg-transparent"
                        onClick={() => handleDeleteCertification(cert.id, cert.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Budgets Tab */}
        <TabsContent value="budgets" className="space-y-4">
          {budgets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Euro className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Keine Budgets gefunden</p>
                <p className="text-sm text-muted-foreground">Budgets werden über die API verwaltet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {budgets.map((budget) => (
                <Card key={budget.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Euro className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">Budget {budget.year}</p>
                          {budget.team_member && (
                            <p className="text-sm text-muted-foreground">
                              {budget.team_member.first_name} {budget.team_member.last_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {(budget.budget_amount || 0).toLocaleString("de-DE")} {budget.currency || "EUR"}
                    </div>
                    {budget.notes && <p className="text-sm text-muted-foreground mt-2">{budget.notes}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Course Dialog */}
      <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Kurs bearbeiten" : "Neuer Kurs"}</DialogTitle>
            <DialogDescription>
              {editingCourse ? "Bearbeiten Sie die Kursdetails" : "Erstellen Sie einen neuen Fortbildungskurs"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  placeholder="Kursname"
                />
              </div>
              <div className="space-y-2">
                <Label>Kategorie</Label>
                <Select
                  value={courseForm.category}
                  onValueChange={(v) => setCourseForm({ ...courseForm, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {courseCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                placeholder="Kursbeschreibung"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Anbieter</Label>
                <Input
                  value={courseForm.provider}
                  onChange={(e) => setCourseForm({ ...courseForm, provider: e.target.value })}
                  placeholder="Schulungsanbieter"
                />
              </div>
              <div className="space-y-2">
                <Label>Dauer (Stunden)</Label>
                <Input
                  type="number"
                  value={courseForm.duration_hours}
                  onChange={(e) => setCourseForm({ ...courseForm, duration_hours: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kosten</Label>
                <Input
                  type="number"
                  value={courseForm.cost}
                  onChange={(e) => setCourseForm({ ...courseForm, cost: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max. Teilnehmer</Label>
                <Input
                  type="number"
                  value={courseForm.max_participants}
                  onChange={(e) => setCourseForm({ ...courseForm, max_participants: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={courseForm.is_online}
                  onCheckedChange={(checked) => setCourseForm({ ...courseForm, is_online: checked })}
                />
                <Label>Online-Kurs</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={courseForm.is_mandatory}
                  onCheckedChange={(checked) => setCourseForm({ ...courseForm, is_mandatory: checked })}
                />
                <Label>Pflichtschulung</Label>
              </div>
            </div>

            {!courseForm.is_online && (
              <div className="space-y-2">
                <Label>Ort</Label>
                <Input
                  value={courseForm.location}
                  onChange={(e) => setCourseForm({ ...courseForm, location: e.target.value })}
                  placeholder="Veranstaltungsort"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Anmelde-URL</Label>
              <Input
                value={courseForm.registration_url}
                onChange={(e) => setCourseForm({ ...courseForm, registration_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCourseDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveCourse} disabled={isSaving || !courseForm.name}>
              {isSaving ? "Speichern..." : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Event bearbeiten" : "Neues Event"}</DialogTitle>
            <DialogDescription>
              {editingEvent ? "Bearbeiten Sie die Eventdetails" : "Planen Sie eine neue Schulungsveranstaltung"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Titel *</Label>
                <Input
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="Eventtitel"
                />
              </div>
              <div className="space-y-2">
                <Label>Kurs</Label>
                <Select
                  value={eventForm.training_course_id}
                  onValueChange={(v) => setEventForm({ ...eventForm, training_course_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kurs auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Kein Kurs</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Textarea
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="Eventbeschreibung"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Startdatum</Label>
                <Input
                  type="date"
                  value={eventForm.start_date}
                  onChange={(e) => setEventForm({ ...eventForm, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Enddatum</Label>
                <Input
                  type="date"
                  value={eventForm.end_date}
                  onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Startzeit</Label>
                <Input
                  type="time"
                  value={eventForm.start_time}
                  onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Endzeit</Label>
                <Input
                  type="time"
                  value={eventForm.end_time}
                  onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={eventForm.is_online}
                onCheckedChange={(checked) => setEventForm({ ...eventForm, is_online: checked })}
              />
              <Label>Online-Event</Label>
            </div>

            {eventForm.is_online ? (
              <div className="space-y-2">
                <Label>Meeting-Link</Label>
                <Input
                  value={eventForm.meeting_link}
                  onChange={(e) => setEventForm({ ...eventForm, meeting_link: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Ort</Label>
                <Input
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  placeholder="Veranstaltungsort"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max. Teilnehmer</Label>
                <Input
                  type="number"
                  value={eventForm.max_participants}
                  onChange={(e) => setEventForm({ ...eventForm, max_participants: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Kosten pro Person</Label>
                <Input
                  type="number"
                  value={eventForm.cost_per_person}
                  onChange={(e) => setEventForm({ ...eventForm, cost_per_person: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={eventForm.status} onValueChange={(v) => setEventForm({ ...eventForm, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geplant">Geplant</SelectItem>
                  <SelectItem value="bestaetigt">Bestätigt</SelectItem>
                  <SelectItem value="laufend">Laufend</SelectItem>
                  <SelectItem value="abgeschlossen">Abgeschlossen</SelectItem>
                  <SelectItem value="abgesagt">Abgesagt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveEvent} disabled={isSaving || !eventForm.title}>
              {isSaving ? "Speichern..." : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Certification Dialog */}
      <Dialog open={showCertificationDialog} onOpenChange={setShowCertificationDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCertification ? "Zertifizierung bearbeiten" : "Neue Zertifizierung"}</DialogTitle>
            <DialogDescription>
              {editingCertification
                ? "Bearbeiten Sie die Zertifizierungsdetails"
                : "Definieren Sie eine neue Zertifizierung"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={certificationForm.name}
                onChange={(e) => setCertificationForm({ ...certificationForm, name: e.target.value })}
                placeholder="Zertifizierungsname"
              />
            </div>

            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Textarea
                value={certificationForm.description}
                onChange={(e) => setCertificationForm({ ...certificationForm, description: e.target.value })}
                placeholder="Beschreibung"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Ausstellende Behörde</Label>
              <Input
                value={certificationForm.issuing_authority}
                onChange={(e) => setCertificationForm({ ...certificationForm, issuing_authority: e.target.value })}
                placeholder="z.B. Ärztekammer, TÜV"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gültigkeit (Monate)</Label>
                <Input
                  type="number"
                  value={certificationForm.validity_months}
                  onChange={(e) =>
                    setCertificationForm({ ...certificationForm, validity_months: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Erinnerung (Tage vorher)</Label>
                <Input
                  type="number"
                  value={certificationForm.reminder_days_before}
                  onChange={(e) =>
                    setCertificationForm({ ...certificationForm, reminder_days_before: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={certificationForm.is_mandatory}
                onCheckedChange={(checked) => setCertificationForm({ ...certificationForm, is_mandatory: checked })}
              />
              <Label>Pflicht-Zertifizierung</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCertificationDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveCertification} disabled={isSaving || !certificationForm.name}>
              {isSaving ? "Speichern..." : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add AlertDialog before the closing tag of the component (before final </AppLayout>) */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {itemToDelete?.type === "course" ? "Kurs" : itemToDelete?.type === "event" ? "Event" : "Zertifizierung"}{" "}
              löschen?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie "{itemToDelete?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
