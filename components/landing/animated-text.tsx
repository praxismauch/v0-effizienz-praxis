"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

// Animated text component with gradient shimmer
export function AnimatedGradientText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span 
      className={cn(
        "relative inline-block bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent",
        "animate-gradient-x bg-[length:200%_auto]",
        className
      )}
      style={{
        animation: "gradient-shift 3s ease infinite",
      }}
    >
      {children}
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </span>
  )
}

// Typewriter effect for hero text
export function TypewriterText({ text, className }: { text: string; className?: string }) {
  const [displayedText, setDisplayedText] = useState("")
  const [isComplete, setIsComplete] = useState(false)
  
  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      if (index <= text.length) {
        setDisplayedText(text.slice(0, index))
        index++
      } else {
        clearInterval(timer)
        setIsComplete(true)
      }
    }, 50)
    
    return () => clearInterval(timer)
  }, [text])
  
  return (
    <span className={cn("relative", className)}>
      <span 
        className={cn(
          "bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent",
          isComplete && "animate-pulse-subtle"
        )}
        style={isComplete ? {
          animation: "gradient-shift 3s ease infinite",
          backgroundSize: "200% auto",
        } : undefined}
      >
        {displayedText}
      </span>
      {!isComplete && (
        <span className="inline-block w-[3px] h-[1em] bg-primary animate-blink ml-1 align-middle" />
      )}
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 0.8s step-end infinite;
        }
      `}</style>
    </span>
  )
}
