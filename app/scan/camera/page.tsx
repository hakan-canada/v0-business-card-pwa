"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Camera, FlipHorizontal, Zap, ZapOff, ArrowLeft } from "lucide-react"

export default function CameraPage() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  const stopCamera = useCallback(() => {
    console.log("[v0] Stopping camera")
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [stream])

  const startCamera = useCallback(async () => {
    try {
      console.log("[v0] Starting camera with facingMode:", facingMode)
      setIsLoading(true)
      setPermissionDenied(false)

      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }

      const constraints = {
        video: {
          facingMode,
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          aspectRatio: { ideal: 16 / 9 },
        },
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log("[v0] Got media stream:", mediaStream)
      console.log("[v0] Video tracks:", mediaStream.getVideoTracks())

      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        console.log("[v0] Set video srcObject")

        const playPromise = videoRef.current.play()
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("[v0] Video playing successfully")
              setIsLoading(false)
            })
            .catch((error) => {
              console.error("[v0] Video play error:", error)
              setIsLoading(false)
            })
        }

        videoRef.current.onloadedmetadata = () => {
          console.log("[v0] Video metadata loaded")
          console.log("[v0] Video dimensions:", videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight)
        }

        videoRef.current.oncanplay = () => {
          console.log("[v0] Video can play")
        }

        videoRef.current.onerror = (error) => {
          console.error("[v0] Video error:", error)
        }
      }
    } catch (error) {
      console.error("[v0] Camera access error:", error)
      setPermissionDenied(true)
      setIsLoading(false)
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to scan business cards.",
        variant: "destructive",
      })
    }
  }, [facingMode, toast, stream])

  const switchCamera = useCallback(() => {
    console.log("[v0] Switching camera")
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"))
  }, [])

  const toggleFlash = useCallback(async () => {
    if (stream) {
      const track = stream.getVideoTracks()[0]
      const capabilities = track.getCapabilities()

      if (capabilities.torch) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !flashEnabled }],
          })
          setFlashEnabled(!flashEnabled)
        } catch (error) {
          console.error("Flash toggle error:", error)
          toast({
            title: "Flash Not Available",
            description: "Flash is not supported on this device.",
            variant: "destructive",
          })
        }
      }
    }
  }, [stream, flashEnabled, toast])

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    setIsCapturing(true)
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = canvas.toDataURL("image/jpeg", 0.8)

    sessionStorage.setItem("capturedImage", imageData)
    sessionStorage.setItem("captureMethod", "camera")

    stopCamera()
    router.push("/scan/preview")
  }, [router, stopCamera])

  useEffect(() => {
    startCamera()

    return () => {
      console.log("[v0] Component unmounting, stopping camera")
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [facingMode])

  if (permissionDenied) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="p-6 text-center max-w-md">
          <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Camera Access Required</h2>
          <p className="text-gray-600 mb-4">
            Please allow camera access to scan business cards. You may need to refresh the page and grant permission.
          </p>
          <div className="space-y-2">
            <Button onClick={startCamera} className="w-full">
              Try Again
            </Button>
            <Button variant="outline" onClick={() => router.push("/scan/upload")} className="w-full">
              Upload Image Instead
            </Button>
            <Button variant="ghost" onClick={() => router.push("/")} className="w-full">
              Back to Home
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p>Starting camera...</p>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        webkit-playsinline="true"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          transform: facingMode === "user" ? "scaleX(-1)" : "none",
          backgroundColor: "#000",
        }}
      />

      <canvas ref={canvasRef} className="hidden" />

      <div className="absolute inset-0 flex flex-col">
        <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="text-white hover:bg-white/20">
            <ArrowLeft className="w-6 h-6" />
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={toggleFlash} className="text-white hover:bg-white/20">
              {flashEnabled ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
            </Button>

            <Button variant="ghost" size="icon" onClick={switchCamera} className="text-white hover:bg-white/20">
              <FlipHorizontal className="w-6 h-6" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8"></div>

        <div className="p-4 pb-12 bg-gradient-to-t from-black/50 to-transparent">
          <div className="flex justify-center mb-8">
            <Button
              onClick={captureImage}
              disabled={isCapturing || isLoading}
              size="lg"
              className="w-20 h-20 rounded-full bg-white hover:bg-gray-100 text-black p-0 border-4 border-white/30"
            >
              {/* ... existing code ... */}
            </Button>
          </div>

          <p className="text-white text-center text-sm">Tap to capture business card</p>
        </div>
      </div>
    </div>
  )
}
