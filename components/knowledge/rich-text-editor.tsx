"use client"

import type React from "react"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Button } from "@/components/ui/button"
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Undo, Redo, Sparkles } from "lucide-react"
import { useCallback, useState, useEffect } from "react"
import { AIWritingAssistant } from "./ai-writing-assistant"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  articleTitle?: string
}

export function RichTextEditor({ content, onChange, placeholder, articleTitle }: RichTextEditorProps) {
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[200px] p-4 focus:outline-none border rounded-md dark:prose-invert prose-headings:font-bold prose-headings:text-foreground prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-6 prose-h1:border-b prose-h1:pb-2 prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-5 prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-4 prose-p:text-foreground prose-p:leading-7 prose-p:mb-4 prose-strong:text-foreground prose-strong:font-semibold prose-ul:my-4 prose-ul:space-y-2 prose-ol:my-4 prose-ol:space-y-2 prose-li:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-muted prose-pre:border prose-pre:p-4 prose-pre:rounded-lg prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic",
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [editor, content])

  const handleInsertAIContent = useCallback(
    (aiContent: string) => {
      if (!editor) return
      editor.chain().focus().insertContent(aiContent).run()
    },
    [editor],
  )

  const executeCommand = useCallback(
    (callback: () => void) => {
      if (!editor) return
      // Ensure editor has focus before executing command
      editor.chain().focus()
      callback()
    },
    [editor],
  )

  if (!isClient || !editor) {
    return (
      <div className="border rounded-md p-4 min-h-[200px] flex items-center justify-center text-muted-foreground">
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
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
      disabled={disabled}
      title={title}
      className={cn("h-8 w-8 p-0", isActive && "bg-muted text-primary")}
    >
      {children}
    </Button>
  )

  return (
    <>
      <div className="border rounded-md">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAIAssistant(true)}
            className="border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/30 transition-colors"
          >
            <Sparkles className="h-4 w-4 mr-1 text-primary" />
            <span className="text-xs text-primary font-medium">KI-Assistent</span>
          </Button>

          <div className="w-px h-6 bg-border mx-1 self-center" />

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

          <div className="w-px h-6 bg-border mx-1 self-center" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive("heading", { level: 1 })}
            title="Überschrift 1"
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
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

          <div className="w-px h-6 bg-border mx-1 self-center" />

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

          <div className="w-px h-6 bg-border mx-1 self-center" />

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
      </div>

      {showAIAssistant && (
        <AIWritingAssistant
          open={showAIAssistant}
          onOpenChange={setShowAIAssistant}
          onInsert={handleInsertAIContent}
          currentContent={editor.getHTML()}
          defaultPrompt={articleTitle}
        />
      )}
    </>
  )
}
