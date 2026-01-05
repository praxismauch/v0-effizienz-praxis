export function formatTextToHtml(text: string): string {
  if (!text) return ""

  const lines = text.split("\n")
  let inList = false
  let listType: "ul" | "ol" | null = null
  const processedLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Skip empty lines but close any open list
    if (!line) {
      if (inList && listType) {
        processedLines.push(`</${listType}>`)
        inList = false
        listType = null
      }
      continue
    }

    if (line.startsWith("# ")) {
      if (inList && listType) {
        processedLines.push(`</${listType}>`)
        inList = false
        listType = null
      }
      const content = formatInline(line.slice(2))
      processedLines.push(`<h1 class="text-xl font-bold mt-4 mb-2">${content}</h1>`)
      continue
    }

    if (line.startsWith("## ")) {
      if (inList && listType) {
        processedLines.push(`</${listType}>`)
        inList = false
        listType = null
      }
      const content = formatInline(line.slice(3))
      processedLines.push(`<h2 class="text-lg font-bold mt-4 mb-2">${content}</h2>`)
      continue
    }

    if (line.startsWith("### ")) {
      if (inList && listType) {
        processedLines.push(`</${listType}>`)
        inList = false
        listType = null
      }
      const content = formatInline(line.slice(4))
      processedLines.push(`<h3 class="text-base font-semibold mt-3 mb-1">${content}</h3>`)
      continue
    }

    if (line.match(/^[•\-*]\s+/)) {
      if (!inList || listType !== "ul") {
        if (inList && listType) {
          processedLines.push(`</${listType}>`)
        }
        processedLines.push('<ul class="list-disc pl-5 space-y-1 my-2">')
        inList = true
        listType = "ul"
      }
      const content = formatInline(line.replace(/^[•\-*]\s+/, ""))
      processedLines.push(`<li>${content}</li>`)
      continue
    }

    if (line.match(/^\d+\.\s+/)) {
      if (!inList || listType !== "ol") {
        if (inList && listType) {
          processedLines.push(`</${listType}>`)
        }
        processedLines.push('<ol class="list-decimal pl-5 space-y-1 my-2">')
        inList = true
        listType = "ol"
      }
      const content = formatInline(line.replace(/^\d+\.\s+/, ""))
      processedLines.push(`<li>${content}</li>`)
      continue
    }

    // Regular paragraph
    if (inList && listType) {
      processedLines.push(`</${listType}>`)
      inList = false
      listType = null
    }
    const content = formatInline(line)
    processedLines.push(`<p class="mb-2">${content}</p>`)
  }

  // Close any remaining open list
  if (inList && listType) {
    processedLines.push(`</${listType}>`)
  }

  return processedLines.join("\n")
}

function formatInline(text: string): string {
  let result = text
  // Convert **bold** to <strong>
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  // Convert *italic* to <em> (but not if part of a list marker)
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>")
  // Convert `code` to <code>
  result = result.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
  return result
}
