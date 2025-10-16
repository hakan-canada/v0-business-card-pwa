"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Plus, Home } from "lucide-react"

interface ProcessedLead {
  id: string
  name: string
  title: string
  company: string
  email: string
  phone: string
  website: string
  notes: string
  status: string
  session_id: string
  processing_method: string
  created_at: string
  updated_at: string
}

export default function SuccessPage() {
  const [leadData, setLeadData] = useState<ProcessedLead | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const resultData = sessionStorage.getItem("processingResult")

    if (!resultData) {
      router.push("/")
      return
    }

    try {
      const result = JSON.parse(resultData)
      console.log("[v0] Processing result:", result)

      // Handle array response from n8n
      if (Array.isArray(result) && result.length > 0) {
        setLeadData(result[0])
      } else if (result && typeof result === "object") {
        setLeadData(result)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error) {
      console.error("[v0] Error parsing result:", error)
      toast({
        title: "Error",
        description: "Failed to load processing results",
        variant: "destructive",
      })
      router.push("/")
    }
  }, [router, toast])

  const handleScanAnother = () => {
    // Clean up session storage
    sessionStorage.removeItem("capturedImage")
    sessionStorage.removeItem("captureMethod")
    sessionStorage.removeItem("currentSessionId")
    sessionStorage.removeItem("processingNotes")
    sessionStorage.removeItem("processingResult")

    router.push("/")
  }

  if (!leadData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Success!</h1>
          <p className="text-gray-600">Business card processed successfully</p>
        </div>

        <div className="max-w-md mx-auto space-y-6">
          {/* Action Buttons */}
          <div className="space-y-3">
            <Button onClick={handleScanAnother} className="w-full" size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Scan Another Card
            </Button>

            <Button variant="outline" onClick={() => router.push("/dashboard")} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              View Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
