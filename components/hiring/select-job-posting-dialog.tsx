'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface JobPosting {
  id: string
  title: string
  department?: string
  status: string
}

interface SelectJobPostingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (jobPostingId: string) => void
  practiceId: string
}

export function SelectJobPostingDialog({
  open,
  onOpenChange,
  onSelect,
  practiceId,
}: SelectJobPostingDialogProps) {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
  const [selectedJobPostingId, setSelectedJobPostingId] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && practiceId) {
      loadJobPostings()
    }
  }, [open, practiceId])

  const loadJobPostings = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/hiring/job-postings?practiceId=${practiceId}`
      )
      if (response.ok) {
        const data = await response.json()
        setJobPostings(data.filter((posting: JobPosting) => posting.status === 'open'))
      }
    } catch (error) {
      console.error('Error loading job postings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => {
    if (selectedJobPostingId) {
      onSelect(selectedJobPostingId)
      onOpenChange(false)
      setSelectedJobPostingId('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stellenausschreibung auswählen</DialogTitle>
          <DialogDescription>
            Bitte wählen Sie eine Stellenausschreibung für diese Bewerbung aus.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="job-posting">Stellenausschreibung *</Label>
            <Select
              value={selectedJobPostingId}
              onValueChange={setSelectedJobPostingId}
              disabled={loading}
            >
              <SelectTrigger id="job-posting">
                <SelectValue placeholder="Stelle auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {jobPostings.length === 0 && !loading && (
                  <div className="p-2 text-sm text-muted-foreground">
                    Keine offenen Stellen verfügbar
                  </div>
                )}
                {jobPostings.map((posting) => (
                  <SelectItem key={posting.id} value={posting.id}>
                    {posting.title}
                    {posting.department && ` - ${posting.department}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedJobPostingId || loading}>
            Auswählen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
