"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, RotateCcw, Send } from "lucide-react"
import Image from "next/image"

export default function PreviewPage() {
  const [imageData, setImageData] = useState<string>("")
  const [captureMethod, setCaptureMethod] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const storedImage = sessionStorage.getItem("capturedImage")
    const storedMethod = sessionStorage.getItem("captureMethod")

    if (!storedImage) {
      router.push("/")
      return
    }

    setImageData(storedImage)
    setCaptureMethod(storedMethod || "unknown")
  }, [router])

  const handleRetake = () => {
    sessionStorage.removeItem("capturedImage")
    sessionStorage.removeItem("captureMethod")

    if (captureMethod === "camera") {
      router.push("/scan/camera")
    } else {
      router.push("/scan/upload")
    }
  }

  const handleProcess = async () => {
    setIsProcessing(true)

    try {
      // Generate unique session ID
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Prepare payload for n8n webhook
      const payload = {
        image: imageData.split(",")[1], // Remove data:image/jpeg;base64, prefix
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        notes: notes || "",
      }

      // Store session info for tracking
      sessionStorage.setItem("currentSessionId", sessionId)
      sessionStorage.setItem("processingNotes", notes)

      // Navigate to processing page
      router.push("/scan/processing")
    } catch (error) {
      console.error("Processing error:", error)
      toast({
        title: "Processing Failed",
        description: "Failed to start processing. Please try again.",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  if (!imageData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="mr-4">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Preview & Process</h1>
            <p className="text-gray-600">Review your business card image</p>
          </div>
        </div>

        <div className="max-w-md mx-auto space-y-6">
          {/* Image Preview */}
          <Card>
            <CardContent className="p-4">
              <div className="relative aspect-[1.6/1] w-full overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src={imageData || "/placeholder.svg"}
                  alt="Business card preview"
                  fill
                  className="object-contain"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <Label htmlFor="notes">Add Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes about this contact..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                  className="mt-1 resize-none"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">{notes.length}/500 characters</p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button onClick={handleProcess} disabled={isProcessing} className="w-full" size="lg">
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Starting Process...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Process Business Card
                </div>
              )}
            </Button>

            <Button variant="outline" onClick={handleRetake} className="w-full bg-transparent" disabled={isProcessing}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake {captureMethod === "camera" ? "Photo" : "Upload"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
