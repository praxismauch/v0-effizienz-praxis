"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import type { TeamMember, ShiftType, Shift, Availability, SwapRequest, Violation, DienstplanStats } from "../types"
import type { HolidayRequest, SickLeave } from "@/app/team/types"

interface UseDienstplanDataParams {
  initialData: {
    teamMembers: any[]
    shiftTypes: any[]
    schedules: any[]
    availability: any[]
    swapRequests: any[]
    holidayRequests: any[]
    sickLeaves: any[]
  }
  initialWeek: Date
  practiceId: string
}

export function useDienstplanData({ initialData, initialWeek, practiceId }: UseDienstplanDataParams) {
  const { toast } = useToast()
  const router = useRouter()

  const safeInitialData = initialData || {
    teamMembers: [], shiftTypes: [], schedules: [], availability: [],
    swapRequests: [], holidayRequests: [], sickLeaves: [],
  }

  const [currentWeek, setCurrentWeek] = useState(() => {
    if (!initialWeek || isNaN(new Date(initialWeek).getTime())) {
      return startOfWeek(new Date(), { weekStartsOn: 1 })
    }
    return initialWeek
  })
  const [isLoading, setIsLoading] = useState(false)
  const [plannerDays, setPlannerDays] = useState(5)

  // Data state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(Array.isArray(safeInitialData.teamMembers) ? safeInitialData.teamMembers : [])
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>(Array.isArray(safeInitialData.shiftTypes) ? safeInitialData.shiftTypes : [])
  const [schedules, setSchedules] = useState<Shift[]>(Array.isArray(safeInitialData.schedules) ? safeInitialData.schedules : [])
  const [availability, setAvailability] = useState<Availability[]>(Array.isArray(safeInitialData.availability) ? safeInitialData.availability : [])
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>(Array.isArray(safeInitialData.swapRequests) ? safeInitialData.swapRequests : [])
  const [holidayRequests, setHolidayRequests] = useState<HolidayRequest[]>(Array.isArray(safeInitialData.holidayRequests) ? safeInitialData.holidayRequests : [])
  const [sickLeaves, setSickLeaves] = useState<SickLeave[]>(Array.isArray(safeInitialData.sickLeaves) ? safeInitialData.sickLeaves : [])
  const [violations] = useState<Violation[]>([])

  // Load planner days setting
  useEffect(() => {
    if (!practiceId) return
    const loadPlannerDays = async () => {
      try {
        const response = await fetch(`/api/practices/${practiceId}/settings`)
        if (response.ok) {
          const data = await response.json()
          const days = data?.settings?.system_settings?.dienstplan?.plannerDays
          if (days && [5, 6, 7].includes(days)) setPlannerDays(days)
        }
      } catch {}
    }
    loadPlannerDays()
  }, [practiceId])

  const weekDays = useMemo(() => {
    if (!currentWeek || isNaN(new Date(currentWeek).getTime())) {
      const fallbackWeek = startOfWeek(new Date(), { weekStartsOn: 1 })
      return Array.from({ length: plannerDays }, (_, i) => addDays(fallbackWeek, i))
    }
    return Array.from({ length: plannerDays }, (_, i) => addDays(currentWeek, i))
  }, [currentWeek, plannerDays])

  const stats: DienstplanStats = useMemo(() => {
    const pendingSwaps = swapRequests.filter((r) => r.status === "pending").length
    const activeViolations = violations.filter((v) => !v.resolved).length
    const totalShifts = schedules.length
    const coveredShifts = schedules.filter((s) => s.status === "confirmed" || s.status === "scheduled").length
    return {
      pendingSwaps, activeViolations, totalShifts, coveredShifts,
      coverageRate: totalShifts > 0 ? Math.round((coveredShifts / totalShifts) * 100) : 0,
    }
  }, [swapRequests, violations, schedules])

  const fetchData = useCallback(async () => {
    const weekStart = format(currentWeek, "yyyy-MM-dd")
    const weekEnd = format(endOfWeek(currentWeek, { weekStartsOn: 1 }), "yyyy-MM-dd")
    try {
      const [teamRes, shiftTypesRes, schedulesRes, availabilityRes, swapRes, holidaysRes, sickLeavesRes] = await Promise.all([
        fetch(`/api/practices/${practiceId}/team-members`, { cache: "no-store" }),
        fetch(`/api/practices/${practiceId}/dienstplan/shift-types`, { cache: "no-store" }),
        fetch(`/api/practices/${practiceId}/dienstplan/schedules?start=${weekStart}&end=${weekEnd}`, { cache: "no-store" }),
        fetch(`/api/practices/${practiceId}/dienstplan/availability`, { cache: "no-store" }),
        fetch(`/api/practices/${practiceId}/dienstplan/swap-requests?status=pending`, { cache: "no-store" }),
        fetch(`/api/practices/${practiceId}/holiday-requests`, { cache: "no-store" }),
        fetch(`/api/practices/${practiceId}/sick-leaves`, { cache: "no-store" }),
      ])
      if (teamRes.ok) { const d = await teamRes.json(); setTeamMembers(() => Array.isArray(d.teamMembers) ? d.teamMembers : []) }
      if (shiftTypesRes.ok) { const d = await shiftTypesRes.json(); setShiftTypes(() => Array.isArray(d.shiftTypes) ? d.shiftTypes : []) }
      if (schedulesRes.ok) { const d = await schedulesRes.json(); setSchedules(() => Array.isArray(d.schedules) ? d.schedules : []) }
      if (availabilityRes.ok) { const d = await availabilityRes.json(); setAvailability(() => Array.isArray(d.availability) ? d.availability : []) }
      if (swapRes.ok) { const d = await swapRes.json(); setSwapRequests(() => Array.isArray(d.swapRequests) ? d.swapRequests : []) }
      if (holidaysRes.ok) { const d = await holidaysRes.json(); setHolidayRequests(() => Array.isArray(d.holidayRequests) ? d.holidayRequests : []) }
      if (sickLeavesRes.ok) { const d = await sickLeavesRes.json(); setSickLeaves(() => Array.isArray(d.sickLeaves) ? d.sickLeaves : []) }
    } catch (error) {
      console.error("Error fetching dienstplan data:", error)
      toast({ title: "Fehler", description: "Daten konnten nicht geladen werden", variant: "destructive" })
    }
  }, [practiceId, currentWeek, toast])

  useEffect(() => {
    if (currentWeek.getTime() !== initialWeek.getTime()) {
      setIsLoading(true)
      fetchData().finally(() => setIsLoading(false))
    }
  }, [currentWeek, fetchData, initialWeek])

  // Navigation
  const goToPreviousWeek = () => {
    const w = subWeeks(currentWeek, 1); setCurrentWeek(w); router.push(`/dienstplan?week=${format(w, "yyyy-MM-dd")}`)
  }
  const goToNextWeek = () => {
    const w = addWeeks(currentWeek, 1); setCurrentWeek(w); router.push(`/dienstplan?week=${format(w, "yyyy-MM-dd")}`)
  }
  const goToCurrentWeek = () => {
    const w = startOfWeek(new Date(), { weekStartsOn: 1 }); setCurrentWeek(w); router.push(`/dienstplan?week=${format(w, "yyyy-MM-dd")}`)
  }

  // Handlers
  const handleApproveSwap = async (id: string) => {
    try {
      const res = await fetch(`/api/practices/${practiceId}/dienstplan/swap-requests/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "approved" }),
      })
      if (res.ok) { setSwapRequests(prev => prev.filter(r => r.id !== id)); toast({ title: "Tausch genehmigt" }); await fetchData() }
    } catch { toast({ title: "Fehler", variant: "destructive" }) }
  }

  const handleRejectSwap = async (id: string) => {
    try {
      const res = await fetch(`/api/practices/${practiceId}/dienstplan/swap-requests/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "rejected" }),
      })
      if (res.ok) { setSwapRequests(prev => prev.filter(r => r.id !== id)); toast({ title: "Tausch abgelehnt" }) }
    } catch { toast({ title: "Fehler", variant: "destructive" }) }
  }

  const handleDeleteShiftType = async (id: string) => {
    try {
      const res = await fetch(`/api/practices/${practiceId}/dienstplan/shift-types/${id}`, { method: "DELETE" })
      if (res.ok) { setShiftTypes(prev => prev.filter(st => st.id !== id)); toast({ title: "Schichttyp gelöscht" }) }
    } catch { toast({ title: "Fehler", variant: "destructive" }) }
  }

  const handleSaveShiftType = async (data: Partial<ShiftType>, editingId?: string) => {
    const isEditing = !!editingId
    const url = isEditing
      ? `/api/practices/${practiceId}/dienstplan/shift-types/${editingId}`
      : `/api/practices/${practiceId}/dienstplan/shift-types`
    const res = await fetch(url, { method: isEditing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
    if (res.ok) {
      const savedData = await res.json()
      if (isEditing) setShiftTypes(prev => prev.map(st => st.id === editingId ? { ...st, ...savedData } : st))
      else setShiftTypes(prev => [...prev, savedData])
      toast({ title: isEditing ? "Schichttyp aktualisiert" : "Schichttyp erstellt" })
    } else { throw new Error("Failed to save shift type") }
  }

  const handleHolidayRequestCreated = (request: HolidayRequest) => {
    setHolidayRequests(prev => [request, ...prev]); toast({ title: "Urlaubsantrag erstellt" })
  }
  const handleApproveHolidayRequest = (request: HolidayRequest) => {
    setHolidayRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: "approved" as const } : r)); toast({ title: "Antrag genehmigt" })
  }
  const handleRejectHolidayRequest = (request: HolidayRequest) => {
    setHolidayRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: "rejected" as const } : r)); toast({ title: "Antrag abgelehnt" })
  }
  const handleSickLeaveCreated = (sickLeave: SickLeave) => {
    setSickLeaves(prev => [sickLeave, ...prev]); toast({ title: "Krankmeldung erfasst" })
  }

  return {
    currentWeek, isLoading, weekDays, stats,
    teamMembers, shiftTypes, schedules, setSchedules, availability, swapRequests,
    holidayRequests, sickLeaves,
    fetchData, goToPreviousWeek, goToNextWeek, goToCurrentWeek,
    handleApproveSwap, handleRejectSwap, handleDeleteShiftType, handleSaveShiftType,
    handleHolidayRequestCreated, handleApproveHolidayRequest, handleRejectHolidayRequest,
    handleSickLeaveCreated,
  }
}
