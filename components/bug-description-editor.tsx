"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Image from "@tiptap/extension-image"
import { Button } from "@/components/ui/button"
import { Bold, Italic, List, ListOrdered, Heading2, Heading3, Undo, Redo, ImageIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface BugDescriptionEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  minHeight?: string
}

// Helper function to upload file via API
async function uploadFileToServer(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Upload failed")
  }

  const data = await response.json()
  return data.url
}

export function BugDescriptionEditor({
  content,
  onChange,
  placeholder = "Beschreiben Sie das Problem im Detail...",
  minHeight = "200px",
}: BugDescriptionEditorProps) {
  const [isClient, setIsClient] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg border my-2",
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none dark:prose-invert",
          "prose-headings:font-semibold prose-headings:text-foreground",
          "prose-h2:text-lg prose-h2:mb-2 prose-h2:mt-4",
          "prose-h3:text-base prose-h3:mb-2 prose-h3:mt-3",
          "prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-3",
          "prose-ul:my-3 prose-ul:space-y-1 prose-ol:my-3 prose-ol:space-y-1",
          "prose-li:text-foreground prose-li:marker:text-muted-foreground",
          "prose-img:max-w-full prose-img:h-auto prose-img:rounded-lg prose-img:border prose-img:my-2",
        ),
        style: `min-height: ${minHeight}; padding: 12px;`,
      },
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || [])
        const imageItems = items.filter((item) => item.type.startsWith("image/"))

        if (imageItems.length > 0) {
          event.preventDefault()
          
          imageItems.forEach(async (item) => {
            const file = item.getAsFile()
            if (file && editor) {
              setUploadingImage(true)
              try {
                const url = await uploadFileToServer(file)
                
                // Insert image at current cursor position
                editor.chain().focus().setImage({ src: url }).run()
                
                toast({
                  title: "Erfolg",
                  description: "Bild erfolgreich eingefügt",
                })
              } catch (error) {
                console.error("[v0] Error uploading pasted image:", error)
                toast({
                  title: "Fehler",
                  description: "Bild konnte nicht hochgeladen werden",
                  variant: "destructive",
                })
              } finally {
                setUploadingImage(false)
              }
            }
          })
          
          return true
        }
        
        return false
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [editor, content])

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !editor) return

    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"))

    if (imageFiles.length === 0) {
      toast({
        title: "Fehler",
        description: "Bitte laden Sie nur Bilddateien hoch",
        variant: "destructive",
      })
      return
    }

    setUploadingImage(true)
    try {
      for (const file of imageFiles) {
        const url = await uploadFileToServer(file)
        editor.chain().focus().setImage({ src: url }).run()
      }

      toast({
        title: "Erfolg",
        description: `${imageFiles.length} Bild(er) eingefügt`,
      })
    } catch (error) {
      console.error("[v0] Error uploading image:", error)
      toast({
        title: "Fehler",
        description: "Bilder konnten nicht hochgeladen werden",
        variant: "destructive",
      })
    } finally {
      setUploadingImage(false)
      // Reset the input
      e.target.value = ""
    }
  }, [editor, toast])

  if (!isClient || !editor) {
    return (
      <div
        className="border rounded-lg bg-muted/30 flex items-center justify-center text-muted-foreground text-sm"
        style={{ minHeight }}
      >
        Editor wird geladen...
      </div>
    )
  }

  const ToolbarButton = ({
    onClick,
    isActive,
    disabled,
    children,
    title,
  }: {
    onClick: () => void
    isActive?: boolean
    disabled?: boolean
    children: React.ReactNode
    title: string
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn("h-8 w-8 p-0", isActive && "bg-primary/10 text-primary")}
    >
      {children}
    </Button>
  )

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b bg-muted/30">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Fett (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Kursiv (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          title="Überschrift 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive("heading", { level: 3 })}
          title="Überschrift 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Aufzählung"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Nummerierte Liste"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        <label>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            disabled={uploadingImage}
            multiple
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={uploadingImage}
            title="Bild einfügen"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.preventDefault()
              e.currentTarget.previousElementSibling?.dispatchEvent(new MouseEvent('click'))
            }}
          >
            {uploadingImage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
          </Button>
        </label>

        <div className="flex-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Rückgängig (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Wiederholen (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Hint about paste */}
      <div className="px-3 py-2 border-t bg-muted/20">
        <p className="text-xs text-muted-foreground">
          💡 Tipp: Drücken Sie <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted border rounded">Strg+V</kbd> zum Einfügen von Bildern aus der Zwischenablage
        </p>
      </div>

      {/* Styling for placeholder */}
      <style jsx global>{`
        .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
          opacity: 0.5;
        }
      `}</style>
    </div>
  )
}

export default BugDescriptionEditor
