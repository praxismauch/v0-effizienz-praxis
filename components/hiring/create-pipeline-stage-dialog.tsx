"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { usePractice } from "@/contexts/practice-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ColorPicker } from "@/components/color-picker"

interface JobPosting {
  id: string
  title: string
}

interface CreatePipelineStageDialogProps {
  onStageCreated: () => void
}

function CreatePipelineStageDialog({ onStageCreated }: CreatePipelineStageDialogProps) {
  const { currentPractice } = usePractice()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
  const [formData, setFormData] = useState({
    name: "",
    color: "#6b7280",
    description: "",
    stage_order: 0,
    job_posting_id: "",
  })

  useEffect(() => {
    if (open && currentPractice?.id) {
      loadJobPostings()
    }
  }, [open, currentPractice?.id])

  const loadJobPostings = async () => {
    try {
      const response = await fetch(`/api/hiring/job-postings?practiceId=${currentPractice?.id}`)
      if (response.ok) {
        const data = await response.json()
        setJobPostings(data)
      }
    } catch (error) {
      console.error("Error loading job postings:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/hiring/pipeline-stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          practice_id: currentPractice?.id,
        }),
      })

      if (response.ok) {
        setOpen(false)
        setFormData({ name: "", color: "#6b7280", description: "", stage_order: 0, job_posting_id: "" })
        onStageCreated()
      }
    } catch (error) {
      console.error("Error creating pipeline stage:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Neue Phase
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Neue Pipeline-Phase erstellen</DialogTitle>
            <DialogDescription>Fügen Sie eine neue Phase zur Einstellungs-Pipeline hinzu.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Screening, Interview"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_posting_id">Stelle *</Label>
              <Select
                value={formData.job_posting_id}
                onValueChange={(value) => setFormData({ ...formData, job_posting_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Stelle auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {jobPostings
                    .filter((job) => job.id && job.id.trim() !== "")
                    .map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <ColorPicker
              value={formData.color}
              onChange={(color) => setFormData({ ...formData, color })}
              label="Farbe"
              id="color"
            />

            <div className="space-y-2">
              <Label htmlFor="stage_order">Reihenfolge</Label>
              <Input
                id="stage_order"
                type="number"
                value={formData.stage_order}
                onChange={(e) => setFormData({ ...formData, stage_order: Number.parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Beschreiben Sie diese Phase..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Erstelle..." : "Erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreatePipelineStageDialog
