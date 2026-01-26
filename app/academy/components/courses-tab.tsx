"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookOpen, Clock, Star, Users, Play, Sparkles, Search } from "lucide-react"
import Link from "next/link"
import type { Course } from "../types"
import { getDifficultyColor, getDifficultyLabel, getCategoryLabel } from "../types"

interface CoursesTabProps {
  courses: Course[]
}

export function CoursesTab({ courses }: CoursesTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || course.category === categoryFilter
    const matchesDifficulty = difficultyFilter === "all" || course.difficulty_level === difficultyFilter
    return matchesSearch && matchesCategory && matchesDifficulty
  })

  return (
    <div className="space-y-6">
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
    </div>
  )
}
