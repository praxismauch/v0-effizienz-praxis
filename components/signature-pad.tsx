"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Eraser, Download } from "lucide-react"

interface SignaturePadProps {
  width?: number
  height?: number
  onSignatureChange?: (signatureData: string | null) => void
  disabled?: boolean
  existingSignature?: string | null
}

export function SignaturePad({
  width = 600,
  height = 200,
  onSignatureChange,
  disabled = false,
  existingSignature = null,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set up canvas for high DPI displays
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    // Fill with white background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, width, height)

    // Draw existing signature if provided
    if (existingSignature) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height)
        setHasSignature(true)
      }
      img.src = existingSignature
    }
  }, [width, height, existingSignature])

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = width / rect.width
    const scaleY = height / rect.height

    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return
    e.preventDefault()
    setIsDrawing(true)

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { x, y } = getCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return
    e.preventDefault()

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { x, y } = getCoordinates(e)
    ctx.lineTo(x, y)
    ctx.strokeStyle = "#1a1a2e"
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      emitSignature()
    }
  }

  const emitSignature = () => {
    const canvas = canvasRef.current
    if (!canvas || !onSignatureChange) return

    if (hasSignature) {
      const signatureData = canvas.toDataURL("image/png")
      onSignatureChange(signatureData)
    } else {
      onSignatureChange(null)
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, width, height)
    setHasSignature(false)

    if (onSignatureChange) {
      onSignatureChange(null)
    }
  }

  const downloadSignature = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasSignature) return

    const link = document.createElement("a")
    link.download = `unterschrift-${new Date().toISOString().split("T")[0]}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Unterschrift</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSignature}
            disabled={disabled || !hasSignature}
          >
            <Eraser className="h-4 w-4 mr-1" />
            Löschen
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={downloadSignature}
            disabled={disabled || !hasSignature}
          >
            <Download className="h-4 w-4 mr-1" />
            Speichern
          </Button>
        </div>
      </div>
      <div className="border-2 border-dashed rounded-lg p-1 bg-muted/20">
        <canvas
          ref={canvasRef}
          className="border bg-white rounded cursor-crosshair w-full touch-none"
          style={{ maxWidth: "100%", height: "auto", aspectRatio: `${width}/${height}` }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Unterschreiben Sie mit der Maus oder dem Finger (auf Touch-Geräten)
      </p>
    </div>
  )
}

export default SignaturePad
