interface N8nPayload {
  image: string
  session_id: string
  timestamp: string
  notes: string
  scanned_by?: string
}

interface N8nResponse {
  id: string
  user_id: string | null
  company_id: string | null
  name: string
  title: string
  company: string
  email: string | null
  phone: string | null
  image_url: string | null
  notes: string
  status: string
  created_at: string
  updated_at: string
  session_id: string
  note: string | null
  website: string | null
  processing_method: string
  scanned_by?: string
}

export class N8nClient {
  private static readonly WEBHOOK_URL = "https://n8n.proax.ca/webhook/business-card-scan"
  private static readonly MAX_RETRIES = 3
  private static readonly RETRY_DELAY = 1000 // 1 second

  static async processBusinessCard(payload: N8nPayload): Promise<N8nResponse[]> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`[v0] n8n attempt ${attempt}/${this.MAX_RETRIES}:`, {
          url: this.WEBHOOK_URL,
          sessionId: payload.session_id,
          hasImage: !!payload.image,
          notesLength: payload.notes?.length || 0,
          notesContent: payload.notes,
          scannedBy: payload.scanned_by,
          timestamp: payload.timestamp,
        })

        const requestPayload = {
          ...payload,
          note: payload.notes, // Map notes to note field as well for database compatibility
          scanned_by: payload.scanned_by || null, // Ensure scanned_by is explicitly included
        }

        console.log("[v0] Exact payload being sent to n8n:", JSON.stringify(requestPayload, null, 2))

        const response = await fetch(this.WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("[v0] n8n HTTP error response:", errorText)
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const result = await response.json()

        console.log(`[v0] n8n success on attempt ${attempt}:`, {
          resultType: Array.isArray(result) ? "array" : typeof result,
          resultLength: Array.isArray(result) ? result.length : 1,
          firstResult: Array.isArray(result) ? result[0] : result,
          scannedByInResult: Array.isArray(result) ? result[0]?.scanned_by : result?.scanned_by,
          notesInResult: Array.isArray(result) ? result[0]?.notes : result?.notes,
        })

        if (Array.isArray(result)) {
          return result
        } else if (result && typeof result === "object") {
          return [result]
        } else {
          throw new Error("Invalid response format from n8n webhook")
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error")
        console.error(`[v0] n8n attempt ${attempt} failed:`, lastError.message)

        if (attempt < this.MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, this.RETRY_DELAY * attempt))
        }
      }
    }

    throw new Error(`n8n processing failed after ${this.MAX_RETRIES} attempts: ${lastError?.message}`)
  }

  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  static validateImageData(imageData: string): boolean {
    const base64Pattern = /^data:image\/(jpeg|jpg|png|webp);base64,/
    return base64Pattern.test(imageData)
  }

  static extractBase64(imageData: string): string {
    const base64Match = imageData.match(/^data:image\/[^;]+;base64,(.+)$/)
    if (!base64Match) {
      throw new Error("Invalid image data format")
    }
    return base64Match[1]
  }
}
