"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Upload, ArrowLeft, ImageIcon } from "lucide-react"

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = canvasRef.current
          if (!canvas) {
            reject(new Error("Canvas not available"))
            return
          }

          const ctx = canvas.getContext("2d")
          if (!ctx) {
            reject(new Error("Canvas context not available"))
            return
          }

          let width = img.width
          let height = img.height
          const maxWidth = 1920
          const maxHeight = 1080

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width = width * ratio
            height = height * ratio
          }

          canvas.width = width
          canvas.height = height

          ctx.drawImage(img, 0, 0, width, height)
          const compressedData = canvas.toDataURL("image/jpeg", 0.8)

          console.log("[v0] Original size:", img.width, "x", img.height)
          console.log("[v0] Compressed size:", width, "x", height)
          console.log("[v0] Compressed data length:", compressedData.length)

          resolve(compressedData)
        }

        img.onerror = () => {
          reject(new Error("Failed to load image"))
        }

        img.src = e.target?.result as string
      }

      reader.onerror = () => {
        reject(new Error("Failed to read file"))
      }

      reader.readAsDataURL(file)
    })
  }

  const handleFileSelect = async (file: File) => {
    console.log("[v0] File selected:", file.name, file.type, file.size)

    if (!file.type.startsWith("image/")) {
      console.log("[v0] Invalid file type:", file.type)
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive",
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      console.log("[v0] File too large:", file.size)
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive",
      })
      return
    }

    console.log("[v0] Starting file upload process")
    setIsUploading(true)

    try {
      const compressedImage = await compressImage(file)

      sessionStorage.setItem("capturedImage", compressedImage)
      sessionStorage.setItem("captureMethod", "upload")
      console.log("[v0] Stored compressed image in sessionStorage, navigating to preview")

      setTimeout(() => {
        router.push("/scan/preview")
      }, 100)
    } catch (error) {
      console.error("[v0] Error processing image:", error)
      toast({
        title: "Processing Error",
        description: "Failed to process the image. Please try again.",
        variant: "destructive",
      })
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("[v0] File dropped")
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    console.log("[v0] Dropped files count:", files.length)

    if (files.length > 0) {
      handleFileSelect(files[0])
    } else {
      toast({
        title: "No File Detected",
        description: "Please try selecting a file again.",
        variant: "destructive",
      })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[v0] File input changed")
    const files = e.target.files
    console.log("[v0] Selected files count:", files?.length)

    if (files && files.length > 0) {
      handleFileSelect(files[0])
    } else {
      console.log("[v0] No files selected")
    }

    e.target.value = ""
  }

  const openFileDialog = () => {
    console.log("[v0] Opening file dialog")
    if (isUploading) {
      console.log("[v0] Upload in progress, ignoring click")
      return
    }
    fileInputRef.current?.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <canvas ref={canvasRef} className="hidden" />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="mr-4" disabled={isUploading}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Upload Image</h1>
            <p className="text-gray-600">Select a business card image from your device</p>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <Card
            className={`cursor-pointer transition-all duration-200 ${
              isDragging
                ? "border-blue-500 bg-blue-50 scale-105"
                : "border-dashed border-2 border-gray-300 hover:border-gray-400"
            } ${isUploading ? "pointer-events-none opacity-75" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={openFileDialog}
          >
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              {isUploading ? (
                <div className="space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="text-gray-600">Processing image...</p>
                  <p className="text-xs text-gray-500">Please wait</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    {isDragging ? (
                      <Upload className="w-8 h-8 text-blue-600" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-blue-600" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {isDragging ? "Drop image here" : "Upload Business Card"}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">Drag and drop an image or click to browse</p>
                    <p className="text-xs text-gray-500">Supports JPG, PNG, WebP (max 10MB)</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isUploading}
          />

          <div className="mt-6 space-y-3">
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => router.push("/scan/camera")}
              disabled={isUploading}
            >
              Use Camera Instead
            </Button>

            <Button variant="ghost" className="w-full" onClick={() => router.push("/")} disabled={isUploading}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
