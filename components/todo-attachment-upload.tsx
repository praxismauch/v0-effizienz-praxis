"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, LinkIcon, X, FileText, ChevronDown } from "lucide-react"
import { put } from "@vercel/blob"
import { useToast } from "@/hooks/use-toast"
import type { TodoAttachment } from "@/contexts/todo-context"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface TodoAttachmentUploadProps {
  attachments: TodoAttachment[]
  onAttachmentsChange: (attachments: TodoAttachment[]) => void
  practiceId: string
  todoId?: string
}

export function TodoAttachmentUpload({
  attachments,
  onAttachmentsChange,
  practiceId,
  todoId,
}: TodoAttachmentUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkTitle, setLinkTitle] = useState("")
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const { toast } = useToast()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    await handleFiles(files)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    await handleFiles(files)
    e.target.value = ""
  }

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return

    setIsUploading(true)

    try {
      const newAttachments: TodoAttachment[] = []

      for (const file of files) {
        // Upload to Vercel Blob
        const blob = await put(`todos/${practiceId}/${Date.now()}-${file.name}`, file, {
          access: "public",
        })

        const attachment: TodoAttachment = {
          id: `temp-${Date.now()}-${Math.random()}`,
          todo_id: todoId || "",
          practice_id: practiceId,
          attachment_type: "file",
          file_name: file.name,
          file_url: blob.url,
          file_type: file.type,
          file_size: file.size,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        newAttachments.push(attachment)
      }

      onAttachmentsChange([...attachments, ...newAttachments])

      toast({
        title: "Dateien hochgeladen",
        description: `${files.length} Datei(en) erfolgreich hochgeladen`,
      })
    } catch (error) {
      console.error("[v0] Error uploading files:", error)
      toast({
        title: "Fehler",
        description: "Dateien konnten nicht hochgeladen werden",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddLink = () => {
    if (!linkUrl.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine URL ein",
        variant: "destructive",
      })
      return
    }

    const attachment: TodoAttachment = {
      id: `temp-${Date.now()}-${Math.random()}`,
      todo_id: todoId || "",
      practice_id: practiceId,
      attachment_type: "link",
      link_url: linkUrl,
      link_title: linkTitle || linkUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    onAttachmentsChange([...attachments, attachment])
    setLinkUrl("")
    setLinkTitle("")

    toast({
      title: "Link hinzugefügt",
      description: "Link wurde erfolgreich hinzugefügt",
    })
  }

  const handleRemoveAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter((att) => att.id !== id))
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
  }

  return (
    <div className="space-y-4">
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full flex items-center justify-between bg-transparent" type="button">
            <span>Erweiterte Einstellungen</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-4 pt-4">
          <div className="space-y-4">
            <Label>Dateien</Label>

            {/* File Upload Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-6 transition-colors
                ${isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}
                ${isUploading ? "opacity-50 pointer-events-none" : ""}
              `}
            >
              <input
                id="todo-file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              <label htmlFor="todo-file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {isUploading ? "Hochladen..." : "Dateien hierher ziehen oder klicken"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Unterstützt werden alle Dateitypen</p>
                  </div>
                </div>
              </label>
            </div>

            {/* Link Input */}
            <div className="space-y-2">
              <Label>Link</Label>
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Link-URL eingeben..."
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddLink()
                      }
                    }}
                  />
                  <Input
                    placeholder="Link-Titel (optional)"
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddLink()
                      }
                    }}
                  />
                </div>
                <Button type="button" onClick={handleAddLink} className="mt-0">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Link hinzufügen
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Attachments List - Keep outside collapsible so always visible */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            {attachments.length} Anhang{attachments.length !== 1 ? "e" : ""}
          </Label>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {attachment.attachment_type === "file" ? (
                    <>
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(attachment.file_size)}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{attachment.link_title}</p>
                        <p className="text-xs text-muted-foreground truncate">{attachment.link_url}</p>
                      </div>
                    </>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveAttachment(attachment.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TodoAttachmentUpload
