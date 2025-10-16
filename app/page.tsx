"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Camera, Upload, User } from "lucide-react"

export default function HomePage() {
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [error, setError] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasUsername, setHasUsername] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedAuth = sessionStorage.getItem("isAuthenticated")
      const savedUsername = sessionStorage.getItem("username")
      if (savedAuth === "true") {
        setIsAuthenticated(true)
        if (savedUsername) {
          setUsername(savedUsername)
          setHasUsername(true)
        }
      }
    }
  }, [])

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Password submitted:", password)
    if (password.trim() === "proax") {
      console.log("Password correct, authenticating...")
      setIsAuthenticated(true)
      setError("")
      if (typeof window !== "undefined") {
        sessionStorage.setItem("isAuthenticated", "true")
      }
    } else {
      console.log("Incorrect password")
      setError("Incorrect password")
    }
  }

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim()) {
      const usernamePattern = /^[a-z][a-z]+$/
      if (!usernamePattern.test(username.trim().toLowerCase())) {
        setError("Please use format: first initial + last name (all lowercase). Example: sjoy")
        return
      }

      const formattedUsername = username.trim().toLowerCase()
      setUsername(formattedUsername)
      setHasUsername(true)
      setError("")
      if (typeof window !== "undefined") {
        sessionStorage.setItem("username", formattedUsername)
      }
    } else {
      setError("Please enter your username")
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">ScanLead</CardTitle>
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

  if (!hasUsername) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">Enter Your Username</CardTitle>
            <CardDescription>We need to track who scanned each business card</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="sjoy"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: First initial + last name (all lowercase)
                  <br />
                  Examples: Sarah Joy = "sjoy", John Smith = "jsmith"
                </p>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full">
                <User className="w-4 h-4 mr-2" />
                Continue
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      sessionStorage.clear()
    }
    setIsAuthenticated(false)
    setHasUsername(false)
    setUsername("")
    setPassword("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ScanLead</h1>
          <p className="text-gray-600">Scan business cards instantly</p>
          <p className="text-sm text-gray-500 mt-1">Logged in as: {username}</p>
        </div>

        <div className="max-w-md mx-auto space-y-4">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push("/scan/camera")}
          >
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center">
                <Camera className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Take Photo</h3>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Image</h3>
                <p className="text-gray-600 text-sm">Select image from gallery</p>
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full mt-6 bg-transparent" onClick={() => router.push("/dashboard")}>
            View Dashboard
          </Button>

          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
