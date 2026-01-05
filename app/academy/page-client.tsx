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
  TrendingUp,
  ChevronRight,
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
  const { currentPractice } = usePractice()
  const { user: currentUser } = useUser()
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [userBadges, setUserBadges] = useState<UserBadge[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")

  const isAuthenticated = !!currentUser?.id && !!currentPractice?.id

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

      if (isAuthenticated && currentPractice?.id) {
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
      <div className="flex flex-col items-center gap-4">
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground ml-4">Lade Academy...</p>
      </div>
    )
  }

  return (
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
      <Tabs defaultValue="courses" className="space-y-6">
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

        {/* Courses Tab - Always accessible */}
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
                        <AvatarFallback className="text-xs">
                          {course.instructor_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">{course.instructor_name}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span>{course.average_rating?.toFixed(1) || "N/A"}</span>
                        <span>({course.total_reviews || 0})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{course.total_enrollments || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1 text-purple-600">
                        <Zap className="h-4 w-4" />
                        <span className="font-semibold">+{course.xp_reward} XP</span>
                      </div>
                      {isAuthenticated ? (
                        <Button size="sm">
                          Kurs starten
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      ) : (
                        <Button size="sm" asChild>
                          <Link href="/auth/sign-up">
                            <Lock className="h-4 w-4 mr-1" />
                            Registrieren
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Learning Tab - Requires authentication */}
        <TabsContent value="my-learning" className="space-y-6">
          {!isAuthenticated ? (
            <LoginPrompt
              title="Anmeldung erforderlich"
              description="Melden Sie sich an, um Ihre Lernfortschritte zu sehen, Kurse fortzusetzen und Ihren persönlichen Lernpfad zu verfolgen."
            />
          ) : (
            <>
              <h2 className="text-xl font-semibold">Aktuelle Kurse</h2>
              {enrollments.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                      <Play className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Keine aktiven Kurse</h3>
                      <p className="text-muted-foreground mt-1">
                        Sie haben noch keine Kurse begonnen. Stöbern Sie im Kurskatalog und starten Sie Ihre Lernreise!
                      </p>
                    </div>
                    <Button
                      onClick={() => document.querySelector('[value="courses"]')?.dispatchEvent(new Event("click"))}
                    >
                      Kurse entdecken
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  {enrollments.map((enrollment) => (
                    <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={enrollment.course?.thumbnail_url || "/placeholder.svg?height=64&width=96&query=course"}
                            alt={enrollment.course?.title || "Kurs"}
                            className="w-24 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold">{enrollment.course?.title || "Unbekannter Kurs"}</h3>
                            <p className="text-sm text-muted-foreground">
                              {enrollment.course?.instructor_name || "Unbekannt"}
                            </p>
                            <div className="mt-2">
                              <div className="flex justify-between text-sm mb-1">
                                <span>{enrollment.progress_percentage}% abgeschlossen</span>
                              </div>
                              <Progress value={enrollment.progress_percentage} className="h-2" />
                            </div>
                          </div>
                          <Button>
                            <Play className="h-4 w-4 mr-2" />
                            Fortsetzen
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Completed Courses Section */}
              {displayStats.courses_completed > 0 && (
                <>
                  <h2 className="text-xl font-semibold mt-8">Abgeschlossene Kurse</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {courses
                      .filter((course) =>
                        enrollments.some((e) => e.course_id === course.id && e.progress_percentage === 100),
                      )
                      .map((course) => (
                        <Card key={course.id} className="relative overflow-hidden">
                          <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-sm rounded-bl-lg">
                            <CheckCircle className="h-4 w-4 inline mr-1" />
                            Abgeschlossen
                          </div>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <img
                                src={course.thumbnail_url || "/placeholder.svg?height=64&width=96&query=course"}
                                alt={course.title}
                                className="w-24 h-16 object-cover rounded"
                              />
                              <div>
                                <h3 className="font-semibold">{course.title}</h3>
                                <p className="text-sm text-muted-foreground">{course.instructor_name}</p>
                                <div className="flex items-center gap-1 text-purple-600 mt-1">
                                  <Zap className="h-4 w-4" />
                                  <span className="text-sm font-medium">+{course.xp_reward} XP verdient</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </>
              )}
            </>
          )}
        </TabsContent>

        {/* Badges Tab - Requires authentication */}
        <TabsContent value="badges" className="space-y-6">
          {!isAuthenticated ? (
            <LoginPrompt
              title="Abzeichen freischalten"
              description="Registrieren Sie sich, um Abzeichen zu verdienen, Erfolge zu sammeln und Ihren Fortschritt zu zeigen."
            />
          ) : userBadges.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Award className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Keine Abzeichen verdient</h3>
                  <p className="text-muted-foreground mt-1">
                    Schließen Sie Kurse ab und erreichen Sie Meilensteine, um Abzeichen zu verdienen!
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {userBadges.map((userBadge) => {
                const badge = userBadge.badge
                if (!badge) return null
                const IconComponent = getIconComponent(badge.icon_name)
                return (
                  <Card key={userBadge.id} className="relative">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div
                          className="h-16 w-16 mx-auto rounded-full flex items-center justify-center mb-3"
                          style={{ backgroundColor: `${badge.color}20` }}
                        >
                          <IconComponent className="h-8 w-8" style={{ color: badge.color }} />
                        </div>
                        <h4 className="font-semibold">{badge.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                        <Badge className="mt-3 bg-green-100 text-green-700 border-green-200">Verdient</Badge>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(userBadge.earned_at).toLocaleDateString("de-DE")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Leaderboard Tab - Requires authentication */}
        <TabsContent value="leaderboard" className="space-y-6">
          {!isAuthenticated ? (
            <LoginPrompt
              title="Rangliste anzeigen"
              description="Melden Sie sich an, um die Rangliste zu sehen, sich mit anderen zu messen und Ihren Rang zu verbessern."
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Rangliste - Diese Woche
                </CardTitle>
                <CardDescription>Top-Lerner in Ihrer Praxis</CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <Trophy className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">Keine Rangliste verfügbar</h3>
                    <p className="text-muted-foreground mt-1">
                      Beginnen Sie mit dem Lernen, um auf der Rangliste zu erscheinen!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((entry) => (
                      <div
                        key={entry.user_id}
                        className={`flex items-center gap-4 p-4 rounded-lg border ${
                          entry.user_id === currentUser?.id ? "bg-primary/5 border-primary/20" : ""
                        }`}
                      >
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                            entry.rank === 1
                              ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                              : entry.rank === 2
                                ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white"
                                : entry.rank === 3
                                  ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white"
                                  : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {entry.rank <= 3 ? (
                            entry.rank === 1 ? (
                              <Crown className="h-5 w-5" />
                            ) : (
                              <Medal className="h-5 w-5" />
                            )
                          ) : (
                            entry.rank
                          )}
                        </div>
                        <Avatar>
                          <AvatarImage src={entry.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>
                            {entry.user_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{entry.user_name}</p>
                          <p className="text-sm text-muted-foreground">{entry.courses_completed} Kurse abgeschlossen</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-600">{entry.xp_earned.toLocaleString()} XP</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span>Diese Woche</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AcademyPageClient
