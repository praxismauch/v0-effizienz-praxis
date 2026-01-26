"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchWithRetry, safeJsonParse } from "@/lib/fetch-with-retry"
import type {
  TrainingCourse,
  TrainingEvent,
  Certification,
  TeamMemberCertification,
  TrainingBudget,
  CourseFormState,
  EventFormState,
  CertificationFormState,
} from "../types"
import {
  INITIAL_COURSE_FORM,
  INITIAL_EVENT_FORM,
  INITIAL_CERTIFICATION_FORM,
} from "../types"

interface UseTrainingProps {
  practiceId: string | undefined
}

export function useTraining({ practiceId }: UseTrainingProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

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

  // Form states
  const [courseForm, setCourseForm] = useState<CourseFormState>(INITIAL_COURSE_FORM)
  const [eventForm, setEventForm] = useState<EventFormState>(INITIAL_EVENT_FORM)
  const [certificationForm, setCertificationForm] = useState<CertificationFormState>(INITIAL_CERTIFICATION_FORM)

  const fetchData = useCallback(async () => {
    if (!practiceId) return
    setIsLoading(true)

    try {
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
      console.error("Error fetching training data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [practiceId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Reset form functions
  const resetCourseForm = () => {
    setCourseForm(INITIAL_COURSE_FORM)
    setEditingCourse(null)
  }

  const resetEventForm = () => {
    setEventForm(INITIAL_EVENT_FORM)
    setEditingEvent(null)
  }

  const resetCertificationForm = () => {
    setCertificationForm(INITIAL_CERTIFICATION_FORM)
    setEditingCertification(null)
  }

  // Save handlers
  const saveCourse = async (): Promise<boolean> => {
    if (!practiceId || !courseForm.name) return false
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
        return true
      }
      return false
    } catch (error) {
      console.error("Error saving course:", error)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const saveEvent = async (): Promise<boolean> => {
    if (!practiceId || !eventForm.title) return false
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
        return true
      }
      return false
    } catch (error) {
      console.error("Error saving event:", error)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const saveCertification = async (): Promise<boolean> => {
    if (!practiceId || !certificationForm.name) return false
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
        return true
      }
      return false
    } catch (error) {
      console.error("Error saving certification:", error)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  // Delete handlers
  const deleteCourse = async (id: string): Promise<boolean> => {
    if (!practiceId) return false
    try {
      setCourses((prev) => prev.filter((c) => c.id !== id))
      await fetch(`/api/practices/${practiceId}/training/courses/${id}`, { method: "DELETE" })
      return true
    } catch (error) {
      console.error("Error deleting course:", error)
      fetchData()
      return false
    }
  }

  const deleteEvent = async (id: string): Promise<boolean> => {
    if (!practiceId) return false
    try {
      setEvents((prev) => prev.filter((e) => e.id !== id))
      await fetch(`/api/practices/${practiceId}/training/events/${id}`, { method: "DELETE" })
      return true
    } catch (error) {
      console.error("Error deleting event:", error)
      fetchData()
      return false
    }
  }

  const deleteCertification = async (id: string): Promise<boolean> => {
    if (!practiceId) return false
    try {
      setCertifications((prev) => prev.filter((c) => c.id !== id))
      await fetch(`/api/practices/${practiceId}/training/certifications/${id}`, { method: "DELETE" })
      return true
    } catch (error) {
      console.error("Error deleting certification:", error)
      fetchData()
      return false
    }
  }

  // Edit openers
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

  // Computed stats
  const totalBudget = budgets.reduce((sum, b) => sum + (b.budget_amount || 0), 0)
  const upcomingEvents = events.filter((e) => new Date(e.start_date) > new Date()).length
  const expiringCerts = teamMemberCertifications.filter((c) => {
    if (!c.expiry_date) return false
    const daysUntilExpiry = Math.ceil(
      (new Date(c.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
    )
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }).length

  return {
    // Data
    courses,
    events,
    certifications,
    teamMemberCertifications,
    budgets,

    // State
    isLoading,
    isSaving,

    // Dialog states
    showCourseDialog,
    showEventDialog,
    showCertificationDialog,
    setShowCourseDialog,
    setShowEventDialog,
    setShowCertificationDialog,

    // Editing
    editingCourse,
    editingEvent,
    editingCertification,

    // Forms
    courseForm,
    eventForm,
    certificationForm,
    setCourseForm,
    setEventForm,
    setCertificationForm,

    // Actions
    fetchData,
    saveCourse,
    saveEvent,
    saveCertification,
    deleteCourse,
    deleteEvent,
    deleteCertification,
    openEditCourse,
    openEditEvent,
    openEditCertification,
    resetCourseForm,
    resetEventForm,
    resetCertificationForm,

    // Stats
    totalBudget,
    upcomingEvents,
    expiringCerts,
  }
}
