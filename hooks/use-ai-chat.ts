"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { useToast } from "@/hooks/use-toast"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  imageUrl?: string
}

export type { Message }

export function useAIChat(open: boolean, initialMessage?: string) {
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()
  const { toast } = useToast()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ url: string; file: File } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Paste handler for images
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!open) return
      const items = e.clipboardData?.items
      if (!items) return
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          e.preventDefault()
          const file = items[i].getAsFile()
          if (file) await handleImageSelect(file)
          break
        }
      }
    }
    document.addEventListener("paste", handlePaste)
    return () => document.removeEventListener("paste", handlePaste)
  }, [open])

  // Set initial message when opening
  useEffect(() => {
    if (open && initialMessage) {
      setInput(initialMessage)
    }
  }, [open, initialMessage])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find((file) => file.type.startsWith("image/"))
    if (imageFile) {
      await handleImageSelect(imageFile)
    } else if (files.length > 0) {
      toast({ title: "Ungültiger Dateityp", description: "Bitte wählen Sie eine Bilddatei.", variant: "destructive" })
    }
  }, [toast])

  const handleImageSelect = useCallback(async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Datei zu groß", description: "Bilder dürfen maximal 10MB groß sein.", variant: "destructive" })
      return
    }
    const previewUrl = URL.createObjectURL(file)
    setSelectedImage({ url: previewUrl, file })
  }, [toast])

  const clearSelectedImage = useCallback(() => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage.url)
      setSelectedImage(null)
    }
  }, [selectedImage])

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true)
      const { compressImageIfLarge } = await import("@/lib/image-compression")
      const compressedFile = file.type.startsWith("image/") ? await compressImageIfLarge(file) : file
      const formData = new FormData()
      formData.append("file", compressedFile)
      formData.append("type", "chatImage")
      const response = await fetch("/api/upload/unified", { method: "POST", body: formData })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload fehlgeschlagen")
      }
      const data = await response.json()
      return data.url
    } catch (error) {
      console.error("[v0] Image upload error:", error)
      toast({ title: "Bild-Upload fehlgeschlagen", description: error instanceof Error ? error.message : "Unbekannter Fehler", variant: "destructive" })
      return null
    } finally {
      setUploadingImage(false)
    }
  }, [toast])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && !selectedImage) || loading) return

    const practiceId = currentPractice?.id
    if (!practiceId) {
      toast({ title: "Keine Praxis ausgewählt", description: "Bitte wählen Sie eine Praxis aus.", variant: "destructive" })
      return
    }

    let imageUrl: string | undefined
    if (selectedImage) {
      imageUrl = (await uploadImage(selectedImage.file)) || undefined
      if (!imageUrl) return
      URL.revokeObjectURL(selectedImage.url)
    }

    const userMessage: Message = { role: "user", content: input.trim() || "(Bild gesendet)", timestamp: new Date(), imageUrl }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setSelectedImage(null)
    setLoading(true)

    try {
      const response = await fetch("/api/ai-analysis/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practiceId,
          userId: currentUser?.id,
          message: userMessage.content,
          history: messages.slice(-5),
          imageUrl,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        const errorMessage: Message = {
          role: "assistant",
          content: `Fehler: ${errorData.error || `HTTP ${response.status}: ${response.statusText}`}\n\n${errorData.suggestion || "Bitte versuchen Sie es später erneut oder kontaktieren Sie den Support."}`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
        return
      }

      const data = await response.json()
      setMessages((prev) => [...prev, { role: "assistant", content: data.response, timestamp: new Date() }])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler"
      toast({ title: "Fehler", description: `Die Nachricht konnte nicht gesendet werden: ${errorMessage}`, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [input, selectedImage, loading, currentPractice, currentUser, messages, uploadImage, toast])

  return {
    messages, input, setInput, loading, uploadingImage, selectedImage, isDragging,
    scrollRef, fileInputRef, formRef, currentUser,
    handleDragOver, handleDragLeave, handleDrop,
    handleImageSelect, clearSelectedImage, handleSubmit,
  }
}
