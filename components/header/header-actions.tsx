"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Search,
  HelpCircle,
  Gift,
  Moon,
  Sun,
  Bug,
  GraduationCap,
  Sparkles,
  MessageSquare,
  CheckSquare,
  Timer,
} from "lucide-react"
import { ReferralDialog } from "@/components/referral-dialog"
import ReportBugDialog from "@/components/report-bug-dialog"
import AIPracticeChatDialog from "@/components/ai-practice-chat-dialog"
import CreateTodoDialog from "@/components/create-todo-dialog"
import { UserMenu } from "./user-menu"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { useTimeTrackingStatus } from "@/hooks/use-time-tracking"

interface HeaderActionsProps {
  unreadMessagesCount: number
}

export function HeaderActions({ unreadMessagesCount }: HeaderActionsProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { currentPractice } = usePractice()
  const { currentUser } = useUser()

  const { status, currentBlock } = useTimeTrackingStatus(
    currentPractice?.id || null,
    currentUser?.id
  )

  const isTimerActive = status === "working" || status === "break"

  // Live elapsed time
  const [elapsed, setElapsed] = useState("")
  useEffect(() => {
    if (!isTimerActive || !currentBlock?.start_time) {
      setElapsed("")
      return
    }
    const tick = () => {
      const start = new Date(currentBlock.start_time).getTime()
      const diff = Math.max(0, Date.now() - start)
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setElapsed(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [isTimerActive, currentBlock?.start_time])

  const [referralDialogOpen, setReferralDialogOpen] = useState(false)
  const [isBugReportOpen, setIsBugReportOpen] = useState(false)
  const [isAIChatOpen, setIsAIChatOpen] = useState(false)
  const [isCreateTodoOpen, setIsCreateTodoOpen] = useState(false)

  return (
    <>
      <div className="ml-auto flex items-center gap-1">
        {/* Search - Mobile */}
        <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden">
          <Search className="h-4 w-4" />
        </Button>

        {/* Timer Active Indicator */}
        {isTimerActive && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/zeiterfassung"
                className="inline-flex items-center h-9 gap-1.5 px-2.5 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:underline underline-offset-4 decoration-emerald-500/40 transition-all relative"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <Timer className="h-4 w-4" />
                {elapsed && (
                  <span className="text-xs font-mono font-semibold hidden sm:inline">
                    {elapsed}
                  </span>
                )}
                {status === "break" && (
                  <span className="text-[10px] font-medium text-amber-500 hidden sm:inline">Pause</span>
                )}
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Zeiterfassung anzeigen{status === "break" ? " (Pause)" : ""} {elapsed ? `- ${elapsed}` : ""}</p>
            </TooltipContent>
          </Tooltip>
        )}

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

        {/* Messages */}
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

        {/* Academy */}
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

        {/* Bug Report */}
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
              onClick={() => window.open("/help", "_blank", "noopener,noreferrer")}
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Hilfe</p>
          </TooltipContent>
        </Tooltip>

        {/* Referral */}
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

        <UserMenu />
      </div>

      <ReferralDialog open={referralDialogOpen} onOpenChange={setReferralDialogOpen} />
      <AIPracticeChatDialog open={isAIChatOpen} onOpenChange={setIsAIChatOpen} />
      <CreateTodoDialog open={isCreateTodoOpen} onOpenChange={setIsCreateTodoOpen} />
    </>
  )
}
