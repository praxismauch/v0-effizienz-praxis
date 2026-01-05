"use client"

import { useAiEnabled } from "@/lib/hooks/use-ai-enabled"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { useState } from "react"

function WorkflowsPage() {
  const { isAiEnabled } = useAiEnabled()
  const [showAiGenerator, setShowAiGenerator] = useState(false)

  return (
    <div>
      {/* ... other code here ... */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowAiGenerator(true)}
        disabled={!isAiEnabled}
        className="gap-1.5"
      >
        <Sparkles className="h-4 w-4" />
        Mit KI generieren
      </Button>
      {/* ... other code here ... */}
    </div>
  )
}

export { WorkflowsPage }
export default WorkflowsPage
