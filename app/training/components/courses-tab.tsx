"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, BookOpen, Clock, Users, LinkIcon, MapPin, Euro, Edit, Trash2 } from "lucide-react"
import type { TrainingCourse } from "../types"

interface CoursesTabProps {
  courses: TrainingCourse[]
  onCreateNew: () => void
  onEdit: (course: TrainingCourse) => void
  onDelete: (id: string, name: string) => void
}

export function CoursesTab({ courses, onCreateNew, onEdit, onDelete }: CoursesTabProps) {
  if (courses.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Neuer Kurs
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Keine Kurse gefunden</p>
            <p className="text-sm text-muted-foreground mb-4">Erstellen Sie Ihren ersten Fortbildungskurs</p>
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Kurs erstellen
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Kurs
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
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
                <Button variant="outline" size="sm" onClick={() => onEdit(course)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Bearbeiten
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive bg-transparent"
                  onClick={() => onDelete(course.id, course.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
