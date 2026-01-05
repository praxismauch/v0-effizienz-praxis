"use client"

import { useEffect } from "react"

export function GlobalDragPrevention() {
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      // Allow drag/drop on input elements, elements with onDrop, or elements in dialogs
      const target = e.target as HTMLElement

      // Check if the target or any parent has a drop handler
      let element: HTMLElement | null = target
      while (element) {
        // Allow drop if element has ondrop handler or is a file input
        if (
          element.ondrop ||
          element.getAttribute("ondrop") ||
          element.tagName === "INPUT" ||
          element.closest('[data-droppable="true"]') ||
          element.closest('[role="dialog"]')
        ) {
          return
        }
        element = element.parentElement
      }

      // Only prevent default on body or elements without drop handlers
      e.preventDefault()
      e.stopPropagation()
    }

    // Prevent default drag behaviors on the entire document
    window.addEventListener("dragover", preventDefaults, false)
    window.addEventListener("drop", preventDefaults, false)

    return () => {
      window.removeEventListener("dragover", preventDefaults, false)
      window.removeEventListener("drop", preventDefaults, false)
    }
  }, [])

  return null
}

export default GlobalDragPrevention
