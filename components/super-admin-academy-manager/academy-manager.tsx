"use client"

import { Separator } from "@/components/ui/separator"
import { ColorPicker } from "@/components/color-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Plus, Pencil, Trash2, Eye, Search, MoreHorizontal, GraduationCap, BookOpen, Users, Star,
  Clock, Trophy, Layers, ChevronDown, ChevronRight, Play, FileText, HelpCircle, Award,
  Sparkles, RefreshCw, BarChart3, Zap, Loader2, Wand2, Save,
} from "lucide-react"
import { useAcademy } from "./hooks/use-academy"
import {
  CATEGORIES, DIFFICULTY_LEVELS, BADGE_TYPES, BADGE_RARITIES, BADGE_ICONS, VISIBILITY_OPTIONS,
  getDifficultyBadge, getBadgeIcon,
} from "./types"

export function SuperAdminAcademyManager() {
  const a = useAcademy()

  const diffBadge = (level: string) => {
    const d = getDifficultyBadge(level)
    return <Badge className={`${d.color} text-white`}>{d.label}</Badge>
  }

  const badgeIconEl = (iconName: string) => {
    const Icon = getBadgeIcon(iconName)
    return <Icon className="h-5 w-5" />
  }

  // Render overview tab
  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kurse gesamt</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{a.stats?.totalCourses || a.courses.length || 0}</div>
            <p className="text-xs text-muted-foreground">{a.stats?.publishedCourses || a.courses.filter((c) => c.is_published).length || 0} veröffentlicht</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Einschreibungen</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{a.stats?.totalEnrollments || 0}</div>
            <p className="text-xs text-muted-foreground">{a.stats?.completionRate || 0}% Abschlussrate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lektionen</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{a.stats?.totalLessons || 0}</div>
            <p className="text-xs text-muted-foreground">{a.stats?.totalQuizzes || a.quizzes.length || 0} Quizze</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bewertung</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {a.stats?.averageRating?.toFixed(1) || "4.5"}<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-xs text-muted-foreground">Durchschnittliche Bewertung</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Neueste Kurse</CardTitle></CardHeader>
          <CardContent>
            {a.courses.length === 0 ? <p className="text-muted-foreground text-center py-4">Noch keine Kurse</p> : (
              <div className="space-y-3">
                {a.courses.slice(0, 5).map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer" onClick={() => a.handleSelectCourse(course)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center"><GraduationCap className="h-5 w-5 text-primary" /></div>
                      <div><p className="font-medium text-sm">{course.title}</p><p className="text-xs text-muted-foreground">{CATEGORIES.find((c) => c.value === course.category)?.label}</p></div>
                    </div>
                    {diffBadge(course.difficulty_level)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Badges</CardTitle></CardHeader>
          <CardContent>
            {a.badges.length === 0 ? <p className="text-muted-foreground text-center py-4">Noch keine Badges</p> : (
              <div className="grid grid-cols-4 gap-3">
                {a.badges.slice(0, 8).map((badge) => (
                  <div key={badge.id} className="flex flex-col items-center p-2 rounded-lg hover:bg-muted cursor-pointer" onClick={() => a.openEditBadge(badge)}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: badge.color + "20", color: badge.color }}>{badgeIconEl(badge.icon_name)}</div>
                    <p className="text-xs font-medium mt-1 text-center truncate w-full">{badge.name}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  if (a.loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Academy Verwaltung</h1><p className="text-muted-foreground">Verwalten Sie Kurse, Lektionen, Quizze und Gamification</p></div>
        <div className="flex items-center gap-2">
          <Button onClick={() => { a.resetCourseForm(); a.setEditingCourse(null); a.setShowCourseDialog(true) }}><Plus className="h-4 w-4 mr-2" />Neuer Kurs</Button>
          <Button variant="outline" onClick={() => a.setShowAiCourseDialog(true)}><Sparkles className="h-4 w-4 mr-2" />Kurs mit KI erstellen</Button>
        </div>
      </div>

      <Tabs value={a.activeTab} onValueChange={a.setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full max-w-3xl">
          <TabsTrigger value="overview"><BarChart3 className="h-4 w-4 mr-2" />Übersicht</TabsTrigger>
          <TabsTrigger value="courses"><GraduationCap className="h-4 w-4 mr-2" />Kurse</TabsTrigger>
          <TabsTrigger value="quizzes"><HelpCircle className="h-4 w-4 mr-2" />Quizze</TabsTrigger>
          <TabsTrigger value="badges"><Award className="h-4 w-4 mr-2" />Badges</TabsTrigger>
          <TabsTrigger value="waitlist"><Users className="h-4 w-4 mr-2" />Warteliste</TabsTrigger>
          <TabsTrigger value="content" disabled={!a.selectedCourse}><Layers className="h-4 w-4 mr-2" />Kursinhalt</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">{renderOverview()}</TabsContent>

        <TabsContent value="courses" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Kurse suchen..." value={a.searchTerm} onChange={(e) => a.setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Select value={a.categoryFilter} onValueChange={a.setCategoryFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Alle Kategorien" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kategorien</SelectItem>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={() => { a.resetCourseForm(); a.setEditingCourse(null); a.setShowCourseDialog(true) }}><Plus className="h-4 w-4 mr-2" />Neuer Kurs</Button>
            </div>
            {a.filteredCourses.length === 0 ? (
              <Card><CardContent className="flex flex-col items-center justify-center py-12"><GraduationCap className="h-12 w-12 text-muted-foreground mb-4" /><h3 className="text-lg font-medium">Keine Kurse gefunden</h3></CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {a.filteredCourses.map((course) => (
                  <Card key={course.id} className="overflow-hidden group">
                    <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
                      {course.thumbnail_url ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" /> : <GraduationCap className="h-12 w-12 text-primary/40" />}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full shadow-lg" onClick={() => a.openEditCourse(course)} title="Bearbeiten">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full shadow-lg text-destructive hover:text-destructive" onClick={() => { a.setDeleteItem({ type: "course", id: course.id, name: course.title }); a.setShowDeleteDialog(true) }} title="Löschen">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1"><CardTitle className="text-base line-clamp-1">{course.title}</CardTitle><CardDescription className="line-clamp-2 mt-1">{course.description}</CardDescription></div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => a.handleSelectCourse(course)}><Eye className="h-4 w-4 mr-2" />Inhalt verwalten</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => a.openEditCourse(course)}><Pencil className="h-4 w-4 mr-2" />Bearbeiten</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => { a.setDeleteItem({ type: "course", id: course.id, name: course.title }); a.setShowDeleteDialog(true) }}><Trash2 className="h-4 w-4 mr-2" />Löschen</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="flex items-center gap-2 flex-wrap">{diffBadge(course.difficulty_level)}<Badge variant="outline">{CATEGORIES.find((c) => c.value === course.category)?.label}</Badge>{course.is_published ? <Badge className="bg-green-500 text-white">Veröffentlicht</Badge> : <Badge variant="secondary">Entwurf</Badge>}</div>
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground"><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.estimated_hours}h</span><span className="flex items-center gap-1"><Zap className="h-3 w-3" />{course.xp_reward} XP</span><span className="flex items-center gap-1"><Users className="h-3 w-3" />{course.total_enrollments || 0}</span></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="quizzes" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between"><div><h3 className="text-lg font-medium">Quizze</h3></div><Button onClick={() => { a.resetQuizForm(); a.setEditingQuiz(null); a.setShowQuizDialog(true) }}><Plus className="h-4 w-4 mr-2" />Neues Quiz</Button></div>
            {a.quizzes.length === 0 ? <Card><CardContent className="flex flex-col items-center justify-center py-12"><HelpCircle className="h-12 w-12 text-muted-foreground mb-4" /><h3 className="text-lg font-medium">Keine Quizze</h3></CardContent></Card> : (
              <Table><TableHeader><TableRow><TableHead>Titel</TableHead><TableHead>Typ</TableHead><TableHead>Bestehensgrenze</TableHead><TableHead>Zeitlimit</TableHead><TableHead>XP</TableHead><TableHead className="text-right">Aktionen</TableHead></TableRow></TableHeader>
                <TableBody>{a.quizzes.map((quiz) => (
                  <TableRow key={quiz.id}><TableCell className="font-medium">{quiz.title}</TableCell><TableCell><Badge variant="outline">{quiz.quiz_type}</Badge></TableCell><TableCell>{quiz.passing_score}%</TableCell><TableCell>{quiz.time_limit_minutes} Min</TableCell><TableCell>{quiz.xp_reward} XP</TableCell>
                    <TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => a.openEditQuiz(quiz)}><Pencil className="h-4 w-4 mr-2" />Bearbeiten</DropdownMenuItem><DropdownMenuItem className="text-destructive" onClick={() => { a.setDeleteItem({ type: "quiz", id: quiz.id, name: quiz.title }); a.setShowDeleteDialog(true) }}><Trash2 className="h-4 w-4 mr-2" />Löschen</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>
                ))}</TableBody></Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="badges" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between"><div><h3 className="text-lg font-medium">Gamification Badges</h3></div><Button onClick={() => { a.resetBadgeForm(); a.setEditingBadge(null); a.setShowBadgeDialog(true) }}><Plus className="h-4 w-4 mr-2" />Neues Badge</Button></div>
            {a.badges.length === 0 ? <Card><CardContent className="flex flex-col items-center justify-center py-12"><Award className="h-12 w-12 text-muted-foreground mb-4" /><h3>Keine Badges</h3></CardContent></Card> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {a.badges.map((badge) => (
                  <Card key={badge.id} className="overflow-hidden"><CardContent className="pt-6"><div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: badge.color + "20", color: badge.color }}>{badgeIconEl(badge.icon_name)}</div>
                    <h4 className="font-medium">{badge.name}</h4><p className="text-sm text-muted-foreground line-clamp-2 mt-1">{badge.description}</p>
                    <div className="flex items-center gap-2 mt-3"><Badge variant="outline" className={BADGE_RARITIES.find((r) => r.value === badge.rarity)?.color}>{BADGE_RARITIES.find((r) => r.value === badge.rarity)?.label}</Badge><Badge variant="secondary"><Zap className="h-3 w-3 mr-1" />{badge.xp_reward} XP</Badge></div>
                  </div></CardContent><CardFooter className="justify-center gap-2 border-t pt-4">
                    <Button variant="outline" size="sm" onClick={() => a.openEditBadge(badge)}><Pencil className="h-3 w-3 mr-1" />Bearbeiten</Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive bg-transparent" onClick={() => { a.setDeleteItem({ type: "badge", id: badge.id, name: badge.name }); a.setShowDeleteDialog(true) }}><Trash2 className="h-3 w-3" /></Button>
                  </CardFooter></Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="waitlist" className="mt-6">
          <Card><CardContent className="py-8 text-center text-muted-foreground">Warteliste-Verwaltung</CardContent></Card>
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          {!a.selectedCourse ? (
            <Card><CardContent className="flex flex-col items-center justify-center py-12"><Layers className="h-12 w-12 text-muted-foreground mb-4" /><h3 className="text-lg font-medium">Kein Kurs ausgewaehlt</h3><Button className="mt-4 bg-transparent" variant="outline" onClick={() => a.setActiveTab("courses")}>Zur Kursliste</Button></CardContent></Card>
          ) : (
            <div className="space-y-4">
              <Card><CardHeader><div className="flex items-start justify-between"><div><CardTitle>{a.selectedCourse.title}</CardTitle><CardDescription>{a.selectedCourse.description}</CardDescription></div><Button variant="outline" onClick={() => a.setSelectedCourse(null)}>Zurück</Button></div></CardHeader></Card>
              <div className="flex justify-end"><Button onClick={() => { a.resetModuleForm(); a.setEditingModule(null); a.setShowModuleDialog(true) }}><Plus className="h-4 w-4 mr-2" />Neues Modul</Button></div>
              {a.courseModules.length === 0 ? <Card><CardContent className="flex flex-col items-center py-12"><BookOpen className="h-12 w-12 text-muted-foreground mb-4" /><h3>Keine Module</h3></CardContent></Card> : (
                <div className="space-y-3">
                  {a.courseModules.map((module, idx) => (
                    <Card key={module.id}>
                      <CardHeader className="cursor-pointer" onClick={() => a.toggleModuleExpanded(module.id)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {a.expandedModules.includes(module.id) ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                            <div><CardTitle className="text-base">Modul {idx + 1}: {module.title}</CardTitle><CardDescription>{module.lessons?.length || 0} Lektionen - {module.estimated_minutes} Min</CardDescription></div>
                          </div>
                          <div className="flex items-center gap-2">
                            {module.is_published ? <Badge className="bg-green-500 text-white">Veröffentlicht</Badge> : <Badge variant="secondary">Entwurf</Badge>}
                            <DropdownMenu><DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); a.setEditingModule(module); a.setModuleForm({ title: module.title, description: module.description, estimated_minutes: module.estimated_minutes, is_published: module.is_published }); a.setShowModuleDialog(true) }}><Pencil className="h-4 w-4 mr-2" />Bearbeiten</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); a.setDeleteItem({ type: "module", id: module.id, name: module.title }); a.setShowDeleteDialog(true) }}><Trash2 className="h-4 w-4 mr-2" />Löschen</DropdownMenuItem>
                            </DropdownMenuContent></DropdownMenu>
                          </div>
                        </div>
                      </CardHeader>
                      {a.expandedModules.includes(module.id) && (
                        <CardContent className="pt-0"><Separator className="mb-4" /><div className="space-y-2">
                          {module.lessons?.map((lesson, li) => (
                            <div key={lesson.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-3">
                                {lesson.lesson_type === "video" ? <Play className="h-4 w-4 text-primary" /> : lesson.lesson_type === "quiz" ? <HelpCircle className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-primary" />}
                                <div><p className="font-medium text-sm">{li + 1}. {lesson.title}</p><p className="text-xs text-muted-foreground">{lesson.estimated_minutes} Min - {lesson.xp_reward} XP</p></div>
                              </div>
                              <div className="flex items-center gap-2">{lesson.is_published ? <Badge variant="outline" className="text-green-600 border-green-600">Live</Badge> : <Badge variant="outline">Entwurf</Badge>}
                                <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3 w-3" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { a.setEditingLesson(lesson); a.setLessonForm({ title: lesson.title, description: lesson.description, content: lesson.content, lesson_type: lesson.lesson_type, video_url: lesson.video_url, video_duration_seconds: lesson.video_duration_seconds, estimated_minutes: lesson.estimated_minutes, xp_reward: lesson.xp_reward, is_published: lesson.is_published, is_free_preview: lesson.is_free_preview }); a.setShowLessonDialog(true) }}><Pencil className="h-4 w-4 mr-2" />Bearbeiten</DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={() => { a.setDeleteItem({ type: "lesson", id: lesson.id, name: lesson.title }); a.setShowDeleteDialog(true) }}><Trash2 className="h-4 w-4 mr-2" />Löschen</DropdownMenuItem>
                                </DropdownMenuContent></DropdownMenu>
                              </div>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent" onClick={() => { a.resetLessonForm(); a.setEditingLesson(null); a.setEditingModule(module); a.setShowLessonDialog(true) }}><Plus className="h-4 w-4 mr-2" />Lektion hinzufuegen</Button>
                        </div></CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Course Dialog */}
      <Dialog open={a.showCourseDialog} onOpenChange={a.setShowCourseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{a.editingCourse ? "Kurs bearbeiten" : "Neuer Kurs"}</DialogTitle><DialogDescription>Kursdetails, Sichtbarkeit und Dozent konfigurieren.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Titel</Label><Input value={a.courseForm.title} onChange={(e) => a.setCourseForm({ ...a.courseForm, title: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Beschreibung</Label><Textarea value={a.courseForm.description} onChange={(e) => a.setCourseForm({ ...a.courseForm, description: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Kategorie</Label><Select value={a.courseForm.category} onValueChange={(v) => a.setCourseForm({ ...a.courseForm, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Schwierigkeitsgrad</Label><Select value={a.courseForm.difficulty_level} onValueChange={(v) => a.setCourseForm({ ...a.courseForm, difficulty_level: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DIFFICULTY_LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <Separator />
            <div className="grid gap-2"><Label>Sichtbarkeit</Label><Select value={a.courseForm.visibility} onValueChange={(v: "public" | "logged_in" | "premium") => a.setCourseForm({ ...a.courseForm, visibility: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{VISIBILITY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}><div className="flex items-center gap-2"><o.icon className="h-4 w-4" /><span>{o.label}</span></div></SelectItem>)}</SelectContent></Select></div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Dauer (h)</Label><Input type="number" value={a.courseForm.estimated_hours} onChange={(e) => a.setCourseForm({ ...a.courseForm, estimated_hours: Number(e.target.value) })} min={1} /></div>
              <div className="grid gap-2"><Label>XP</Label><Input type="number" value={a.courseForm.xp_reward} onChange={(e) => a.setCourseForm({ ...a.courseForm, xp_reward: Number(e.target.value) })} min={0} step={25} /></div>
            </div>
            <Separator />
            <div className="grid gap-2"><Label>Dozent</Label><Input value={a.courseForm.instructor_name} onChange={(e) => a.setCourseForm({ ...a.courseForm, instructor_name: e.target.value })} /></div>
            <Separator />
            <div className="flex items-center justify-between"><div><Label>Veröffentlicht</Label><p className="text-sm text-muted-foreground">Kurs sichtbar machen</p></div><Switch checked={a.courseForm.is_published} onCheckedChange={(c) => a.setCourseForm({ ...a.courseForm, is_published: c })} /></div>
            <div className="flex items-center justify-between"><div><Label>Auf Landingpage</Label><p className="text-sm text-muted-foreground">Auf öffentlicher Seite hervorheben</p></div><Switch checked={a.courseForm.is_landing_page_featured} onCheckedChange={(c) => a.setCourseForm({ ...a.courseForm, is_landing_page_featured: c })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => a.setShowCourseDialog(false)}>Abbrechen</Button><Button onClick={a.handleSaveCourse}><Save className="h-4 w-4 mr-2" />{a.editingCourse ? "Speichern" : "Erstellen"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Module Dialog */}
      <Dialog open={a.showModuleDialog} onOpenChange={a.setShowModuleDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{a.editingModule ? "Modul bearbeiten" : "Neues Modul"}</DialogTitle><DialogDescription>Modulinformationen und Veröffentlichungsstatus festlegen.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Titel</Label><Input value={a.moduleForm.title} onChange={(e) => a.setModuleForm({ ...a.moduleForm, title: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Beschreibung</Label><Textarea value={a.moduleForm.description} onChange={(e) => a.setModuleForm({ ...a.moduleForm, description: e.target.value })} rows={3} /></div>
            <div className="grid gap-2"><Label>Dauer (Min)</Label><Input type="number" value={a.moduleForm.estimated_minutes} onChange={(e) => a.setModuleForm({ ...a.moduleForm, estimated_minutes: Number(e.target.value) })} min={1} /></div>
            <div className="flex items-center justify-between"><Label>Veröffentlicht</Label><Switch checked={a.moduleForm.is_published} onCheckedChange={(c) => a.setModuleForm({ ...a.moduleForm, is_published: c })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => a.setShowModuleDialog(false)}>Abbrechen</Button><Button onClick={a.handleSaveModule}><Save className="h-4 w-4 mr-2" />{a.editingModule ? "Speichern" : "Erstellen"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Badge Dialog */}
      <Dialog open={a.showBadgeDialog} onOpenChange={a.setShowBadgeDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{a.editingBadge ? "Badge bearbeiten" : "Neues Badge"}</DialogTitle><DialogDescription>Badge-Typ, Seltenheit, Icon und XP-Belohnung konfigurieren.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Name</Label><Input value={a.badgeForm.name} onChange={(e) => a.setBadgeForm({ ...a.badgeForm, name: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Beschreibung</Label><Textarea value={a.badgeForm.description} onChange={(e) => a.setBadgeForm({ ...a.badgeForm, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Typ</Label><Select value={a.badgeForm.badge_type} onValueChange={(v) => a.setBadgeForm({ ...a.badgeForm, badge_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{BADGE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Seltenheit</Label><Select value={a.badgeForm.rarity} onValueChange={(v) => a.setBadgeForm({ ...a.badgeForm, rarity: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{BADGE_RARITIES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Icon</Label><Select value={a.badgeForm.icon_name} onValueChange={(v) => a.setBadgeForm({ ...a.badgeForm, icon_name: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{BADGE_ICONS.map((i) => { const Ic = i.icon; return <SelectItem key={i.value} value={i.value}><div className="flex items-center gap-2"><Ic className="h-4 w-4" />{i.label || i.value}</div></SelectItem> })}</SelectContent></Select></div>
              <div className="grid gap-2"><ColorPicker value={a.badgeForm.color} onChange={(color) => a.setBadgeForm({ ...a.badgeForm, color })} label="Farbe" /></div>
            </div>
            <div className="grid gap-2"><Label>XP</Label><Input type="number" value={a.badgeForm.xp_reward} onChange={(e) => a.setBadgeForm({ ...a.badgeForm, xp_reward: Number(e.target.value) })} min={0} step={25} /></div>
            <div className="flex items-center justify-between"><Label>Aktiv</Label><Switch checked={a.badgeForm.is_active} onCheckedChange={(c) => a.setBadgeForm({ ...a.badgeForm, is_active: c })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => a.setShowBadgeDialog(false)}>Abbrechen</Button><Button onClick={a.handleSaveBadge}><Save className="h-4 w-4 mr-2" />{a.editingBadge ? "Speichern" : "Erstellen"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quiz Dialog */}
      <Dialog open={a.showQuizDialog} onOpenChange={a.setShowQuizDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{a.editingQuiz ? "Quiz bearbeiten" : "Neues Quiz"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Titel</Label><Input value={a.quizForm.title} onChange={(e) => a.setQuizForm({ ...a.quizForm, title: e.target.value })} placeholder="z.B. Hygiene-Grundlagen Quiz" /></div>
            <div className="grid gap-2"><Label>Beschreibung</Label><Textarea value={a.quizForm.description} onChange={(e) => a.setQuizForm({ ...a.quizForm, description: e.target.value })} rows={3} placeholder="Kurze Beschreibung des Quiz..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Quiz-Typ</Label><Select value={a.quizForm.quiz_type} onValueChange={(v) => a.setQuizForm({ ...a.quizForm, quiz_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="multiple_choice">Multiple Choice</SelectItem><SelectItem value="true_false">Wahr/Falsch</SelectItem><SelectItem value="mixed">Gemischt</SelectItem></SelectContent></Select></div>
              <div className="grid gap-2"><Label>Bestehensgrenze (%)</Label><Input type="number" value={a.quizForm.passing_score} onChange={(e) => a.setQuizForm({ ...a.quizForm, passing_score: Number(e.target.value) })} min={0} max={100} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2"><Label>Max. Versuche</Label><Input type="number" value={a.quizForm.max_attempts} onChange={(e) => a.setQuizForm({ ...a.quizForm, max_attempts: Number(e.target.value) })} min={1} /></div>
              <div className="grid gap-2"><Label>Zeitlimit (Min)</Label><Input type="number" value={a.quizForm.time_limit_minutes} onChange={(e) => a.setQuizForm({ ...a.quizForm, time_limit_minutes: Number(e.target.value) })} min={1} /></div>
              <div className="grid gap-2"><Label>XP-Belohnung</Label><Input type="number" value={a.quizForm.xp_reward} onChange={(e) => a.setQuizForm({ ...a.quizForm, xp_reward: Number(e.target.value) })} min={0} step={25} /></div>
            </div>
            <Separator />
            <div className="grid gap-2"><Label>Kurs (optional)</Label><Select value={a.quizForm.course_id} onValueChange={(v) => a.setQuizForm({ ...a.quizForm, course_id: v })}><SelectTrigger><SelectValue placeholder="Kurs auswählen..." /></SelectTrigger><SelectContent><SelectItem value="">Kein Kurs</SelectItem>{a.courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent></Select></div>
            <Separator />
            <div className="flex items-center justify-between"><div><Label>Fragen mischen</Label><p className="text-sm text-muted-foreground">Zufällige Reihenfolge der Fragen</p></div><Switch checked={a.quizForm.randomize_questions} onCheckedChange={(c) => a.setQuizForm({ ...a.quizForm, randomize_questions: c })} /></div>
            <div className="flex items-center justify-between"><div><Label>Antworten anzeigen</Label><p className="text-sm text-muted-foreground">Korrekte Antworten nach Abgabe zeigen</p></div><Switch checked={a.quizForm.show_correct_answers} onCheckedChange={(c) => a.setQuizForm({ ...a.quizForm, show_correct_answers: c })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => a.setShowQuizDialog(false)}>Abbrechen</Button><Button onClick={a.handleSaveQuiz}><Save className="h-4 w-4 mr-2" />{a.editingQuiz ? "Speichern" : "Erstellen"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Course Dialog */}
      <Dialog open={a.showAiCourseDialog} onOpenChange={a.setShowAiCourseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Kurs mit KI erstellen</DialogTitle></DialogHeader>
          {!a.generatedCourse ? (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Kursbeschreibung</Label><Textarea value={a.aiCourseDescription} onChange={(e) => a.setAiCourseDescription(e.target.value)} placeholder="Beschreiben Sie den Kurs..." rows={4} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Kategorie</Label><Select value={a.aiCourseCategory} onValueChange={a.setAiCourseCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid gap-2"><Label>Schwierigkeit</Label><Select value={a.aiCourseDifficulty} onValueChange={a.setAiCourseDifficulty}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DIFFICULTY_LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent></Select></div>
              </div>
            </div>
          ) : (
            <div className="py-4"><Card><CardHeader><CardTitle>{a.generatedCourse.title}</CardTitle><CardDescription>{a.generatedCourse.description}</CardDescription></CardHeader><CardContent><div className="flex items-center gap-2">{diffBadge(a.generatedCourse.difficulty_level)}<Badge variant="outline">{CATEGORIES.find((c) => c.value === a.generatedCourse.category)?.label}</Badge><Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />{a.generatedCourse.estimated_hours}h</Badge></div>
              {a.generatedCourse.modules && <div className="mt-4"><h4 className="font-medium mb-2">Module ({a.generatedCourse.modules.length})</h4><ScrollArea className="h-[200px]"><div className="space-y-2">{a.generatedCourse.modules.map((m: any, i: number) => <div key={i} className="p-2 rounded bg-muted"><p className="font-medium text-sm">{i + 1}. {m.title}</p><p className="text-xs text-muted-foreground">{m.lessons?.length || 0} Lektionen</p></div>)}</div></ScrollArea></div>}
            </CardContent></Card></div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { a.setShowAiCourseDialog(false); a.setGeneratedCourse(null) }}>Abbrechen</Button>
            {!a.generatedCourse ? <Button onClick={a.handleGenerateAiCourse} disabled={a.aiCourseGenerating}>{a.aiCourseGenerating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generiere...</> : <><Wand2 className="h-4 w-4 mr-2" />Generieren</>}</Button> : (
              <div className="flex gap-2"><Button variant="outline" onClick={() => a.setGeneratedCourse(null)}><RefreshCw className="h-4 w-4 mr-2" />Neu</Button><Button onClick={a.handleSaveAiCourse}><Save className="h-4 w-4 mr-2" />Speichern</Button></div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={a.showDeleteDialog} onOpenChange={a.setShowDeleteDialog}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle><AlertDialogDescription>{"Möchten Sie \"" + (a.deleteItem?.name || "") + "\" wirklich löschen?"}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Abbrechen</AlertDialogCancel><AlertDialogAction onClick={a.handleDelete} className="bg-destructive text-destructive-foreground">Löschen</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
