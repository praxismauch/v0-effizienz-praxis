"use client"

import type React from "react"
import {
  Phone,
  ImageIcon,
  Upload,
  Sparkles,
  Clock,
  Coins,
  Settings,
  Calendar,
  Monitor,
  LayoutGrid,
  Mail,
  Home,
  Plus,
  Building2,
  Bell,
  Shield,
  Palette,
  Loader2,
  Key,
  GripVertical,
  UserPlus,
  Save,
  Moon,
  Sun,
  Target,
  ClipboardList,
  FileText,
  Compass,
  Briefcase,
  Wrench,
  DoorOpen,
  Users,
  Network,
  GraduationCap,
} from "lucide-react"

import { useState, useEffect, useRef } from "react"
import { Globe, MapPin, Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { createBrowserClient } from "@/lib/supabase/client"
import { AppLayout } from "@/components/app-layout"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { arrayMove, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { upload } from "@vercel/blob/client"
import { OrgaCategoriesManager } from "@/components/settings/orga-categories-manager"
import WeeklySummarySettings from "@/components/weekly-summary-settings"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TeamRoleOrderSettings } from "@/components/settings/team-role-order-settings"

interface HandbookChapterItem {
  id: string
  name: string
  enabled: boolean
  icon: string
}

const DEFAULT_HANDBOOK_CHAPTERS: HandbookChapterItem[] = [
  { id: "leitbild", name: "Leitbild", enabled: true, icon: "Compass" },
  { id: "ziele", name: "Ziele", enabled: true, icon: "Target" },
  { id: "zustaendigkeiten", name: "Zuständigkeiten", enabled: true, icon: "ClipboardList" },
  { id: "protokolle", name: "Protokolle", enabled: true, icon: "FileText" },
  { id: "arbeitsplaetze", name: "Arbeitsplätze", enabled: true, icon: "Briefcase" },
  { id: "arbeitsmittel", name: "Arbeitsmittel", enabled: true, icon: "Wrench" },
  { id: "raeume", name: "Räume", enabled: true, icon: "DoorOpen" },
  { id: "kontakte", name: "Kontakte", enabled: true, icon: "Users" },
  { id: "organigramm", name: "Organigramm", enabled: true, icon: "Network" },
  { id: "fortbildung", name: "Fortbildung", enabled: true, icon: "GraduationCap" },
]

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Target,
  ClipboardList,
  FileText,
  Compass,
  Briefcase,
  Wrench,
  DoorOpen,
  Users,
  Network,
  GraduationCap,
}

function SortableChapterItem({
  item,
  onToggle,
}: {
  item: HandbookChapterItem
  onToggle: (id: string, enabled: boolean) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const IconComponent = ICON_MAP[item.icon] || FileText

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-background border rounded-lg ${isDragging ? "opacity-50 shadow-lg" : ""}`}
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex items-center gap-3 flex-1">
        <div
          className={`p-2 rounded-md ${item.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
        >
          <IconComponent className="h-4 w-4" />
        </div>
        <span className={`font-medium ${!item.enabled ? "text-muted-foreground" : ""}`}>{item.name}</span>
      </div>
      <Switch checked={item.enabled} onCheckedChange={(checked) => onToggle(item.id, checked)} />
    </div>
  )
}

export default function SettingsPageClient() {
  const { toast } = useToast()
  const { currentUser, loading: userLoading } = useUser()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const [activeTab, setActiveTab] = useState("practice")
  const [saving, setSaving] = useState(false)
  const [inviteExternalDialogOpen, setInviteExternalDialogOpen] = useState(false)

  const [handbookChapters, setHandbookChapters] = useState<HandbookChapterItem[]>(DEFAULT_HANDBOOK_CHAPTERS)
  const [savingHandbook, setSavingHandbook] = useState(false)

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      expiryDays: 90,
    },
    sessionPolicy: {
      timeoutMinutes: 30,
      maxConcurrentSessions: 3,
      requireMfa: false,
    },
  })
  const [savingSecurity, setSavingSecurity] = useState(false)

  const [homeofficePolicies, setHomeofficePolicies] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [loadingPolicies, setLoadingPolicies] = useState(false)
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<any | null>(null)
  const [deletingPolicyId, setDeletingPolicyId] = useState<string | null>(null)

  const [policyForm, setPolicyForm] = useState({
    user_id: null as string | null,
    is_allowed: true,
    allowed_days: [] as string[],
    allowed_start_time: "",
    allowed_end_time: "",
    max_days_per_week: 2,
    requires_reason: true,
    requires_location_verification: false,
  })

  const weekDays = [
    { value: "monday", label: "Montag" },
    { value: "tuesday", label: "Dienstag" },
    { value: "wednesday", label: "Mittwoch" },
    { value: "thursday", label: "Donnerstag" },
    { value: "friday", label: "Freitag" },
    { value: "saturday", label: "Samstag" },
    { value: "sunday", label: "Sonntag" },
  ]

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const isLoading = userLoading || practiceLoading
  const isAdmin =
    currentUser?.role === "superadmin" || currentUser?.role === "practiceadmin" || currentUser?.role === "admin"

  const [practiceSettings, setPracticeSettings] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    description: "",
    type: "",
    timezone: "Europe/Berlin",
    currency: "EUR",
    language: "de",
    color: "#3b82f6",
    ai_enabled: true,
    logo_url: "",
    google_places_api_key: "", // Added Google Places API Key field
  })

  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [practiceTypes, setPracticeTypes] = useState<{ id: string; name: string }[]>([])

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    taskReminders: true,
    todoDueDateEmail: true,
    appointmentReminders: true,
    weeklyReport: false,
    marketingEmails: false,
  })

  const [appearanceSettings, setAppearanceSettings] = useState({
    darkMode: false,
    language: "de",
    dateFormat: "dd.MM.yyyy",
    timeFormat: "24h",
  })

  const [passwordSettings, setPasswordSettings] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [calendarSettings, setCalendarSettings] = useState({
    defaultView: "week",
    weekStart: "monday",
    workStart: "08:00",
    workEnd: "18:00",
    showWeekends: true,
    showHolidays: true,
    defaultDuration: "30",
  })

  const [practiceSettingsData, setPracticeSettingsData] = useState<any>(null) // To store practice settings fetched initially
  const practiceId = currentPractice?.id // To avoid re-fetching practice ID

  useEffect(() => {
    if (currentPractice) {
      setPracticeSettings({
        name: currentPractice.name || "",
        email: currentPractice.email || "",
        phone: currentPractice.phone || "",
        address: currentPractice.address || "",
        website: currentPractice.website || "",
        description: currentPractice.description || "",
        type: currentPractice.type || "",
        timezone: currentPractice.timezone || "Europe/Berlin",
        currency: currentPractice.currency || "EUR",
        language: currentPractice.language || "de",
        color: currentPractice.color || "#3b82f6",
        ai_enabled: currentPractice.ai_enabled !== false,
        logo_url: currentPractice.logo_url || "",
        google_places_api_key: "", // Initialize empty, will be loaded from settings
      })

      loadGoogleApiKey()
    }
  }, [currentPractice])

  const loadGoogleApiKey = async () => {
    if (!currentPractice?.id) return
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/settings`)
      if (response.ok) {
        const data = await response.json()
        const apiKey = data.settings?.system_settings?.google_places_api_key || ""
        setPracticeSettings((prev) => ({ ...prev, google_places_api_key: apiKey }))
      }
    } catch (error) {
      console.error("Error loading Google API Key:", error)
    }
  }

  useEffect(() => {
    const fetchPracticeTypes = async () => {
      try {
        const response = await fetch("/api/practice-types")
        if (response.ok) {
          const data = await response.json()
          setPracticeTypes(data)
        }
      } catch (error) {
        console.error("Error fetching practice types:", error)
      }
    }
    fetchPracticeTypes()
  }, [])

  useEffect(() => {
    const loadSettings = async () => {
      if (!currentPractice?.id) return

      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/settings`)
        if (response.ok) {
          const data = await response.json()
          setPracticeSettingsData(data) // Store fetched data

          if (data.settings?.handbookChapters) {
            setHandbookChapters(data.handbookChapters)
          }
          if (data.settings?.calendarSettings) {
            setCalendarSettings((prev) => ({
              ...prev,
              ...data.settings.calendarSettings,
            }))
          }

          // Load security settings if available
          if (data.settings?.securitySettings) {
            setSecuritySettings(data.settings.securitySettings)
          }

          // Load notification settings if available
          if (data.settings?.notificationSettings) {
            setNotificationSettings(data.settings.notificationSettings)
          }

          // Load appearance settings if available
          if (data.settings?.appearanceSettings) {
            setAppearanceSettings(data.settings.appearanceSettings)
          }

          // Load Google Places API Key if available
          if (data.settings?.system_settings?.google_places_api_key) {
            setPracticeSettings((prev) => ({
              ...prev,
              google_places_api_key: data.settings.system_settings.google_places_api_key,
            }))
          }
        }
      } catch (error) {
        console.error("Error loading settings:", error)
      }
    }

    loadSettings()
  }, [currentPractice?.id])

  useEffect(() => {
    const loadHomeofficePolicies = async () => {
      if (!currentPractice?.id) return

      setLoadingPolicies(true)
      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/homeoffice-policies`)
        if (response.ok) {
          const data = await response.json()
          setHomeofficePolicies(data.policies || [])
        }
      } catch (error) {
        console.error("[v0] Error loading homeoffice policies:", error)
      } finally {
        setLoadingPolicies(false)
      }
    }

    const loadTeamMembers = async () => {
      if (!currentPractice?.id) return

      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/team-members`)
        if (response.ok) {
          const data = await response.json()
          setTeamMembers(data.teamMembers || [])
        }
      } catch (error) {
        console.error("[v0] Error loading team members:", error)
      }
    }

    if (activeTab === "homeoffice") {
      loadHomeofficePolicies()
      loadTeamMembers()
    }
  }, [currentPractice?.id, activeTab])

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !currentPractice?.id) return

    setIsUploadingLogo(true)
    try {
      const blob = await upload(
        `practices/${currentPractice.id}/logo-${Date.now()}.${file.name.split(".").pop()}`,
        file,
        {
          access: "public",
          handleUploadUrl: "/api/blob/upload",
        },
      )

      setPracticeSettings((prev) => ({ ...prev, logo_url: blob.url }))

      // Save immediately to database
      const supabase = createBrowserClient()
      await supabase.from("practices").update({ logo_url: blob.url }).eq("id", currentPractice.id)

      toast({
        title: "Logo hochgeladen",
        description: "Das Praxis-Logo wurde erfolgreich aktualisiert.",
      })
    } catch (error) {
      console.error("Error uploading logo:", error)
      toast({
        title: "Fehler",
        description: "Das Logo konnte nicht hochgeladen werden.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleSavePracticeSettings = async () => {
    if (!currentPractice?.id) return

    setSaving(true)
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase
        .from("practices")
        .update({
          name: practiceSettings.name,
          email: practiceSettings.email,
          phone: practiceSettings.phone,
          address: practiceSettings.address,
          website: practiceSettings.website,
          type: practiceSettings.type,
          timezone: practiceSettings.timezone,
          currency: practiceSettings.currency,
          language: practiceSettings.language,
          color: practiceSettings.color,
          ai_enabled: practiceSettings.ai_enabled,
          logo_url: practiceSettings.logo_url,
        })
        .eq("id", currentPractice.id)

      if (error) throw error

      if (practiceSettings.google_places_api_key !== undefined) {
        await fetch(`/api/practices/${currentPractice.id}/settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_settings: {
              ...practiceSettingsData?.settings?.system_settings,
              google_places_api_key: practiceSettings.google_places_api_key,
            },
          }),
        })
      }

      toast({
        title: "Einstellungen gespeichert",
        description: "Die Praxis-Einstellungen wurden erfolgreich aktualisiert.",
      })
    } catch (error) {
      console.error("Error saving practice settings:", error)
      toast({
        title: "Fehler",
        description: "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setHandbookChapters((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleChapterToggle = (id: string, enabled: boolean) => {
    setHandbookChapters((items) => items.map((item) => (item.id === id ? { ...item, enabled } : item)))
  }

  const handleSaveHandbookSettings = async () => {
    if (!currentPractice?.id) return

    setSavingHandbook(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_settings: {
            handbookChapters,
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to save")

      toast({
        title: "Einstellungen gespeichert",
        description: "Die Wissen-Einstellungen wurden erfolgreich aktualisiert.",
      })
    } catch (error) {
      console.error("Error saving handbook settings:", error)
      toast({
        title: "Fehler",
        description: "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setSavingHandbook(false)
    }
  }

  const handleSaveSecuritySettings = async () => {
    if (!currentPractice?.id) return

    setSavingSecurity(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_settings: {
            securitySettings,
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to save")

      toast({
        title: "Sicherheitseinstellungen gespeichert",
        description: "Die Sicherheitseinstellungen wurden erfolgreich aktualisiert.",
      })
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setSavingSecurity(false)
    }
  }

  const handleSaveNotificationSettings = async () => {
    if (!currentPractice?.id) return

    setSaving(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_settings: {
            notificationSettings,
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to save")

      toast({
        title: "Einstellungen gespeichert",
        description: "Die Benachrichtigungseinstellungen wurden erfolgreich aktualisiert.",
      })
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordSettings.newPassword !== passwordSettings.confirmPassword) {
      toast({
        title: "Fehler",
        description: "Die Passwörter stimmen nicht überein.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.auth.updateUser({
        password: passwordSettings.newPassword,
      })

      if (error) throw error

      toast({
        title: "Passwort geändert",
        description: "Ihr Passwort wurde erfolgreich aktualisiert.",
      })
      setPasswordSettings({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Das Passwort konnte nicht geändert werden.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSavePractice = async () => {
    if (!currentPractice?.id) return

    setSaving(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_settings: {
            timezone: practiceSettings.timezone,
            currency: practiceSettings.currency,
            language: practiceSettings.language,
            dateFormat: appearanceSettings.dateFormat,
            timeFormat: appearanceSettings.timeFormat,
            ai_enabled: practiceSettings.ai_enabled,
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to save")

      toast({
        title: "Einstellungen gespeichert",
        description: "Die allgemeinen Einstellungen wurden erfolgreich aktualisiert.",
      })
    } catch (error) {
      console.error("Error saving practice settings:", error)
      toast({
        title: "Fehler",
        description: "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCalendarSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_settings: {
            ...practiceSettingsData?.settings,
            calendarSettings,
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to save calendar settings")

      toast({
        title: "Gespeichert",
        description: "Kalender-Einstellungen wurden erfolgreich gespeichert.",
      })
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Kalender-Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleOpenPolicyDialog = (policy: any = null) => {
    if (policy) {
      setEditingPolicy(policy)
      setPolicyForm({
        user_id: policy.user_id,
        is_allowed: policy.is_allowed,
        allowed_days: policy.allowed_days || [],
        allowed_start_time: policy.allowed_start_time || "",
        allowed_end_time: policy.allowed_end_time || "",
        max_days_per_week: policy.max_days_per_week || 2,
        requires_reason: policy.requires_reason ?? true,
        requires_location_verification: policy.requires_location_verification ?? false,
      })
    } else {
      setEditingPolicy(null)
      setPolicyForm({
        user_id: null,
        is_allowed: true,
        allowed_days: [],
        allowed_start_time: "",
        allowed_end_time: "",
        max_days_per_week: 2,
        requires_reason: true,
        requires_location_verification: false,
      })
    }
    setPolicyDialogOpen(true)
  }

  const handleSavePolicy = async () => {
    if (!currentPractice?.id) return

    setSaving(true)
    try {
      const url = editingPolicy
        ? `/api/practices/${currentPractice.id}/homeoffice-policies/${editingPolicy.id}`
        : `/api/practices/${currentPractice.id}/homeoffice-policies`

      const method = editingPolicy ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(policyForm),
      })

      if (response.ok) {
        toast({
          title: editingPolicy ? "Policy aktualisiert" : "Policy erstellt",
          description: "Die Homeoffice-Regelung wurde erfolgreich gespeichert.",
        })
        setPolicyDialogOpen(false)
        // Reload policies
        const reloadResponse = await fetch(`/api/practices/${currentPractice.id}/homeoffice-policies`)
        if (reloadResponse.ok) {
          const data = await reloadResponse.json()
          setHomeofficePolicies(data.policies || [])
        }
      } else {
        const error = await response.json()
        toast({
          title: "Fehler",
          description: error.error || "Die Policy konnte nicht gespeichert werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error saving policy:", error)
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePolicy = async (policyId: string) => {
    if (!currentPractice?.id) return

    setDeletingPolicyId(policyId)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/homeoffice-policies/${policyId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Policy gelöscht",
          description: "Die Homeoffice-Regelung wurde entfernt.",
        })
        setHomeofficePolicies((prev) => prev.filter((p) => p.id !== policyId))
      } else {
        toast({
          title: "Fehler",
          description: "Die Policy konnte nicht gelöscht werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error deleting policy:", error)
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten.",
        variant: "destructive",
      })
    } finally {
      setDeletingPolicyId(null)
    }
  }

  const toggleAllowedDay = (day: string) => {
    setPolicyForm((prev) => ({
      ...prev,
      allowed_days: prev.allowed_days.includes(day)
        ? prev.allowed_days.filter((d) => d !== day)
        : [...prev.allowed_days, day],
    }))
  }

  const getUserName = (userId: string | null) => {
    if (!userId) return "Alle Mitarbeiter"
    const member = teamMembers.find((m) => m.id === userId)
    return member ? `${member.first_name} ${member.last_name}` : "Unbekannt"
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  if (!currentUser) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Bitte melden Sie sich an, um die Einstellungen zu sehen.</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6 px-4 md:px-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Einstellungen</h1>
          <p className="text-muted-foreground">Verwalten Sie Ihre Praxis- und System-Einstellungen</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="w-full flex flex-wrap gap-1">
            <TabsTrigger value="practice" className="gap-2 flex-1">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Praxis</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2 flex-1">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">System</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2 flex-1">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Kalender</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2 flex-1">
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Anzeige</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 flex-1">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Benachrichtigungen</span>
            </TabsTrigger>
            <TabsTrigger value="weekly-summary" className="gap-2 flex-1">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Wochen-Report</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 flex-1">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Sicherheit</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="homeoffice" className="gap-2 flex-1">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Homeoffice</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="orga-categories" className="gap-2 flex-1">
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Orga-Kategorien</span>
            </TabsTrigger>
            {/* CHANGE: Add new Team Order tab */}
            {isAdmin && (
              <TabsTrigger value="team-order" className="gap-2 flex-1">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Team-Reihenfolge</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Practice Settings Tab */}
          <TabsContent value="practice" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Logo & Branding
                </CardTitle>
                <CardDescription>Personalisieren Sie das Erscheinungsbild Ihrer Praxis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-2 border-muted">
                      <AvatarImage src={practiceSettings.logo_url || "/placeholder.svg"} alt={practiceSettings.name} />
                      <AvatarFallback className="text-2xl bg-primary/10">
                        {practiceSettings.name?.substring(0, 2).toUpperCase() || "PR"}
                      </AvatarFallback>
                    </Avatar>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" onClick={() => logoInputRef.current?.click()} disabled={isUploadingLogo}>
                      {isUploadingLogo ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Hochladen...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Logo hochladen
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">Empfohlen: Quadratisches Bild, min. 200x200px</p>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="practice-color">Praxisfarbe</Label>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-10 w-10 rounded-md border cursor-pointer"
                        style={{ backgroundColor: practiceSettings.color }}
                        onClick={() => document.getElementById("color-picker")?.click()}
                      />
                      <Input
                        id="color-picker"
                        type="color"
                        value={practiceSettings.color}
                        onChange={(e) => setPracticeSettings((prev) => ({ ...prev, color: e.target.value }))}
                        className="w-20 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={practiceSettings.color}
                        onChange={(e) => setPracticeSettings((prev) => ({ ...prev, color: e.target.value }))}
                        placeholder="#3b82f6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="practice-type">Praxistyp</Label>
                    <Select
                      value={practiceSettings.type}
                      onValueChange={(value) => setPracticeSettings((prev) => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Typ auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {practiceTypes.map((type) => (
                          <SelectItem key={type.id} value={type.name}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isAdmin && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                    Externe Benutzer
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Laden Sie externe Benutzer mit eingeschränkten Rechten ein.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button variant="outline" size="sm" onClick={() => setInviteExternalDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Externen Benutzer einladen
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Praxis-Informationen</CardTitle>
                <CardDescription>Grundlegende Informationen über Ihre Praxis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="practice-name">Praxisname</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="practice-name"
                        className="pl-10"
                        value={practiceSettings.name}
                        onChange={(e) => setPracticeSettings((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Ihre Praxis GmbH"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="practice-email">E-Mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="practice-email"
                        type="email"
                        className="pl-10"
                        value={practiceSettings.email}
                        onChange={(e) => setPracticeSettings((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="praxis@beispiel.de"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="practice-phone">Telefon</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="practice-phone"
                        type="tel"
                        className="pl-10"
                        value={practiceSettings.phone}
                        onChange={(e) => setPracticeSettings((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="+49 123 456789"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="practice-website">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="practice-website"
                        type="url"
                        className="pl-10"
                        value={practiceSettings.website}
                        onChange={(e) => setPracticeSettings((prev) => ({ ...prev, website: e.target.value }))}
                        placeholder="https://ihre-praxis.de"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="practice-address">Adresse</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="practice-address"
                      className="pl-10"
                      value={practiceSettings.address}
                      onChange={(e) => setPracticeSettings((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder="Musterstraße 123, 12345 Berlin"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Regionaleinstellungen
                </CardTitle>
                <CardDescription>Zeitzone, Währung und Spracheinstellungen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="practice-timezone">Zeitzone</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                      <Select
                        value={practiceSettings.timezone}
                        onValueChange={(value) => setPracticeSettings((prev) => ({ ...prev, timezone: value }))}
                      >
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Zeitzone auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Europe/Berlin">Europe/Berlin (MEZ)</SelectItem>
                          <SelectItem value="Europe/Vienna">Europe/Vienna (MEZ)</SelectItem>
                          <SelectItem value="Europe/Zurich">Europe/Zurich (MEZ)</SelectItem>
                          <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="practice-currency">Währung</Label>
                    <div className="relative">
                      <Coins className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                      <Select
                        value={practiceSettings.currency}
                        onValueChange={(value) => setPracticeSettings((prev) => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Währung auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="CHF">CHF (Fr.)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="practice-language">Sprache</Label>
                    <div className="relative">
                      <Languages className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                      <Select
                        value={practiceSettings.language}
                        onValueChange={(value) => setPracticeSettings((prev) => ({ ...prev, language: value }))}
                      >
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Sprache auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="de">Deutsch</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  KI-Funktionen
                </CardTitle>
                <CardDescription>
                  Aktivieren oder deaktivieren Sie KI-gestützte Funktionen für Ihre Praxis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="ai-enabled" className="text-base">
                      KI-Funktionen aktivieren
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Ermöglicht KI-gestützte Analysen, Empfehlungen und automatische Dokumentenverarbeitung
                    </p>
                  </div>
                  <Switch
                    id="ai-enabled"
                    checked={practiceSettings.ai_enabled}
                    onCheckedChange={(checked) => setPracticeSettings((prev) => ({ ...prev, ai_enabled: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSavePracticeSettings} disabled={saving} size="lg" className="w-full md:w-auto">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Speichert...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Alle Änderungen speichern
                </>
              )}
            </Button>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System-Einstellungen
                </CardTitle>
                <CardDescription>Konfigurieren Sie grundlegende Systemeinstellungen für Ihre Praxis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Zeitzone</Label>
                    <Select
                      value={practiceSettings.timezone || "Europe/Berlin"}
                      onValueChange={(value) => setPracticeSettings((prev) => ({ ...prev, timezone: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Zeitzone auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Berlin">Berlin (MEZ/MESZ)</SelectItem>
                        <SelectItem value="Europe/Vienna">Wien (MEZ/MESZ)</SelectItem>
                        <SelectItem value="Europe/Zurich">Zürich (MEZ/MESZ)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Währung</Label>
                    <Select
                      value={practiceSettings.currency || "EUR"}
                      onValueChange={(value) => setPracticeSettings((prev) => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Währung auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                        <SelectItem value="CHF">Schweizer Franken (CHF)</SelectItem>
                        <SelectItem value="USD">US Dollar ($)</SelectItem>
                        <SelectItem value="GBP">Britisches Pfund (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="language">Systemsprache</Label>
                    <Select
                      value={practiceSettings.language || "de"}
                      onValueChange={(value) => setPracticeSettings((prev) => ({ ...prev, language: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sprache auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        KI-Funktionen aktivieren
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Aktivieren Sie KI-gestützte Funktionen wie automatische Vorschläge und Analysen
                      </p>
                    </div>
                    <Switch
                      checked={practiceSettings.ai_enabled !== false}
                      onCheckedChange={(checked) => setPracticeSettings((prev) => ({ ...prev, ai_enabled: checked }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button onClick={handleSavePractice} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Speichern
              </Button>
            </div>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Kalender-Einstellungen
                </CardTitle>
                <CardDescription>Konfigurieren Sie die Kalenderansicht und Standardeinstellungen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Standard-Ansicht</Label>
                    <Select
                      value={calendarSettings.defaultView}
                      onValueChange={(value) => setCalendarSettings((prev) => ({ ...prev, defaultView: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ansicht auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Tagesansicht</SelectItem>
                        <SelectItem value="week">Wochenansicht</SelectItem>
                        <SelectItem value="month">Monatsansicht</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Woche beginnt am</Label>
                    <Select
                      value={calendarSettings.weekStart}
                      onValueChange={(value) => setCalendarSettings((prev) => ({ ...prev, weekStart: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tag auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monday">Montag</SelectItem>
                        <SelectItem value="sunday">Sonntag</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Arbeitsbeginn</Label>
                    <Select
                      value={calendarSettings.workStart}
                      onValueChange={(value) => setCalendarSettings((prev) => ({ ...prev, workStart: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Uhrzeit auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="06:00">06:00 Uhr</SelectItem>
                        <SelectItem value="07:00">07:00 Uhr</SelectItem>
                        <SelectItem value="08:00">08:00 Uhr</SelectItem>
                        <SelectItem value="09:00">09:00 Uhr</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Arbeitsende</Label>
                    <Select
                      value={calendarSettings.workEnd}
                      onValueChange={(value) => setCalendarSettings((prev) => ({ ...prev, workEnd: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Uhrzeit auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="16:00">16:00 Uhr</SelectItem>
                        <SelectItem value="17:00">17:00 Uhr</SelectItem>
                        <SelectItem value="18:00">18:00 Uhr</SelectItem>
                        <SelectItem value="19:00">19:00 Uhr</SelectItem>
                        <SelectItem value="20:00">20:00 Uhr</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Wochenenden anzeigen</Label>
                      <p className="text-sm text-muted-foreground">Samstag und Sonntag im Kalender anzeigen</p>
                    </div>
                    <Switch
                      checked={calendarSettings.showWeekends}
                      onCheckedChange={(checked) => setCalendarSettings((prev) => ({ ...prev, showWeekends: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Feiertage anzeigen</Label>
                      <p className="text-sm text-muted-foreground">Gesetzliche Feiertage automatisch markieren</p>
                    </div>
                    <Switch
                      checked={calendarSettings.showHolidays}
                      onCheckedChange={(checked) => setCalendarSettings((prev) => ({ ...prev, showHolidays: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Standard-Termindauer</Label>
                      <p className="text-sm text-muted-foreground">Standard-Dauer für neue Termine</p>
                    </div>
                    <Select
                      value={calendarSettings.defaultDuration}
                      onValueChange={(value) => setCalendarSettings((prev) => ({ ...prev, defaultDuration: value }))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 Min</SelectItem>
                        <SelectItem value="30">30 Min</SelectItem>
                        <SelectItem value="45">45 Min</SelectItem>
                        <SelectItem value="60">60 Min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button onClick={handleSaveCalendarSettings} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Speichern
              </Button>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Benachrichtigungseinstellungen
                </CardTitle>
                <CardDescription>Verwalten Sie, wie und wann Sie Benachrichtigungen erhalten</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>E-Mail-Benachrichtigungen</Label>
                    <p className="text-sm text-muted-foreground">Erhalten Sie wichtige Updates per E-Mail</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aufgaben-Erinnerungen</Label>
                    <p className="text-sm text-muted-foreground">Erinnerungen für anstehende Aufgaben</p>
                  </div>
                  <Switch
                    checked={notificationSettings.taskReminders}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({ ...prev, taskReminders: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>E-Mail bei Fälligkeit</Label>
                    <p className="text-sm text-muted-foreground">
                      E-Mail erhalten, wenn eine Aufgabe ihr Fälligkeitsdatum erreicht
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.todoDueDateEmail}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({ ...prev, todoDueDateEmail: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Termin-Erinnerungen</Label>
                    <p className="text-sm text-muted-foreground">Erinnerungen für bevorstehende Termine</p>
                  </div>
                  <Switch
                    checked={notificationSettings.appointmentReminders}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({ ...prev, appointmentReminders: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Wöchentlicher Bericht</Label>
                    <p className="text-sm text-muted-foreground">Zusammenfassung der Wochenaktivitäten</p>
                  </div>
                  <Switch
                    checked={notificationSettings.weeklyReport}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({ ...prev, weeklyReport: checked }))
                    }
                  />
                </div>
                <div className="pt-4">
                  <Button onClick={handleSaveNotificationSettings} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Speichert...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Einstellungen speichern
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly-summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Wöchentliche Praxis-Zusammenfassung
                </CardTitle>
                <CardDescription>
                  Erhalten Sie jeden Montag eine professionelle E-Mail mit allen wichtigen Aktivitäten und Kennzahlen
                  Ihrer Praxis
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentPractice?.id && <WeeklySummarySettings practiceId={currentPractice.id} />}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Darstellung
                </CardTitle>
                <CardDescription>Passen Sie das Erscheinungsbild der Anwendung an</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      {appearanceSettings.darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                      Dunkelmodus
                    </Label>
                    <p className="text-sm text-muted-foreground">Wechseln Sie zum dunklen Farbschema</p>
                  </div>
                  <Switch
                    checked={appearanceSettings.darkMode}
                    onCheckedChange={(checked) => setAppearanceSettings((prev) => ({ ...prev, darkMode: checked }))}
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Languages className="h-4 w-4" />
                    Sprache
                  </Label>
                  <Select
                    value={appearanceSettings.language}
                    onValueChange={(value) => setAppearanceSettings((prev) => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Datums- und Zeitformat</Label>
                  <p className="text-sm text-muted-foreground">
                    Das System verwendet das deutsche Format: DD.MM.YYYY und HH:mm (24-Stunden)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Passwort ändern
                </CardTitle>
                <CardDescription>Aktualisieren Sie Ihr Passwort für mehr Sicherheit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Aktuelles Passwort</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={passwordSettings.currentPassword}
                    onChange={(e) => setPasswordSettings((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Neues Passwort</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordSettings.newPassword}
                    onChange={(e) => setPasswordSettings((prev) => ({ ...prev, newPassword: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Passwort bestätigen</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordSettings.confirmPassword}
                    onChange={(e) => setPasswordSettings((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={!passwordSettings.currentPassword || !passwordSettings.newPassword || saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Speichert...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Passwort ändern
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Passwort-Richtlinien
                  </CardTitle>
                  <CardDescription>Legen Sie Anforderungen für sichere Passwörter fest</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Minimale Länge</Label>
                    </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        value={securitySettings.passwordPolicy.minLength}
                        onChange={(e) =>
                          setSecuritySettings((prev) => ({
                            ...prev,
                            passwordPolicy: { ...prev.passwordPolicy, minLength: Number.parseInt(e.target.value) },
                          }))
                        }
                        className="text-right"
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label>Großbuchstaben erforderlich</Label>
                    <Switch
                      checked={securitySettings.passwordPolicy.requireUppercase}
                      onCheckedChange={(checked) =>
                        setSecuritySettings((prev) => ({
                          ...prev,
                          passwordPolicy: { ...prev.passwordPolicy, requireUppercase: checked },
                        }))
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label>Kleinbuchstaben erforderlich</Label>
                    <Switch
                      checked={securitySettings.passwordPolicy.requireLowercase}
                      onCheckedChange={(checked) =>
                        setSecuritySettings((prev) => ({
                          ...prev,
                          passwordPolicy: { ...prev.passwordPolicy, requireLowercase: checked },
                        }))
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label>Zahlen erforderlich</Label>
                    <Switch
                      checked={securitySettings.passwordPolicy.requireNumbers}
                      onCheckedChange={(checked) =>
                        setSecuritySettings((prev) => ({
                          ...prev,
                          passwordPolicy: { ...prev.passwordPolicy, requireNumbers: checked },
                        }))
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label>Sonderzeichen erforderlich</Label>
                    <Switch
                      checked={securitySettings.passwordPolicy.requireSpecialChars}
                      onCheckedChange={(checked) =>
                        setSecuritySettings((prev) => ({
                          ...prev,
                          passwordPolicy: { ...prev.passwordPolicy, requireSpecialChars: checked },
                        }))
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label>Ablaufdatum (Tage)</Label>
                    <div className="w-20">
                      <Input
                        type="number"
                        value={securitySettings.passwordPolicy.expiryDays}
                        onChange={(e) =>
                          setSecuritySettings((prev) => ({
                            ...prev,
                            passwordPolicy: { ...prev.passwordPolicy, expiryDays: Number.parseInt(e.target.value) },
                          }))
                        }
                        className="text-right"
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label>Sitzungs-Timeout (Minuten)</Label>
                    <div className="w-20">
                      <Input
                        type="number"
                        value={securitySettings.sessionPolicy.timeoutMinutes}
                        onChange={(e) =>
                          setSecuritySettings((prev) => ({
                            ...prev,
                            sessionPolicy: { ...prev.sessionPolicy, timeoutMinutes: Number.parseInt(e.target.value) },
                          }))
                        }
                        className="text-right"
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label>Maximale gleichzeitige Sitzungen</Label>
                    <div className="w-20">
                      <Input
                        type="number"
                        value={securitySettings.sessionPolicy.maxConcurrentSessions}
                        onChange={(e) =>
                          setSecuritySettings((prev) => ({
                            ...prev,
                            sessionPolicy: {
                              ...prev.sessionPolicy,
                              maxConcurrentSessions: Number.parseInt(e.target.value),
                            },
                          }))
                        }
                        className="text-right"
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label>MFA erforderlich</Label>
                    <Switch
                      checked={securitySettings.sessionPolicy.requireMfa}
                      onCheckedChange={(checked) =>
                        setSecuritySettings((prev) => ({
                          ...prev,
                          sessionPolicy: { ...prev.sessionPolicy, requireMfa: checked },
                        }))
                      }
                    />
                  </div>
                  <div className="pt-4">
                    <Button onClick={handleSaveSecuritySettings} disabled={savingSecurity}>
                      {savingSecurity ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Speichert...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Einstellungen speichern
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="homeoffice" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      Homeoffice-Regelungen
                    </CardTitle>
                    <CardDescription>
                      Verwalten Sie, wer Homeoffice nutzen darf und unter welchen Bedingungen
                    </CardDescription>
                  </div>
                  <Button onClick={() => handleOpenPolicyDialog()} disabled={loadingPolicies}>
                    <Plus className="mr-2 h-4 w-4" />
                    Neue Regelung
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingPolicies ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : homeofficePolicies.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Keine Homeoffice-Regelungen</p>
                    <p className="text-sm">Erstellen Sie Regelungen für einzelne Mitarbeiter oder alle.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {homeofficePolicies.map((policy) => (
                      <div
                        key={policy.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div
                            className={`p-2 rounded-md ${policy.is_allowed ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}
                          >
                            <Home className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{getUserName(policy.user_id)}</div>
                            <div className="text-sm text-muted-foreground">
                              {policy.is_allowed ? (
                                <>
                                  Max. {policy.max_days_per_week} Tage/Woche
                                  {policy.allowed_days && policy.allowed_days.length > 0 && (
                                    <span className="ml-2">
                                      (
                                      {policy.allowed_days
                                        .map((d: string) => weekDays.find((w) => w.value === d)?.label)
                                        .join(", ")}
                                      )
                                    </span>
                                  )}
                                </>
                              ) : (
                                "Homeoffice nicht erlaubt"
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleOpenPolicyDialog(policy)}>
                            Bearbeiten
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePolicy(policy.id)}
                            disabled={deletingPolicyId === policy.id}
                          >
                            {deletingPolicyId === policy.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Löschen"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orga Categories Tab */}
          <TabsContent value="orga-categories" className="space-y-4">
            <OrgaCategoriesManager />
          </TabsContent>

          {/* CHANGE: Add Team Role Order Settings Tab */}
          {isAdmin && (
            <TabsContent value="team-order" className="space-y-4">
              <TeamRoleOrderSettings />
            </TabsContent>
          )}
        </Tabs>
      </div>

      <Dialog open={policyDialogOpen} onOpenChange={setPolicyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPolicy ? "Regelung bearbeiten" : "Neue Homeoffice-Regelung"}</DialogTitle>
            <DialogDescription>
              Legen Sie fest, wer Homeoffice nutzen darf und unter welchen Bedingungen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Mitarbeiter</Label>
              <Select
                value={policyForm.user_id || "all"}
                onValueChange={(value) =>
                  setPolicyForm((prev) => ({ ...prev, user_id: value === "all" ? null : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mitarbeiter auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Mitarbeiter (Standard)</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.first_name} {member.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Individuelle Regelungen überschreiben die Standard-Regelung
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Homeoffice erlauben</Label>
                <p className="text-sm text-muted-foreground">Grundsätzliche Erlaubnis für Homeoffice</p>
              </div>
              <Switch
                checked={policyForm.is_allowed}
                onCheckedChange={(checked) => setPolicyForm((prev) => ({ ...prev, is_allowed: checked }))}
              />
            </div>

            {policyForm.is_allowed && (
              <>
                <Separator />

                <div className="space-y-2">
                  <Label>Erlaubte Wochentage</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {weekDays.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={policyForm.allowed_days.includes(day.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleAllowedDay(day.value)}
                        className="w-full"
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Leer lassen für alle Tage</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Max. Tage pro Woche</Label>
                    <Input
                      type="number"
                      min="1"
                      max="7"
                      value={policyForm.max_days_per_week}
                      onChange={(e) =>
                        setPolicyForm((prev) => ({ ...prev, max_days_per_week: Number.parseInt(e.target.value) || 2 }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Erlaubt von (optional)</Label>
                    <Input
                      type="time"
                      value={policyForm.allowed_start_time}
                      onChange={(e) => setPolicyForm((prev) => ({ ...prev, allowed_start_time: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Erlaubt bis (optional)</Label>
                    <Input
                      type="time"
                      value={policyForm.allowed_end_time}
                      onChange={(e) => setPolicyForm((prev) => ({ ...prev, allowed_end_time: e.target.value }))}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Begründung erforderlich</Label>
                      <p className="text-sm text-muted-foreground">Mitarbeiter muss Grund angeben</p>
                    </div>
                    <Switch
                      checked={policyForm.requires_reason}
                      onCheckedChange={(checked) => setPolicyForm((prev) => ({ ...prev, requires_reason: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Standort-Verifizierung</Label>
                      <p className="text-sm text-muted-foreground">Erfordert Standortbestätigung</p>
                    </div>
                    <Switch
                      checked={policyForm.requires_location_verification}
                      onCheckedChange={(checked) =>
                        setPolicyForm((prev) => ({ ...prev, requires_location_verification: checked }))
                      }
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPolicyDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSavePolicy} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Speichert...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Speichern
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
