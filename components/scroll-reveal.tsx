"use client"

import { useScrollAnimation, scrollAnimationVariants } from "@/hooks/use-scroll-animation"
import { cn } from "@/lib/utils"
import type { ReactNode, JSX } from "react"
import React from "react"

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  variant?: keyof typeof scrollAnimationVariants
  delay?: number
  duration?: number
  threshold?: number
  as?: keyof JSX.IntrinsicElements
}

export function ScrollReveal({
  children,
  className,
  variant = "fadeUp",
  delay = 0,
  duration = 700,
  threshold = 0.1,
  as: Component = "div",
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({ threshold })
  const animation = scrollAnimationVariants[variant] || scrollAnimationVariants.fadeUp

  return (
    <Component
      ref={ref}
      className={cn("transition-all ease-out", isVisible ? animation.visible : animation.hidden, className)}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </Component>
  )
}

// Staggered children animation wrapper
interface StaggeredRevealProps {
  children: ReactNode
  className?: string
  childClassName?: string
  variant?: keyof typeof scrollAnimationVariants
  staggerDelay?: number
  duration?: number
  threshold?: number
}

export function StaggeredReveal({
  children,
  className,
  childClassName,
  variant = "fadeUp",
  staggerDelay = 100,
  duration = 600,
  threshold = 0.1,
}: StaggeredRevealProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({ threshold })
  const animation = scrollAnimationVariants[variant] || scrollAnimationVariants.fadeUp

  const childrenArray = React.Children.toArray(children).filter(Boolean)

  if (childrenArray.length === 0) {
    return <div ref={ref} className={className} />
  }

  return (
    <div ref={ref} className={className}>
      {childrenArray.map((child, index) => (
        <div
          key={index}
          className={cn("transition-all ease-out", isVisible ? animation.visible : animation.hidden, childClassName)}
          style={{
            transitionDuration: `${duration}ms`,
            transitionDelay: `${index * staggerDelay}ms`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

export default ScrollReveal
