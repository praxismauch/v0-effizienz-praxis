export function formatInterviewContentForPrint(content: string): string {
  const lines = content.split("\n")
  const result: string[] = []
  let currentList: string[] = []
  let listType: "ul" | "ol" | null = null

  const flushList = () => {
    if (currentList.length > 0) {
      const listTag = listType === "ol" ? "ol" : "ul"
      const listClass = listType === "ol" ? "numbered-list" : "bullet-list"
      result.push(`<${listTag} class="${listClass}">`)
      currentList.forEach((item) => {
        result.push(`<li>${formatInlineText(item)}</li>`)
      })
      result.push(`</${listTag}>`)
      currentList = []
      listType = null
    }
  }

  const formatInlineText = (text: string) => {
    // Convert **bold** to <strong>
    return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  }

  lines.forEach((line) => {
    const trimmed = line.trim()

    // Empty line
    if (!trimmed) {
      flushList()
      result.push('<div class="spacer"></div>')
      return
    }

    // Main section headers (e.g., **1. EINLEITUNG & KENNENLERNEN**)
    if (/^\*\*\d+\.\s+[A-ZÄÖÜ\s&]+\*\*$/.test(trimmed)) {
      flushList()
      const text = trimmed.replace(/^\*\*|\*\*$/g, "")
      result.push(`<h3 class="section-header">${text}</h3>`)
      return
    }

    // Subsection headers (e.g., - **Begrüßung und Vorstellung**)
    if (/^-\s+\*\*(.+?)\*\*$/.test(trimmed)) {
      flushList()
      const text = trimmed.replace(/^-\s+\*\*|\*\*$/g, "")
      result.push(`<h4 class="subsection-header">${text}</h4>`)
      return
    }

    // Title headers (e.g., **Interviewleitfaden für die Position: [Positionstitel]**)
    if (trimmed.startsWith("**") && trimmed.endsWith("**") && !trimmed.match(/^\*\*\d+\./)) {
      flushList()
      const text = trimmed.replace(/^\*\*|\*\*$/g, "")
      result.push(`<h2 class="title-header">${text}</h2>`)
      return
    }

    // Numbered list item (e.g., "1. Item")
    if (/^\d+\.\s+/.test(trimmed)) {
      if (listType !== "ol") {
        flushList()
        listType = "ol"
      }
      currentList.push(trimmed.replace(/^\d+\.\s+/, ""))
      return
    }

    // Bullet list item (e.g., "- Item")
    if (/^-\s+/.test(trimmed)) {
      if (listType !== "ul") {
        flushList()
        listType = "ul"
      }
      currentList.push(trimmed.replace(/^-\s+/, ""))
      return
    }

    // Separator (---)
    if (trimmed === "---") {
      flushList()
      result.push('<hr class="separator" />')
      return
    }

    // Regular paragraph
    flushList()
    result.push(`<p class="paragraph">${formatInlineText(trimmed)}</p>`)
  })

  flushList()
  return result.join("\n")
}
