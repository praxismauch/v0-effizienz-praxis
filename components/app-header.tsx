"use client"

import type React from "react"

import {
  Search,
  User,
  LogOut,
  HelpCircle,
  Gift,
  Moon,
  Sun,
  Bug,
  GraduationCap,
  Sparkles,
  PanelLeft,
  Clock,
  MessageSquare,
  X,
  CheckSquare,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { usePractice } from "@/contexts/practice-context"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect, useRef, useMemo } from "react"
import { ReferralDialog } from "@/components/referral-dialog"
import { Fragment } from "react"
import { useTheme } from "next-themes"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import ReportBugDialog from "@/components/report-bug-dialog"
import AIPracticeChatDialog from "@/components/ai-practice-chat-dialog"
import CreateTodoDialog from "@/components/create-todo-dialog"

// Map paths to German titles
const pathTitles: Record<string, string> = {
  dashboard: "Dashboard",
  team: "Team",
  goals: "Ziele",
  workflows: "Workflows",
  documents: "Dokumente",
  calendar: "Kalender",
  analytics: "Analysen",
  settings: "Einstellungen",
  profile: "Profil",
  help: "Hilfe",
  contacts: "Kontakte",
  recruiting: "Recruiting",
  tasks: "Aufgaben",
  checklists: "Checklisten",
  "roi-analysis": "ROI Analyse",
  "igel-analysis": "Selbstzahler-Analyse",
  wunschpatient: "Wunschpatient",
  banking: "Banking",
  onboarding: "Onboarding",
  offboarding: "Offboarding",
  "strategy-journey": "Strategiepfad",
  academy: "Effizienz-Academy",
  "competitor-analysis": "Konkurrenzanalyse",
  cockpit: "Cockpit",
  "ai-analysis": "KI-Analyse",
  todos: "Aufgaben",
  responsibilities: "Zuständigkeiten",
  rooms: "Räume",
  skills: "Qualifikationen",
  organigramm: "Organigramm",
  leitbild: "Leitbild",
  arbeitsmittel: "Arbeitsmittel",
  protocols: "Protokolle",
  training: "Schulungen",
  blog: "Blog",
  tickets: "Tickets",
  hiring: "Recruiting",
  candidates: "Kandidaten",
  edit: "Bearbeiten",
  new: "Neu",
  zeiterfassung: "Zeiterfassung",
  dienstplan: "Dienstplan",
  inventory: "Inventar",
}

type SearchItem = {
  title: string
  description: string
  href: string
  icon: string
  keywords: string[]
}

const searchableItems: SearchItem[] = [
  {
    title: "Dashboard",
    description: "Übersicht und Statistiken",
    href: "/dashboard",
    icon: "📊",
    keywords: ["start", "übersicht", "home", "cockpit"],
  },
  {
    title: "Aufgaben",
    description: "To-dos und Aufgabenverwaltung",
    href: "/todos",
    icon: "✅",
    keywords: ["todo", "tasks", "aufgaben", "erledigen"],
  },
  {
    title: "Team",
    description: "Teammitglieder verwalten",
    href: "/team",
    icon: "👥",
    keywords: ["mitarbeiter", "personal", "kollegen"],
  },
  {
    title: "Kalender",
    description: "Termine und Events",
    href: "/calendar",
    icon: "📅",
    keywords: ["termine", "events", "planung", "datum"],
  },
  {
    title: "Dokumente",
    description: "Dokumentenverwaltung",
    href: "/documents",
    icon: "📄",
    keywords: ["files", "dateien", "unterlagen"],
  },
  {
    title: "Analysen",
    description: "Praxis-Analysen und Reports",
    href: "/analytics",
    icon: "📈",
    keywords: ["statistiken", "reports", "auswertung"],
  },
  {
    title: "Einstellungen",
    description: "Praxis-Einstellungen",
    href: "/settings",
    icon: "⚙️",
    keywords: ["config", "konfiguration", "setup"],
  },
  {
    title: "Profil",
    description: "Ihr Benutzerprofil",
    href: "/profile",
    icon: "👤",
    keywords: ["account", "konto", "benutzer"],
  },
  {
    title: "Workflows",
    description: "Prozesse und Abläufe",
    href: "/workflows",
    icon: "🔄",
    keywords: ["prozesse", "abläufe", "automatisierung"],
  },
  {
    title: "Ziele",
    description: "Praxisziele verwalten",
    href: "/goals",
    icon: "🎯",
    keywords: ["objectives", "targets", "okr"],
  },
  {
    title: "Kontakte",
    description: "Kontaktverwaltung",
    href: "/contacts",
    icon: "📇",
    keywords: ["adressen", "telefon", "email"],
  },
  {
    title: "Recruiting",
    description: "Bewerbungen und Stellen",
    href: "/hiring",
    icon: "💼",
    keywords: ["jobs", "stellen", "bewerbung", "personal"],
  },
  {
    title: "Schulungen",
    description: "Fortbildungen verwalten",
    href: "/training",
    icon: "🎓",
    keywords: ["weiterbildung", "kurse", "fortbildung"],
  },
  {
    title: "Academy",
    description: "Effizienz-Academy",
    href: "/academy",
    icon: "📚",
    keywords: ["lernen", "kurse", "tutorials"],
  },
  {
    title: "Protokolle",
    description: "Sitzungsprotokolle",
    href: "/protocols",
    icon: "📝",
    keywords: ["meetings", "notizen", "sitzungen"],
  },
  {
    title: "Nachrichten",
    description: "Interne Kommunikation",
    href: "/messages",
    icon: "💬",
    keywords: ["chat", "kommunikation", "inbox"],
  },
  {
    title: "Zeiterfassung",
    description: "Arbeitszeiten erfassen",
    href: "/zeiterfassung",
    icon: "⏱️",
    keywords: ["stunden", "arbeitszeit", "tracking"],
  },
  {
    title: "Dienstplan",
    description: "Schichtplanung",
    href: "/dienstplan",
    icon: "📋",
    keywords: ["schichten", "rota", "planung"],
  },
  {
    title: "Inventar",
    description: "Bestandsverwaltung",
    href: "/inventory",
    icon: "📦",
    keywords: ["lager", "bestand", "material"],
  },
  {
    title: "Tickets",
    description: "Support-Anfragen",
    href: "/tickets",
    icon: "🎫",
    keywords: ["support", "hilfe", "anfragen"],
  },
  {
    title: "Hilfe",
    description: "Hilfe und Support",
    href: "/help",
    icon: "❓",
    keywords: ["faq", "support", "anleitung"],
  },
]

function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

function AppHeader() {
  const { user, signOut, isLoggingOut } = useAuth()
  const { currentPractice } = usePractice()
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { state: sidebarState, toggleSidebar } = useSidebar()

  // Generate breadcrumbs from pathname
  const pathSegments = pathname?.split("/").filter(Boolean) || []
  const filteredSegments = pathSegments.filter((segment) => !isUUID(segment))
  const breadcrumbs = filteredSegments.map((segment, index) => {
    const path = "/" + pathSegments.slice(0, pathSegments.indexOf(segment) + 1).join("/")
    const title = pathTitles[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
    return { path, title, isLast: index === filteredSegments.length - 1 }
  })

  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)
  const [isTrialActive, setIsTrialActive] = useState(false)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)

  // Global search state
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()
    return searchableItems
      .filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.keywords.some((k) => k.includes(query)),
      )
      .slice(0, 8)
  }, [searchQuery])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearchSelect = (href: string) => {
    router.push(href)
    setSearchQuery("")
    setIsSearchFocused(false)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchResults.length > 0) {
      handleSearchSelect(searchResults[0].href)
    }
    if (e.key === "Escape") {
      setSearchQuery("")
      setIsSearchFocused(false)
    }
  }

  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : "U"

  const [referralDialogOpen, setReferralDialogOpen] = useState(false)
  const [isBugReportOpen, setIsBugReportOpen] = useState(false)
  const [isAIChatOpen, setIsAIChatOpen] = useState(false)
  const [isCreateTodoOpen, setIsCreateTodoOpen] = useState(false)

  const handleSignOut = () => {
    signOut()
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
        {/* Mobile Sidebar Trigger */}
        <SidebarTrigger className="-ml-1 md:hidden" />

        {sidebarState === "collapsed" && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="-ml-1 hidden md:flex h-9 w-9">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Sidebar öffnen</span>
          </Button>
        )}

        <Separator orientation="vertical" className="mr-2 h-4 md:hidden" />

        {/* Breadcrumbs - Hidden */}
        <Breadcrumb className="hidden">
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <Fragment key={crumb.path}>
                <BreadcrumbItem>
                  {crumb.isLast ? (
                    <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.path}>{crumb.title}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!crumb.isLast && <BreadcrumbSeparator />}
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Practice Name - Mobile */}
        <span className="text-sm font-medium md:hidden truncate">{currentPractice?.name || "Effizienz Praxis"}</span>

        {/* Spacer */}
        <div className="flex-1" />

        {isTrialActive && trialDaysLeft !== null && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    trialDaysLeft <= 3
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse"
                      : trialDaysLeft <= 7
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    Testzeitraum: {trialDaysLeft} {trialDaysLeft === 1 ? "Tag" : "Tage"}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Ihr Testzeitraum endet in {trialDaysLeft} {trialDaysLeft === 1 ? "Tag" : "Tagen"}.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Upgrade auf einen kostenpflichtigen Plan für vollen Zugriff.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Search */}
        <div className="hidden md:flex max-w-sm" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Suchen..."
              className="w-64 pl-8 pr-8 bg-muted/50 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={handleSearchKeyDown}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-7 w-7"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            {/* Search Results Dropdown */}
            {isSearchFocused && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-80 overflow-auto">
                {searchResults.length > 0 ? (
                  <div className="p-1">
                    {searchResults.map((item) => (
                      <button
                        key={item.href}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent rounded-sm transition-colors"
                        onClick={() => handleSearchSelect(item.href)}
                      >
                        <span className="text-lg">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Keine Ergebnisse für "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side Actions */}
        <TooltipProvider>
          <div className="flex items-center gap-1">
            {/* Search - Mobile */}
            <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden">
              <Search className="h-4 w-4" />
            </Button>

            {/* AI Chat Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md hover:shadow-lg hover:from-purple-600 hover:to-indigo-600 transition-all border-0 gap-2 px-3 h-9"
                  onClick={() => setIsAIChatOpen(true)}
                  size="sm"
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="font-medium hidden sm:inline">Frag die KI</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>KI-Assistent für Praxisfragen</p>
              </TooltipContent>
            </Tooltip>

            {/* Create Todo Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-primary/10"
                  onClick={() => setIsCreateTodoOpen(true)}
                >
                  <CheckSquare className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Neue Aufgabe erstellen</p>
              </TooltipContent>
            </Tooltip>

            {/* Messages & Notifications Button - Unified */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-primary/10 relative"
                  onClick={() => router.push("/messages")}
                >
                  <MessageSquare className="h-4 w-4" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground px-1">
                      {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Nachrichten & Benachrichtigungen{unreadMessagesCount > 0 ? ` (${unreadMessagesCount} ungelesen)` : ""}
                </p>
              </TooltipContent>
            </Tooltip>

            {/* Academy Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-primary/10"
                  onClick={() => router.push("/academy")}
                >
                  <GraduationCap className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Effizienz-Academy</p>
              </TooltipContent>
            </Tooltip>

            {/* Bug Report Button */}
            <Tooltip>
              <TooltipTrigger asChild suppressHydrationWarning>
                <ReportBugDialog
                  open={isBugReportOpen}
                  onOpenChange={setIsBugReportOpen}
                  trigger={
                    <Button variant="ghost" size="icon" className="h-9 w-9" suppressHydrationWarning>
                      <Bug className="h-4 w-4" />
                    </Button>
                  }
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Bug melden</p>
              </TooltipContent>
            </Tooltip>

            {/* Theme Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-primary/10"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Moon className="h-5 w-5 text-slate-600" />
                  )}
                  <span className="sr-only">Design wechseln</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{theme === "dark" ? "Hell-Modus aktivieren" : "Dunkel-Modus aktivieren"}</p>
              </TooltipContent>
            </Tooltip>

            {/* Help */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hidden sm:flex"
                  onClick={() => router.push("/help")}
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Hilfe</p>
              </TooltipContent>
            </Tooltip>

            {/* Referral Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 hidden sm:flex items-center gap-1.5 px-2 hover:bg-purple-500/10 relative"
                  onClick={() => setReferralDialogOpen(true)}
                >
                  <Gift className="h-4 w-4 text-purple-500" />
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">3 Mon.</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Einladen – beide erhalten 3 Monate kostenlos!</p>
              </TooltipContent>
            </Tooltip>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild suppressHydrationWarning>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full" suppressHydrationWarning>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-xs">{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.user_metadata?.full_name || "Benutzer"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || "user@effizienz-praxis.de"}
                    </p>
                    {currentPractice && (
                      <p className="text-xs leading-none text-muted-foreground pt-1">{currentPractice.name}</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Einstellungen
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/help" className="cursor-pointer">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Hilfe
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-destructive"
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  {isLoggingOut ? "Abmelden..." : "Abmelden"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipProvider>
      </header>

      {/* Referral Dialog */}
      <ReferralDialog open={referralDialogOpen} onOpenChange={setReferralDialogOpen} />

      {/* AI Chat Dialog */}
      <AIPracticeChatDialog open={isAIChatOpen} onOpenChange={setIsAIChatOpen} />

      {/* Create Todo Dialog */}
      <CreateTodoDialog open={isCreateTodoOpen} onOpenChange={setIsCreateTodoOpen} />
    </>
  )
}

export default AppHeader
