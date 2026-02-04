"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { usePractice } from "@/contexts/practice-context"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { isActiveMember } from "@/lib/utils/team-member-filter"
import { Link2, ClipboardList, Plus, Trash2, Loader2, Sparkles, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface Responsibility {
  id: string
  name: string
  description?: string
  responsible_user_id?: string
  responsible_user_name?: string
}

interface TodoEntry {
  id: string
  title: string
  description: string
  priority: "low" | "medium" | "high"
  due_date: string
  dringend: boolean
  wichtig: boolean
  assigned_user_ids: string[]
}

interface CreateMultipleTodosDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  responsibility: Responsibility
  onSuccess?: () => void
}

const createEmptyTodo = (): TodoEntry => ({
  id: crypto.randomUUID(),
  title: "",
  description: "",
  priority: "medium",
  due_date: "",
  dringend: false,
  wichtig: false,
  assigned_user_ids: [],
})

export function CreateMultipleTodosDialog({
  open,
  onOpenChange,
  responsibility,
  onSuccess,
}: CreateMultipleTodosDialogProps) {
  const { currentPractice } = usePractice()
  const { toast } = useToast()
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [todos, setTodos] = useState<TodoEntry[]>([createEmptyTodo()])
  const [createdCount, setCreatedCount] = useState(0)

  // Reset form when dialog opens
  useEffect(() => {
    if (open && responsibility) {
      const initialTodo = createEmptyTodo()
      // Pre-assign to responsible user if available
      if (responsibility.responsible_user_id) {
        initialTodo.assigned_user_ids = [responsibility.responsible_user_id]
      }
      setTodos([initialTodo])
      setCreatedCount(0)
    }
  }, [open, responsibility])

  // Fetch team members when dialog opens
  useEffect(() => {
    if (open && currentPractice?.id) {
      fetch(`/api/practices/${currentPractice.id}/team-members`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
          return res.json()
        })
        .then((data) => {
          setTeamMembers(Array.isArray(data) ? data : [])
        })
        .catch((err) => {
          console.error("Error fetching team members:", err)
          setTeamMembers([])
        })
    }
  }, [open, currentPractice?.id])

  const addTodo = () => {
    const newTodo = createEmptyTodo()
    // Copy assigned users from first todo if available
    if (todos.length > 0 && todos[0].assigned_user_ids.length > 0) {
      newTodo.assigned_user_ids = [...todos[0].assigned_user_ids]
    } else if (responsibility.responsible_user_id) {
      newTodo.assigned_user_ids = [responsibility.responsible_user_id]
    }
    setTodos([...todos, newTodo])
  }

  const removeTodo = (id: string) => {
    if (todos.length > 1) {
      setTodos(todos.filter((t) => t.id !== id))
    }
  }

  const updateTodo = (id: string, field: keyof TodoEntry, value: any) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, [field]: value } : t)))
  }

  const generateAISuggestions = async () => {
    if (!responsibility.name) return

    setIsGenerating(true)
    try {
      const response = await fetch("/api/ai/generate-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responsibility_name: responsibility.name,
          responsibility_description: responsibility.description || "",
          practice_id: currentPractice?.id,
        }),
      })

      if (!response.ok) {
        throw new Error("KI-Generierung fehlgeschlagen")
      }

      const data = await response.json()
      
      if (data.tasks && Array.isArray(data.tasks) && data.tasks.length > 0) {
        const generatedTodos: TodoEntry[] = data.tasks.map((task: any) => ({
          id: crypto.randomUUID(),
          title: task.title || "",
          description: task.description || "",
          priority: task.priority || "medium",
          due_date: "",
          dringend: false,
          wichtig: task.priority === "high",
          assigned_user_ids: responsibility.responsible_user_id ? [responsibility.responsible_user_id] : [],
        }))
        setTodos(generatedTodos)
        toast({
          title: "KI-Vorschläge generiert",
          description: `${generatedTodos.length} Aufgaben wurden vorgeschlagen`,
        })
      }
    } catch (error) {
      console.error("Error generating AI suggestions:", error)
      toast({
        title: "Fehler",
        description: "KI-Vorschläge konnten nicht generiert werden",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveAll = async () => {
    // Validate at least one todo has a title
    const validTodos = todos.filter((t) => t.title.trim())
    if (validTodos.length === 0) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie mindestens eine Aufgabe mit Titel ein",
        variant: "destructive",
      })
      return
    }

    if (!currentPractice?.id) {
      toast({
        title: "Fehler",
        description: "Keine Praxis ausgewählt",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setCreatedCount(0)

    try {
      let successCount = 0

      for (const todo of validTodos) {
        const todoData = {
          title: todo.title,
          description: todo.description,
          priority: todo.priority,
          due_date: todo.due_date || null,
          dringend: todo.dringend,
          wichtig: todo.wichtig,
          assigned_user_ids: todo.assigned_user_ids,
          completed: false,
          responsibility_id: responsibility.id,
        }

        const response = await fetch(`/api/practices/${currentPractice.id}/todos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(todoData),
        })

        if (response.ok) {
          successCount++
          setCreatedCount(successCount)
        }
      }

      if (successCount === validTodos.length) {
        toast({
          title: "Erfolg",
          description: `${successCount} Aufgabe${successCount > 1 ? "n" : ""} wurde${successCount > 1 ? "n" : ""} erstellt`,
        })
        setTodos([createEmptyTodo()])
        onOpenChange(false)
        onSuccess?.()
      } else if (successCount > 0) {
        toast({
          title: "Teilweise erfolgreich",
          description: `${successCount} von ${validTodos.length} Aufgaben wurden erstellt`,
          variant: "destructive",
        })
      } else {
        throw new Error("Keine Aufgaben konnten erstellt werden")
      }
    } catch (error) {
      console.error("Error creating todos:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Aufgaben konnten nicht erstellt werden",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const activeMembers = teamMembers.filter(isActiveMember)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Mehrere Aufgaben erstellen
          </DialogTitle>
          <DialogDescription>
            Erstellen Sie mehrere Aufgaben auf einmal, die mit dieser Zuständigkeit verknüpft werden.
          </DialogDescription>
        </DialogHeader>

        {/* Linked Responsibility Info */}
        <div className="bg-muted/50 rounded-lg p-3 border flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Link2 className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Verknüpft mit:</span>
            <Badge variant="secondary" className="font-medium">
              {responsibility.name}
            </Badge>
            {responsibility.responsible_user_name && (
              <span className="text-xs text-muted-foreground">
                ({responsibility.responsible_user_name})
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={generateAISuggestions}
            disabled={isGenerating || isSubmitting}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            KI-Vorschläge
          </Button>
        </div>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-4 py-2">
            {todos.map((todo, index) => (
              <Card key={todo.id} className="relative">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0 mt-1">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Aufgabentitel *"
                          value={todo.title}
                          onChange={(e) => updateTodo(todo.id, "title", e.target.value)}
                          className="flex-1"
                        />
                        <Select
                          value={todo.priority}
                          onValueChange={(value: any) => updateTodo(todo.id, "priority", value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Niedrig</SelectItem>
                            <SelectItem value="medium">Mittel</SelectItem>
                            <SelectItem value="high">Hoch</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="date"
                          value={todo.due_date}
                          onChange={(e) => updateTodo(todo.id, "due_date", e.target.value)}
                          className="w-40"
                        />
                      </div>

                      <Textarea
                        placeholder="Beschreibung (optional)"
                        value={todo.description}
                        onChange={(e) => updateTodo(todo.id, "description", e.target.value)}
                        rows={2}
                        className="resize-none"
                      />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer text-sm">
                            <Checkbox
                              checked={todo.dringend}
                              onCheckedChange={(checked) => updateTodo(todo.id, "dringend", checked)}
                            />
                            Dringend
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-sm">
                            <Checkbox
                              checked={todo.wichtig}
                              onCheckedChange={(checked) => updateTodo(todo.id, "wichtig", checked)}
                            />
                            Wichtig
                          </label>
                        </div>

                        {/* Assignees */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Zugewiesen:</span>
                          <Select
                            value={todo.assigned_user_ids[0] || "none"}
                            onValueChange={(value) =>
                              updateTodo(todo.id, "assigned_user_ids", value === "none" ? [] : [value])
                            }
                          >
                            <SelectTrigger className="w-40 h-8 text-xs">
                              <SelectValue placeholder="Niemand" />
                            </SelectTrigger>
                            <SelectContent position="popper" className="max-h-[300px]">
                              <SelectItem value="none">Niemand</SelectItem>
                              {activeMembers.map((member) => {
                                const memberId = member.user_id || member.id || member.team_member_id
                                if (!memberId) return null
                                return (
                                  <SelectItem key={memberId} value={memberId}>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-4 w-4">
                                        <AvatarImage src={member.avatar || ""} />
                                        <AvatarFallback className="text-[8px]">
                                          {member.name
                                            ?.split(" ")
                                            .map((n: string) => n[0])
                                            .join("")
                                            .slice(0, 2)
                                            .toUpperCase() || "TM"}
                                        </AvatarFallback>
                                      </Avatar>
                                      {member.name || member.email}
                                    </div>
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {todos.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => removeTodo(todo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={addTodo} disabled={isSubmitting}>
            <Plus className="h-4 w-4 mr-2" />
            Weitere Aufgabe
          </Button>

          <div className="flex items-center gap-3">
            {isSubmitting && createdCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {createdCount} erstellt
              </div>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveAll} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Erstelle...
                </>
              ) : (
                <>
                  {todos.filter((t) => t.title.trim()).length} Aufgabe
                  {todos.filter((t) => t.title.trim()).length !== 1 ? "n" : ""} erstellen
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
