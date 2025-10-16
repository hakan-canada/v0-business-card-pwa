"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { Search, Plus, ArrowLeft } from "lucide-react"

interface Lead {
  id: string
  first_name: string | null
  last_name: string | null
  company_name: string | null
  email: string | null
  phone: string | null
  created_at: string
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchLeads()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const filtered = leads.filter((lead) => {
        const fullName = `${lead.first_name || ""} ${lead.last_name || ""}`.toLowerCase()
        const company = (lead.company_name || "").toLowerCase()
        const email = (lead.email || "").toLowerCase()
        return fullName.includes(term) || company.includes(term) || email.includes(term)
      })
      setFilteredLeads(filtered)
    } else {
      setFilteredLeads(leads)
    }
  }, [leads, searchTerm])

  const fetchLeads = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error("Error fetching leads:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="md:hidden">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Lead Dashboard</h1>
              <p className="text-gray-600">{filteredLeads.length} leads found</p>
            </div>
          </div>

          <Button onClick={() => router.push("/")} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Scan Card
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredLeads.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">No leads found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? "Try adjusting your search" : "Start by scanning your first business card"}
              </p>
              <Button onClick={() => router.push("/")}>
                <Plus className="w-4 h-4 mr-2" />
                Scan First Card
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredLeads.map((lead) => (
              <Card key={lead.id}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-base font-medium truncate">
                    {`${lead.first_name || ""} ${lead.last_name || ""}`.trim() || "Unknown Name"}
                  </CardTitle>
                  {lead.company_name && (
                    <p className="text-sm text-gray-600 mt-1 truncate">{lead.company_name}</p>
                  )}
                </CardHeader>
                <CardContent className="pt-0 pb-3 px-4">
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-gray-500">{formatDate(lead.created_at)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
