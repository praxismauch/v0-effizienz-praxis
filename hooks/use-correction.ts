interface CorrectionRequest {
  timeBlockId: string
  correctionType: string
  newStartTime?: string
  newEndTime?: string
  reason: string
}

export async function submitCorrection(request: CorrectionRequest): Promise<void> {
  const response = await fetch("/api/zeiterfassung/correction-requests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      time_block_id: request.timeBlockId,
      correction_type: request.correctionType,
      requested_changes: {
        start_time: request.newStartTime,
        end_time: request.newEndTime,
      },
      reason: request.reason,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(error.error || "Failed to submit correction request")
  }
}
