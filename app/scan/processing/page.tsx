"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { N8nClient } from "@/lib/n8n-client"
import { Loader2, X, CheckCircle, AlertCircle } from "lucide-react"

export default function ProcessingPage() {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing")
  const [errorMessage, setErrorMessage] = useState("")
  const [sessionId, setSessionId] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const storedSessionId = sessionStorage.getItem("currentSessionId")
    const imageData = sessionStorage.getItem("capturedImage")
    const notes = sessionStorage.getItem("processingNotes") || ""

    if (!storedSessionId || !imageData) {
      router.push("/")
      return
    }

    setSessionId(storedSessionId)
    processBusinessCard(imageData, storedSessionId, notes)
  }, [router])

  const processBusinessCard = async (imageData: string, sessionId: string, notes: string) => {
    try {
      // Validate image data
      if (!N8nClient.validateImageData(imageData)) {
        throw new Error("Invalid image format")
      }

      const username = sessionStorage.getItem("username")
      if (!username) {
        throw new Error("Username not found. Please log in again.")
      }

      console.log("[v0] Processing payload data:", {
        sessionId,
        username,
        notes,
        notesLength: notes.length,
        hasImage: !!imageData,
      })

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 15
        })
      }, 500)

      const payload = {
        image: N8nClient.extractBase64(imageData),
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        notes: notes,
        scanned_by: username, // Include username in payload
      }

      console.log("[v0] Complete payload being sent to n8n:", {
        session_id: payload.session_id,
        timestamp: payload.timestamp,
        notes: payload.notes,
        scanned_by: payload.scanned_by,
        imageSize: payload.image.length,
      })

      // Process with n8n
      const result = await N8nClient.processBusinessCard(payload)

      console.log("[v0] Result received from n8n:", result)

      clearInterval(progressInterval)
      setProgress(100)

      // Store the result for the success page
      sessionStorage.setItem("processingResult", JSON.stringify(result))

      setStatus("success")

      // Navigate to success page after a brief delay
      setTimeout(() => {
        router.push("/scan/success")
      }, 1500)
    } catch (error) {
      console.error("[v0] Processing error:", error)
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Unknown error occurred")

      toast({
        title: "Processing Failed",
        description: "Failed to process business card. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    // Clean up session storage
    sessionStorage.removeItem("capturedImage")
    sessionStorage.removeItem("captureMethod")
    sessionStorage.removeItem("currentSessionId")
    sessionStorage.removeItem("processingNotes")

    router.push("/")
  }

  const handleRetry = () => {
    router.push("/scan/preview")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {status === "processing" && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Business Card</h2>
                <p className="text-gray-600 text-sm mb-4">Extracting contact information using AI...</p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              <p className="text-sm text-gray-500">{Math.round(progress)}% complete</p>

              <Button variant="outline" onClick={handleCancel} className="w-full bg-transparent">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Complete!</h2>
                <p className="text-gray-600 text-sm">Business card information extracted successfully</p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Failed</h2>
                <p className="text-gray-600 text-sm mb-4">
                  {errorMessage || "Unable to process the business card. Please try again."}
                </p>
              </div>

              <div className="space-y-3">
                <Button onClick={handleRetry} className="w-full">
                  Try Again
                </Button>
                <Button variant="outline" onClick={handleCancel} className="w-full bg-transparent">
                  Back to Home
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
