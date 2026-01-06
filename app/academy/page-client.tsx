"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BadgeEarnedPopup } from "@/components/badge-earned-popup"
import {
  BookOpen,
  Clock,
  Star,
  Users,
  Trophy,
  Flame,
  Search,
  Play,
  CheckCircle,
  Award,
  Target,
  Zap,
  GraduationCap,
  Medal,
  Crown,
  Sparkles,
  Lock,
  LogIn,
  UserPlus,
} from "lucide-react"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import Link from "next/link"
import { AppLayout } from "@/components/app-layout"
import { LandingPageLayout } from "@/components/landing-page-layout"

interface Course {
  id: string
  title: string
  description: string
  category: string
  thumbnail_url: string | null
  instructor_name: string
  instructor_avatar_url: string | null
  estimated_hours: number
  difficulty_level: string
  xp_reward: number
  total_enrollments: number
  average_rating: number
  total_reviews: number
  is_featured: boolean
  learning_objectives: string[]
  tags: string[]
}

interface Enrollment {
  id: string
  course_id: string
  progress_percentage: number
  enrolled_at: string
  last_accessed_at: string | null
  course?: Course
}

interface UserStats {
  total_xp: number
  current_level: number
  xp_for_next_level: number
  courses_completed: number
  lessons_completed: number
  current_streak_days: number
  longest_streak_days: number
  quizzes_passed: number
}

interface UserBadge {
  id: string
  badge_id: string
  earned_at: string
  badge?: {
    id: string
    badge_id: string
    name: string
    description: string
    badge_type: string
    icon_name: string
    color: string
    rarity: string
    xp_reward: number
  }
}

interface LeaderboardEntry {
  rank: number
  user_id: string
  user_name: string
  avatar_url?: string
  xp_earned: number
  courses_completed: number
}

export function AcademyPageClient() {
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { currentUser, loading: userLoading } = useUser()
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [userBadges, setUserBadges] = useState<UserBadge[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("courses")
  const [pendingBadge, setPendingBadge] = useState<any>(null)

  const isAuthenticated = !!currentUser?.id
  const hasPractice = !!currentPractice?.id

  useEffect(() => {
    fetchAcademyData()
  }, [currentPractice?.id, currentUser?.id])

  const fetchAcademyData = async () => {
    setIsLoading(true)
    try {
      const coursesPromise = fetch(`/api/public/academy/courses`)
        .then((res) => (res.ok ? res.json() : []))
        .catch(() => [])

      let enrollmentsPromise = Promise.resolve([])
      let statsPromise = Promise.resolve(null)
      let badgesPromise = Promise.resolve([])
      let leaderboardPromise = Promise.resolve([])

      if (isAuthenticated && hasPractice && currentPractice?.id) {
        enrollmentsPromise = fetch(`/api/practices/${currentPractice.id}/academy/enrollments`)
          .then((res) => (res.ok ? res.json() : []))
          .catch(() => [])

        statsPromise = fetch(
          `/api/practices/${currentPractice.id}/academy/stats${currentUser?.id ? `?user_id=${currentUser.id}` : ""}`,
        )
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null)

        badgesPromise = fetch(
          `/api/practices/${currentPractice.id}/academy/badges${currentUser?.id ? `?user_id=${currentUser.id}` : ""}`,
        )
          .then((res) => (res.ok ? res.json() : []))
          .catch(() => [])

        leaderboardPromise = fetch(`/api/practices/${currentPractice.id}/academy/leaderboard`)
          .then((res) => (res.ok ? res.json() : []))
          .catch(() => [])
      }

      const [coursesData, enrollmentsData, statsData, badgesData, leaderboardData] = await Promise.all([
        coursesPromise,
        enrollmentsPromise,
        statsPromise,
        badgesPromise,
        leaderboardPromise,
      ])

      setCourses(coursesData || [])
      setEnrollments(enrollmentsData || [])
      setUserStats(statsData)
      setUserBadges(badgesData || [])
      setLeaderboard(leaderboardData || [])
    } catch (error) {
      console.error("[v0] Error fetching academy data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const checkUnseenBadges = async () => {
      if (!currentUser?.id) return

      try {
        const response = await fetch(`/api/badges/unseen?userId=${currentUser.id}`)
        if (response.ok) {
          const unseenBadges = await response.json()
          if (unseenBadges.length > 0) {
            // Show the first unseen badge
            const firstBadge = unseenBadges[0]
            setPendingBadge({
              id: firstBadge.badge?.badge_id,
              name: firstBadge.badge?.name,
              description: firstBadge.badge?.description,
              icon_name: firstBadge.badge?.icon_name,
              color: firstBadge.badge?.color,
              rarity: firstBadge.badge?.rarity,
              points: firstBadge.badge?.points,
              userBadgeId: firstBadge.id,
            })
          }
        }
      } catch (error) {
        console.error("Error checking unseen badges:", error)
      }
    }

    checkUnseenBadges()
  }, [currentUser?.id])

  const handleBadgePopupClose = async () => {
    if (pendingBadge?.userBadgeId) {
      try {
        await fetch("/api/badges/unseen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ badgeIds: [pendingBadge.userBadgeId] }),
        })
      } catch (error) {
        console.error("Error marking badge as seen:", error)
      }
    }
    setPendingBadge(null)
    // Refresh badges
    fetchAcademyData()
  }

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || course.category === categoryFilter
    const matchesDifficulty = difficultyFilter === "all" || course.difficulty_level === difficultyFilter
    return matchesSearch && matchesCategory && matchesDifficulty
  })

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-green-100 text-green-700 border-green-200"
      case "intermediate":
        return "bg-amber-100 text-amber-700 border-amber-200"
      case "advanced":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case "beginner":
        return "Anfänger"
      case "intermediate":
        return "Fortgeschritten"
      case "advanced":
        return "Experte"
      default:
        return level
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      efficiency: "Effizienz",
      leadership: "Führung",
      technology: "Technologie",
      communication: "Kommunikation",
      praxismanagement: "Praxismanagement",
      qualitaetsmanagement: "Qualitätsmanagement",
      personal: "Personal",
      finanzen: "Finanzen",
    }
    return labels[category] || category
  }

  const displayStats: UserStats = userStats || {
    total_xp: 0,
    current_level: 1,
    xp_for_next_level: 100,
    courses_completed: 0,
    lessons_completed: 0,
    current_streak_days: 0,
    longest_streak_days: 0,
    quizzes_passed: 0,
  }

  const xpProgress =
    displayStats.xp_for_next_level > 0 ? (displayStats.total_xp / displayStats.xp_for_next_level) * 100 : 0

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      award: Award,
      zap: Zap,
      trophy: Trophy,
      flame: Flame,
      target: Target,
      star: Star,
      users: Users,
      "graduation-cap": GraduationCap,
      medal: Medal,
      crown: Crown,
      sparkles: Sparkles,
    }
    return icons[iconName] || Award
  }

  const LoginPrompt = ({ title, description }: { title: string; description: string }) => (
    <Card className="p-8 text-center border-dashed border-2">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-muted-foreground mt-1 max-w-md mx-auto">{description}</p>
        </div>
        <div className="flex gap-3 mt-2">
          <Button asChild>
            <Link href="/auth/login">
              <LogIn className="h-4 w-4 mr-2" />
              Anmelden
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/auth/sign-up">
              <UserPlus className="h-4 w-4 mr-2" />
              Registrieren
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  )

  if (userLoading || practiceLoading || isLoading) {
    if (currentUser?.id) {
      return <AppLayout loading loadingMessage="Lade Academy..." />
    }
    return (
      <LandingPageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground ml-4">Lade Academy...</p>
        </div>
      </LandingPageLayout>
    )
  }

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Effizienz-Academy</h1>
          <p className="text-muted-foreground">Weiterbildung für Ihr Praxisteam</p>
        </div>
        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-lg">
              <Flame className="h-5 w-5" />
              <span className="font-semibold">{displayStats.current_streak_days} Tage Streak</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2 rounded-lg">
              <Trophy className="h-5 w-5" />
              <span className="font-semibold">Level {displayStats.current_level}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button asChild>
              <Link href="/auth/login">
                <LogIn className="h-4 w-4 mr-2" />
                Anmelden
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth/sign-up">
                <UserPlus className="h-4 w-4 mr-2" />
                Kostenlos registrieren
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Quick Actions for Authenticated Users */}
      {isAuthenticated && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("courses")}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">Kurse durchsuchen</p>
                  <p className="text-sm text-muted-foreground">{courses.length} verfügbar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setActiveTab("my-learning")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Play className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold">Lernen fortsetzen</p>
                  <p className="text-sm text-muted-foreground">{enrollments.length} aktive Kurse</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("badges")}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold">Meine Abzeichen</p>
                  <p className="text-sm text-muted-foreground">{userBadges.length} verdient</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setActiveTab("leaderboard")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold">Rangliste</p>
                  <p className="text-sm text-muted-foreground">Platzierung anzeigen</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Cards for Authenticated Users */}
      {isAuthenticated && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{displayStats.total_xp.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Gesamte XP</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Level {displayStats.current_level}</span>
                  <span>Level {displayStats.current_level + 1}</span>
                </div>
                <Progress value={xpProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {displayStats.xp_for_next_level - displayStats.total_xp > 0
                    ? `Noch ${(displayStats.xp_for_next_level - displayStats.total_xp).toLocaleString()} XP bis zum nächsten Level`
                    : "Nächstes Level erreicht!"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{displayStats.courses_completed}</p>
                  <p className="text-sm text-muted-foreground">Kurse abgeschlossen</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{displayStats.lessons_completed}</p>
                  <p className="text-sm text-muted-foreground">Lektionen abgeschlossen</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Target className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{displayStats.quizzes_passed}</p>
                  <p className="text-sm text-muted-foreground">Quizze bestanden</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Public CTA Banner */}
      {!isAuthenticated && (
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-100">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Starten Sie Ihre Lernreise</h3>
                  <p className="text-muted-foreground">
                    Registrieren Sie sich kostenlos, um Fortschritte zu speichern, Abzeichen zu verdienen und auf der
                    Rangliste zu erscheinen.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <span>XP sammeln</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-500" />
                  <span>Abzeichen verdienen</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span>Streak aufbauen</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="courses">Kurse</TabsTrigger>
          <TabsTrigger value="my-learning" className="flex items-center gap-1">
            Mein Lernen
            {!isAuthenticated && <Lock className="h-3 w-3" />}
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center gap-1">
            Abzeichen
            {!isAuthenticated && <Lock className="h-3 w-3" />}
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-1">
            Rangliste
            {!isAuthenticated && <Lock className="h-3 w-3" />}
          </TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kurse durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                <SelectItem value="efficiency">Effizienz</SelectItem>
                <SelectItem value="leadership">Führung</SelectItem>
                <SelectItem value="technology">Technologie</SelectItem>
                <SelectItem value="communication">Kommunikation</SelectItem>
              </SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Schwierigkeit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Level</SelectItem>
                <SelectItem value="beginner">Anfänger</SelectItem>
                <SelectItem value="intermediate">Fortgeschritten</SelectItem>
                <SelectItem value="advanced">Experte</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredCourses.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Keine Kurse verfügbar</h3>
                  <p className="text-muted-foreground mt-1">
                    {searchTerm || categoryFilter !== "all" || difficultyFilter !== "all"
                      ? "Keine Kurse entsprechen Ihren Filterkriterien."
                      : "Es wurden noch keine Kurse erstellt. Schauen Sie bald wieder vorbei!"}
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={course.thumbnail_url || "/placeholder.svg?height=160&width=320&query=course"}
                      alt={course.title}
                      className="w-full h-40 object-cover"
                    />
                    {course.is_featured && (
                      <Badge className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-orange-500 border-0">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Empfohlen
                      </Badge>
                    )}
                    <Badge className={`absolute top-2 right-2 ${getDifficultyColor(course.difficulty_level)}`}>
                      {getDifficultyLabel(course.difficulty_level)}
                    </Badge>
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <span>{getCategoryLabel(course.category)}</span>
                      <span>•</span>
                      <Clock className="h-3 w-3" />
                      <span>{course.estimated_hours}h</span>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={course.instructor_avatar_url || undefined} />
                        <AvatarFallback>{course.instructor_name?.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">{course.instructor_name}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span>{course.average_rating?.toFixed(1) || "Neu"}</span>
                      <span className="text-muted-foreground">({course.total_reviews || 0})</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{course.total_enrollments || 0}</span>
                    </div>
                  </CardFooter>
                  <div className="px-6 pb-4">
                    <Button className="w-full" asChild>
                      <Link href={`/academy/courses/${course.id}`}>
                        <Play className="h-4 w-4 mr-2" />
                        Kurs starten
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Learning Tab */}
        <TabsContent value="my-learning" className="space-y-6">
          {!isAuthenticated ? (
            <LoginPrompt
              title="Anmelden für Lernfortschritt"
              description="Melden Sie sich an, um Ihre eingeschriebenen Kurse zu sehen und Ihren Fortschritt zu verfolgen."
            />
          ) : enrollments.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Noch keine Kurse begonnen</h3>
                  <p className="text-muted-foreground mt-1">
                    Starten Sie Ihren ersten Kurs und beginnen Sie Ihre Lernreise!
                  </p>
                </div>
                <Button onClick={() => setActiveTab("courses")}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Kurse entdecken
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={enrollment.course?.thumbnail_url || "/placeholder.svg?height=80&width=120&query=course"}
                        alt={enrollment.course?.title}
                        className="w-24 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{enrollment.course?.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Zuletzt gelernt:{" "}
                          {enrollment.last_accessed_at
                            ? new Date(enrollment.last_accessed_at).toLocaleDateString("de-DE")
                            : "Noch nicht gestartet"}
                        </p>
                        <div className="mt-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Fortschritt</span>
                            <span>{enrollment.progress_percentage}%</span>
                          </div>
                          <Progress value={enrollment.progress_percentage} className="h-2" />
                        </div>
                      </div>
                      <Button asChild>
                        <Link href={`/academy/courses/${enrollment.course_id}`}>
                          <Play className="h-4 w-4 mr-2" />
                          Fortsetzen
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-6">
          {!isAuthenticated ? (
            <LoginPrompt
              title="Anmelden für Abzeichen"
              description="Melden Sie sich an, um Abzeichen zu verdienen und Ihre Erfolge zu sammeln."
            />
          ) : userBadges.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Award className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Noch keine Abzeichen</h3>
                  <p className="text-muted-foreground mt-1">
                    Schließen Sie Kurse ab und erreichen Sie Meilensteine, um Abzeichen zu verdienen!
                  </p>
                </div>
                <Button onClick={() => setActiveTab("courses")}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Kurse entdecken
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userBadges.map((userBadge) => {
                const IconComponent = getIconComponent(userBadge.badge?.icon_name || "award")
                return (
                  <Card key={userBadge.id} className="text-center p-6">
                    <div
                      className="h-16 w-16 rounded-full mx-auto flex items-center justify-center mb-4"
                      style={{ backgroundColor: `${userBadge.badge?.color}20` }}
                    >
                      <IconComponent className="h-8 w-8" style={{ color: userBadge.badge?.color }} />
                    </div>
                    <h3 className="font-semibold">{userBadge.badge?.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{userBadge.badge?.description}</p>
                    <Badge variant="outline" className="mt-3">
                      {userBadge.badge?.rarity}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      Verdient am {new Date(userBadge.earned_at).toLocaleDateString("de-DE")}
                    </p>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-6">
          {!isAuthenticated ? (
            <LoginPrompt
              title="Anmelden für Rangliste"
              description="Melden Sie sich an, um Ihre Platzierung in der Rangliste zu sehen und mit anderen zu konkurrieren."
            />
          ) : leaderboard.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Rangliste noch leer</h3>
                  <p className="text-muted-foreground mt-1">
                    Seien Sie der Erste, der Kurse abschließt und XP sammelt!
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Praxis-Rangliste
                </CardTitle>
                <CardDescription>Top-Lernende in Ihrer Praxis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center gap-4 p-3 rounded-lg ${
                        entry.user_id === currentUser?.id ? "bg-primary/5 border border-primary/20" : "bg-muted/50"
                      }`}
                    >
                      <div className="w-8 text-center font-bold">
                        {index === 0 ? (
                          <Crown className="h-6 w-6 text-amber-500 mx-auto" />
                        ) : index === 1 ? (
                          <Medal className="h-6 w-6 text-gray-400 mx-auto" />
                        ) : index === 2 ? (
                          <Medal className="h-6 w-6 text-amber-700 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">{entry.rank}</span>
                        )}
                      </div>
                      <Avatar>
                        <AvatarImage src={entry.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>{entry.user_name?.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">
                          {entry.user_name}
                          {entry.user_id === currentUser?.id && (
                            <Badge variant="outline" className="ml-2">
                              Sie
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">{entry.courses_completed} Kurse abgeschlossen</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{entry.xp_earned.toLocaleString()} XP</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )

  if (isAuthenticated) {
    return (
      <AppLayout>
        <BadgeEarnedPopup badge={pendingBadge} onClose={handleBadgePopupClose} />
        {content}
      </AppLayout>
    )
  }

  return (
    <LandingPageLayout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <BadgeEarnedPopup badge={pendingBadge} onClose={handleBadgePopupClose} />
        {content}
      </div>
    </LandingPageLayout>
  )
}
