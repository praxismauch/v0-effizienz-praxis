// BTOA Polyfill for UTF-8 characters
// This file is loaded before any other JavaScript to ensure btoa works with Unicode
;(() => {
  if (typeof window !== "undefined" && window.btoa) {
    const originalBtoa = window.btoa.bind(window)

    window.btoa = (str) => {
      if (str == null) {
        return originalBtoa("")
      }

      // Convert to string
      str = String(str)

      // Check if string contains only ASCII characters
      let isAscii = true
      for (let i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) > 127) {
          isAscii = false
          break
        }
      }

      // If ASCII, use original btoa
      if (isAscii) {
        return originalBtoa(str)
      }

      // For UTF-8 strings, encode to bytes first
      try {
        // Use TextEncoder to get UTF-8 bytes
        const encoder = new TextEncoder()
        const bytes = encoder.encode(str)

        // Convert bytes to binary string
        let binaryString = ""
        for (let i = 0; i < bytes.length; i++) {
          binaryString += String.fromCharCode(bytes[i])
        }

        // Use original btoa on the binary string
        return originalBtoa(binaryString)
      } catch (e) {
        console.error("[btoa-polyfill] Error encoding string:", e)
        throw e
      }
    }

    console.log("[btoa-polyfill] Successfully patched window.btoa")
  }
})()
