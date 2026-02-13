"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Sparkles, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  prompt: string
  description?: string
}

export function PromptDialog({ open, onOpenChange, title, prompt, description }: PromptDialogProps) {
  const { toast } = useToast()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Kopiert!", description: "In die Zwischenablage kopiert" })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description || "Kopieren Sie diese Empfehlungen und fuegen Sie sie in v0 ein, um die Probleme automatisch zu beheben."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <ScrollArea className="h-[400px]">
            <pre className="p-4 bg-muted rounded-lg text-sm font-mono whitespace-pre-wrap">{prompt}</pre>
          </ScrollArea>
          <Button className="w-full" onClick={() => copyToClipboard(prompt)}>
            <Copy className="mr-2 h-4 w-4" />
            In Zwischenablage kopieren
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
