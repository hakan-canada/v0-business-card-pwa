"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Search, Plus, User, Building, Mail, Phone, Globe, Calendar, Download, ArrowLeft, FileText } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface Lead {
  id: string
  first_name: string | null
  last_name: string | null
  job_title: string | null
  company_name: string | null
  email: string | null
  phone: string | null
  website: string | null
  status: string | null
  created_at: string
  updated_at: string
  notes?: Note[]
  name?: string
  company?: string
  scanned_by?: string // Added scanned_by field to interface
}

interface Note {
  id: string
  content: string
  created_at: string
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [newNote, setNewNote] = useState("")
  const [isSavingNote, setIsSavingNote] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchLeads()
  }, [])

  useEffect(() => {
    filterLeads()
  }, [leads, searchTerm, statusFilter])

  const fetchLeads = async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("leads")
        .select(`
          *,
          notes (
            id,
            content,
            created_at
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      console.log("[v0] Fetched leads:", data)
      setLeads(data || [])
    } catch (error) {
      console.error("[v0] Error fetching leads:", error)
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterLeads = async () => {
    let filtered = leads

    // Enhanced search filter with better matching
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim()

      // Try Supabase textSearch first for better results
      try {
        const supabase = createClient()
        const { data: searchResults, error } = await supabase
          .from("leads")
          .select("*")
          .or(
            `first_name.ilike.%${term}%,last_name.ilike.%${term}%,company_name.ilike.%${term}%,email.ilike.%${term}%,job_title.ilike.%${term}%,name.ilike.%${term}%,company.ilike.%${term}%`,
          )

        if (!error && searchResults) {
          // Filter the current leads based on search results
          const searchIds = new Set(searchResults.map((result) => result.id))
          filtered = leads.filter((lead) => searchIds.has(lead.id))
        } else {
          // Fallback to client-side search if Supabase search fails
          filtered = leads.filter((lead) => {
            const fullName = `${lead.first_name || ""} ${lead.last_name || ""}`.trim().toLowerCase()
            const displayName = (lead.name || "").toLowerCase()
            const company = (lead.company_name || lead.company || "").toLowerCase()
            const email = (lead.email || "").toLowerCase()
            const jobTitle = (lead.job_title || "").toLowerCase()

            return (
              fullName.includes(term) ||
              displayName.includes(term) ||
              company.includes(term) ||
              email.includes(term) ||
              jobTitle.includes(term) ||
              // Partial matching for names
              (lead.first_name || "")
                .toLowerCase()
                .includes(term) ||
              (lead.last_name || "").toLowerCase().includes(term)
            )
          })
        }
      } catch (searchError) {
        console.error("[v0] Search error, falling back to client-side:", searchError)
        // Client-side fallback search
        filtered = leads.filter((lead) => {
          const fullName = `${lead.first_name || ""} ${lead.last_name || ""}`.trim().toLowerCase()
          const displayName = (lead.name || "").toLowerCase()
          const company = (lead.company_name || lead.company || "").toLowerCase()
          const email = (lead.email || "").toLowerCase()
          const jobTitle = (lead.job_title || "").toLowerCase()

          return (
            fullName.includes(term) ||
            displayName.includes(term) ||
            company.includes(term) ||
            email.includes(term) ||
            jobTitle.includes(term) ||
            (lead.first_name || "").toLowerCase().includes(term) ||
            (lead.last_name || "").toLowerCase().includes(term)
          )
        })
      }
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((lead) => lead.status === statusFilter)
    }

    setFilteredLeads(filtered)
  }

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead)
    setIsDetailModalOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const exportToCSV = () => {
    const csvContent = [
      ["Name", "Company"],
      ...filteredLeads.map((lead) => [
        `${lead.first_name || ""} ${lead.last_name || ""}`.trim(),
        lead.company_name || "",
      ]),
    ]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Export Complete",
      description: "Leads exported to CSV successfully",
    })
  }

  const saveNote = async () => {
    if (!selectedLead || !newNote.trim()) return

    setIsSavingNote(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.from("notes").insert({
        lead_id: selectedLead.id,
        content: newNote.trim(),
        created_by: null,
      })

      if (error) throw error

      toast({
        title: "Note Saved",
        description: "Your note has been saved successfully",
      })

      setNewNote("")
      fetchLeads()
    } catch (error) {
      console.error("[v0] Error saving note:", error)
      toast({
        title: "Save Failed",
        description: "Failed to save note",
        variant: "destructive",
      })
    } finally {
      setIsSavingNote(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="md:hidden">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lead Dashboard</h1>
              <p className="text-gray-600">{filteredLeads.length} leads found</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV} size="sm" className="hidden sm:flex bg-transparent">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => router.push("/")} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Scan Card
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "enriched" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("enriched")}
            >
              Enriched
            </Button>
            <Button
              variant={statusFilter === "processing" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("processing")}
            >
              Processing
            </Button>
          </div>
        </div>

        {/* Leads Grid */}
        {filteredLeads.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Start by scanning your first business card"}
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
              <Card
                key={lead.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleLeadClick(lead)}
              >
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-medium truncate">
                      {lead.name || `${lead.first_name || ""} ${lead.last_name || ""}`.trim() || "Unknown Name"}
                    </CardTitle>
                    {(lead.company || lead.company_name) && (
                      <p className="text-sm text-gray-600 mt-1 truncate">{lead.company || lead.company_name}</p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0 pb-3 px-4">
                  <div className="flex items-center justify-between pt-1">
                    {lead.scanned_by && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">by {lead.scanned_by}</span>
                    )}
                    <span className="text-xs text-gray-500">{formatDate(lead.created_at)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Lead Detail Modal */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedLead
                  ? selectedLead.name ||
                    `${selectedLead.first_name || ""} ${selectedLead.last_name || ""}`.trim() ||
                    "Unknown Name"
                  : "Lead Details"}
              </DialogTitle>
              <DialogDescription>Contact information and notes</DialogDescription>
            </DialogHeader>

            {selectedLead && (
              <div className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-3">
                  {selectedLead.job_title && (
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{selectedLead.job_title}</span>
                    </div>
                  )}

                  {(selectedLead.company || selectedLead.company_name) && (
                    <div className="flex items-center gap-3">
                      <Building className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{selectedLead.company || selectedLead.company_name}</span>
                    </div>
                  )}

                  {selectedLead.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <a href={`mailto:${selectedLead.email}`} className="text-sm text-blue-600 hover:underline">
                        {selectedLead.email}
                      </a>
                    </div>
                  )}

                  {selectedLead.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <a href={`tel:${selectedLead.phone}`} className="text-sm text-blue-600 hover:underline">
                        {selectedLead.phone}
                      </a>
                    </div>
                  )}

                  {selectedLead.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-gray-500" />
                      <a
                        href={
                          selectedLead.website.startsWith("http")
                            ? selectedLead.website
                            : `https://${selectedLead.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {selectedLead.website}
                      </a>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Added {formatDate(selectedLead.created_at)}</span>
                  </div>

                  {selectedLead.scanned_by && (
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Scanned by {selectedLead.scanned_by}</span>
                    </div>
                  )}
                </div>

                {/* Notes Section */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Notes
                  </h4>

                  {/* Existing Notes */}
                  {selectedLead.notes && selectedLead.notes.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {selectedLead.notes.map((note) => (
                        <div key={note.id} className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-700">{note.content}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(note.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Note */}
                  <div className="space-y-3">
                    <Label htmlFor="new-note">Add Note</Label>
                    <Textarea
                      id="new-note"
                      placeholder="Add a note about this contact..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      maxLength={500}
                      rows={3}
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">{newNote.length}/500 characters</span>
                      <Button onClick={saveNote} disabled={!newNote.trim() || isSavingNote} size="sm">
                        {isSavingNote ? "Saving..." : "Save Note"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
