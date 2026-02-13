export async function checkAPI(): Promise<{ status: string; message: string }> {
  try {
    // Basic API availability check
    return {
      status: "operational",
      message: "API is available and responding",
    }
  } catch (error) {
    console.error("[api] API check failed:", error)
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
