"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface VoiceLevelIndicatorProps {
  stream: MediaStream | null
  isActive: boolean
  className?: string
}

export function VoiceLevelIndicator({ stream, isActive, className }: VoiceLevelIndicatorProps) {
  const [level, setLevel] = useState(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!stream || !isActive) {
      // Cleanup and reset
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      analyserRef.current = null
      setLevel(0)
      return
    }

    // Setup audio analysis
    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    const microphone = audioContext.createMediaStreamSource(stream)

    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.8
    microphone.connect(analyser)

    audioContextRef.current = audioContext
    analyserRef.current = analyser

    // Analyze audio levels
    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const updateLevel = () => {
      if (!analyserRef.current) return

      analyserRef.current.getByteFrequencyData(dataArray)

      // Calculate average volume
      const sum = dataArray.reduce((a, b) => a + b, 0)
      const average = sum / dataArray.length
      const normalizedLevel = Math.min(100, (average / 255) * 100)

      setLevel(normalizedLevel)
      animationFrameRef.current = requestAnimationFrame(updateLevel)
    }

    updateLevel()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContext.state !== "closed") {
        audioContext.close()
      }
    }
  }, [stream, isActive])

  // Create bars based on level
  const bars = Array.from({ length: 12 }, (_, i) => {
    const threshold = (i + 1) * (100 / 12)
    const isActive = level >= threshold
    const color = threshold < 40 ? "bg-green-500" : threshold < 70 ? "bg-yellow-500" : "bg-red-500"

    return { isActive, color }
  })

  return (
    <div className={cn("flex items-end gap-1 h-16", className)}>
      {bars.map((bar, i) => (
        <div
          key={i}
          className={cn(
            "w-2 rounded-t-sm transition-all duration-100",
            bar.isActive ? bar.color : "bg-gray-300 dark:bg-gray-700",
          )}
          style={{
            height: `${((i + 1) / 12) * 100}%`,
            opacity: bar.isActive ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  )
}

export default VoiceLevelIndicator
