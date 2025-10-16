"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Camera, Upload } from "lucide-react"

export default function HomePage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === "proax") {
      setIsAuthenticated(true)
      setError("")
    } else {
      setError("Incorrect password")
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">ScanLead</CardTitle>
            <CardDescription>Business Card Scanner</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">Enter Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="mt-1"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full">
                Access Scanner
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">ScanLead</h1>
          <p className="text-gray-600">Scan business cards instantly</p>
        </div>

        <div className="max-w-md mx-auto space-y-4">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push("/scan/camera")}
          >
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center">
                <Camera className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Take Photo</h3>
                <p className="text-gray-600 text-sm">Use camera to scan business card</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push("/scan/upload")}
          >
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center">
                <Upload className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload Image</h3>
                <p className="text-gray-600 text-sm">Select image from gallery</p>
              </div>
            </CardContent>
          </Card>

          <Button
            variant="outline"
            className="w-full mt-6"
            onClick={() => router.push("/dashboard")}
          >
            View Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
