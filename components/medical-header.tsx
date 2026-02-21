"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Settings,
  LogOut,
  User,
  Building2,
  ChevronDown,
  HelpCircle,
  MessageSquare,
  Moon,
  Sun,
  Sparkles,
  GraduationCap,
} from "lucide-react"
import { useTheme } from "next-themes"
import { usePractice } from "@/contexts/practice-context"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useTranslation } from "@/contexts/translation-context"
import { useUser } from "@/contexts/user-context"
import Image from "next/image"
import { useEffect, useState, useMemo } from "react"
import useSWR from "swr"
import { formatRelativeTimeDE } from "@/lib/utils"
import AIPracticeChatDialog from "@/components/ai-practice-chat-dialog"
import CreateTodoDialog from "@/components/create-todo-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { disableAutoLoginTemporarily, clearDevSession } from "@/lib/dev-auth"
import ReportBugDialog from "@/components/report-bug-dialog"

interface MedicalHeaderProps {
  hidePracticeInfo?: boolean
}

interface Notification {
  id: string
  title: string
  message: string
  type: string
  link?: string
  is_read: boolean
  created_at: string
}

export function MedicalHeader({ hidePracticeInfo = false }: MedicalHeaderProps) {
  const { theme, setTheme } = useTheme()
  const { currentPractice } = usePractice()
  const router = useRouter()
  const { language, setLanguage, t } = useTranslation()
  const { currentUser } = useUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [openTicketCount, setOpenTicketCount] = useState(0)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true)
  const [isAIChatOpen, setIsAIChatOpen] = useState(false)
  const [isCreateTodoOpen, setIsCreateTodoOpen] = useState(false)
  const [isBugReportOpen, setIsBugReportOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Fetch overtime data for current user
  const practiceId = currentPractice?.id
  const { data: overtimeData } = useSWR(
    practiceId ? `/api/practices/${practiceId}/overtime` : null,
    async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) return null
      return res.json()
    },
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )

  const userOvertime = useMemo(() => {
    if (!overtimeData?.members || !currentUser) return null
    return overtimeData.members.find(
      (m: any) => m.user_id === currentUser.id || m.email === currentUser.email
    )
  }, [overtimeData, currentUser])

  const fetchNotifications = async () => {
    if (!currentUser) {
      setIsLoadingNotifications(false)
      return
    }

    try {
      const response = await fetch("/api/notifications?limit=10")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
        setUnreadCount(data.filter((n: Notification) => !n.is_read).length)
      }
    } catch (error) {
      console.error("[v0] Error fetching notifications:", error)
    } finally {
      setIsLoadingNotifications(false)
    }
  }

  const fetchTicketStats = async () => {
    if (!currentUser) return
    try {
      const response = await fetch("/api/tickets/stats")
      if (response.ok) {
        const data = await response.json()
        setOpenTicketCount(data.openCount)
      }
    } catch (error) {
      console.error("[v0] Error fetching ticket stats:", error)
    }
  }

  useEffect(() => {
    fetchNotifications()
    fetchTicketStats()

    // Poll for new notifications and ticket stats every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications()
      fetchTicketStats()
    }, 30000)
    return () => clearInterval(interval)
  }, [currentUser]) // Depend on currentUser

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: true }),
      })

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("[v0] Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      })

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("[v0] Error marking all as read:", error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        const notification = notifications.find((n) => n.id === id)
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        if (notification && !notification.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error("[v0] Error deleting notification:", error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    if (notification.link) {
      router.push(notification.link)
    }
  }

  const formatTime = (dateString: string) => {
    try {
      return formatRelativeTimeDE(dateString)
    } catch {
      return dateString
    }
  }

  const handleSignOut = async () => {
    disableAutoLoginTemporarily()
    clearDevSession()

    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const handleCreateTask = () => {
    setIsCreateTodoOpen(true)
  }

  const handleReportBug = () => {
    setIsBugReportOpen(true)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setShowSearchResults(true)

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results || [])
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error("[v0] Error searching:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("header.search", "Search tasks, teams...")}
              className="w-64 pl-9 pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Search className="h-3 w-3" />
              )}
            </Button>

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute top-full mt-2 w-96 max-h-96 overflow-y-auto bg-background border rounded-lg shadow-lg z-50">
                <div className="sticky top-0 bg-background border-b px-4 py-2 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Suchergebnisse {searchResults.length > 0 && `(${searchResults.length})`}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setShowSearchResults(false)} className="h-6 w-6 p-0">
                    ×
                  </Button>
                </div>

                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {isSearching ? "Suche läuft..." : "Keine Ergebnisse gefunden"}
                  </div>
                ) : (
                  <div className="p-2">
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        className="p-3 hover:bg-accent rounded-md cursor-pointer transition-colors"
                        onClick={() => {
                          setShowSearchResults(false)
                          if (result.link) router.push(result.link)
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {result.type}
                              </Badge>
                              <p className="text-sm font-medium truncate">{result.title}</p>
                            </div>
                            {result.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{result.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={handleCreateTask}>
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Neue Aufgabe</span>
          </Button>
        </div>

        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-2">
            {/* AI Chat Button - Always visible and prominent */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md hover:shadow-lg hover:from-purple-600 hover:to-indigo-600 transition-all border-0 gap-2 px-3"
                  onClick={() => setIsAIChatOpen(true)}
                  size="sm"
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="font-medium">Frag die KI</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>KI-Assistent für Praxisfragen</p>
              </TooltipContent>
            </Tooltip>

            {/* Academy Button - Always visible */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/academy")}
                  className="hover:bg-primary/10"
                >
                  <GraduationCap className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Effizienz-Academy</p>
              </TooltipContent>
            </Tooltip>

            {/* Theme Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="hover:bg-primary/10"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  <span className="sr-only">Design wechseln</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{theme === "dark" ? "Hell-Modus aktivieren" : "Dunkel-Modus aktivieren"}</p>
              </TooltipContent>
            </Tooltip>

            {/* Messages & Notifications - Unified */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  type="button"
                  onClick={() => router.push("/messages")}
                >
                  <MessageSquare className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Nachrichten & Benachrichtigungen {unreadCount > 0 ? `(${unreadCount} ungelesen)` : ""}</p>
              </TooltipContent>
            </Tooltip>

            {/* Help Icon Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open("/help", "_blank")}
                  className="hover:bg-primary/10"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Hilfe & Support</p>
              </TooltipContent>
            </Tooltip>

            {/* Bug Report Button */}
            <ReportBugDialog
              open={isBugReportOpen}
              onOpenChange={setIsBugReportOpen}
              trigger={
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleReportBug}>
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Bug melden</p>
                  </TooltipContent>
                </Tooltip>
              }
            />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 h-9 px-2 hover:bg-accent" type="button">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden ring-2 ring-primary/10">
                    {currentUser?.avatar ? (
                      <Image
                        src={currentUser.avatar || "/placeholder.svg"}
                        alt={currentUser.name || "User"}
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                        unoptimized={currentUser.avatar.startsWith("data:")}
                      />
                    ) : (
                      <span className="text-sm font-medium text-primary">
                        {currentUser?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || "U"}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium">{currentUser?.name || "User"}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium leading-none">{currentUser?.name || "User"}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span title="Soll Arbeitsstunden pro Woche">
                        Soll: {userOvertime?.planned_hours_per_week ?? "–"} h/Wo
                      </span>
                      <span title="Überstunden" className={
                        userOvertime?.overtime_total_minutes > 0 ? "text-amber-600 font-medium" : 
                        userOvertime?.overtime_total_minutes < 0 ? "text-red-500 font-medium" : ""
                      }>
                        {"Überstd: "}
                        {userOvertime?.overtime_total_minutes != null
                          ? `${userOvertime.overtime_total_minutes > 0 ? "+" : ""}${(userOvertime.overtime_total_minutes / 60).toFixed(1)} h`
                          : "–"}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  {t("header.profile", "Profile")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/info")}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t("header.systemInfo", "System-Info")}
                </DropdownMenuItem>
                {currentUser?.role === "superadmin" && (
                  <DropdownMenuItem onClick={() => router.push("/super-admin?tab=tickets")}>
                    <Building2 className="mr-2 h-4 w-4" />
                    <span className="flex-1">Tickets</span>
                    {openTicketCount > 0 && (
                      <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                        {openTicketCount > 9 ? "9+" : openTicketCount}
                      </span>
                    )}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("header.signOut", "Sign Out")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipProvider>
      </div>

      {/* AI Chat Dialog */}
      <AIPracticeChatDialog open={isAIChatOpen} onOpenChange={setIsAIChatOpen} />

      {/* Create Todo Dialog */}
      <CreateTodoDialog open={isCreateTodoOpen} onOpenChange={setIsCreateTodoOpen} />
    </header>
  )
}

export default MedicalHeader
