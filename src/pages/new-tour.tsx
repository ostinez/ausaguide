import { useState, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowLeft,
  Trash2,
  Bold,
  Italic,
  List,
  Link2,
  Check,
  Loader2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Tag,
  Eye,
  Info,
  DollarSign,
  Clock,
  MapPin,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createTour } from "@/lib/api/tours"
import type { TourCategory, TourType } from "@/lib/types"
import Dropzone from "@/components/ui/Dropzone"

const STEPS = [
  { id: "basic", label: "Basic Info" },
  { id: "description", label: "Description" },
  { id: "images", label: "Images" },
  { id: "pricing", label: "Pricing" },
  { id: "availability", label: "Availability" },
]

const CATEGORIES = [
  { value: "culture", label: "Culture" },
  { value: "food", label: "Food" },
  { value: "adventure", label: "Adventure" },
  { value: "nature", label: "Nature" },
  { value: "city", label: "City Walk" },
  { value: "nightlife", label: "Nightlife" },
]

const TAG_SUGGESTIONS = ["food", "culture", "nature", "adventure", "safari", "hiking", "cooking", "local-secrets"]

export default function NewTourPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<TourCategory>("culture")
  const [duration, setDuration] = useState("3")
  const [locationName, setLocationName] = useState("")
  const [tourType, setTourType] = useState<TourType>("in_person")
  const [maxGuests, setMaxGuests] = useState("10")
  
  // Description & Rich Text Editor
  const [description, setDescription] = useState("")
  const descTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Images state
  const [images, setImages] = useState<string[]>([])

  // Pricing
  const [price, setPrice] = useState("3500")
  const [physicalPrice, setPhysicalPrice] = useState("3500")
  const [virtualPrice, setVirtualPrice] = useState("1500")
  const [currency, setCurrency] = useState("KES")
  const [groupDiscount, setGroupDiscount] = useState("10") // % discount for large groups
  const [groupSizeThreshold, setGroupSizeThreshold] = useState("5") // guests threshold for discount

  // Availability
  const [date, setDate] = useState("")
  const [selectedDays, setSelectedDays] = useState<string[]>(["Saturday", "Sunday"])
  const [timeSlots, setTimeSlots] = useState<string[]>(["09:00", "14:00"])
  const [newTimeSlot, setNewTimeSlot] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Tags
  const [tags, setTags] = useState<string[]>(["culture"])
  const [customTag, setCustomTag] = useState("")

  // Visibility / Status
  const [status, setStatus] = useState<"draft" | "published">("published")

  // Stepper Controls
  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  // Formatting helper for rich text editor
  const insertFormatting = (prefix: string, suffix: string) => {
    const textarea = descTextareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const selected = text.substring(start, end)
    const replacement = prefix + selected + suffix

    setDescription(text.substring(0, start) + replacement + text.substring(end))
    
    // Focus back and reset selection
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length)
    }, 50)
  }

  // Tags Helpers
  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags((prev) => prev.filter((t) => t !== tag))
    } else {
      setTags((prev) => [...prev, tag])
    }
  }

  const addCustomTag = () => {
    const cleaned = customTag.trim().toLowerCase()
    if (!cleaned) return
    if (!tags.includes(cleaned)) {
      setTags((prev) => [...prev, cleaned])
    }
    setCustomTag("")
  }

  // Time Slots Helpers
  const addTimeSlot = () => {
    if (!newTimeSlot) return
    if (!timeSlots.includes(newTimeSlot)) {
      setTimeSlots((prev) => [...prev, newTimeSlot].sort())
    }
    setNewTimeSlot("")
  }

  const removeTimeSlot = (slot: string) => {
    setTimeSlots((prev) => prev.filter((s) => s !== slot))
  }

  // Submit Handler
  const handleSave = async (visibilityStatus?: "draft" | "published") => {
    const targetStatus = visibilityStatus || status
    const hostId = localStorage.getItem("user_id")

    if (!hostId) {
      toast.error("You must be logged in to create a tour.")
      return
    }

    if (!title.trim()) {
      toast.error("Please enter a tour title.")
      setCurrentStep(0)
      return
    }

    if (!locationName.trim()) {
      toast.error("Please specify a location.")
      setCurrentStep(0)
      return
    }

    setSubmitting(true)
    const toastId = toast.loading("Saving tour...")

    try {
      const availabilityJSON = {
        days: selectedDays,
        times: timeSlots,
        startDate: date || startDate || null,
        endDate: date || endDate || null,
        date: date || null,
        discounts: {
          percentage: Number(groupDiscount) || 0,
          threshold: Number(groupSizeThreshold) || 0,
        },
      }

      await createTour({
        host_id: hostId,
        title: title.trim(),
        description: description.trim(),
        price: Number(physicalPrice) || 0,
        physical_price: Number(physicalPrice) || 0,
        virtual_price: Number(virtualPrice) || 0,
        currency,
        duration_hours: Number(duration) || 1,
        max_guests: Number(maxGuests) || 10,
        location_name: locationName.trim(),
        category,
        tour_type: tourType,
        images: images.length > 0 ? images : ["https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80"],
        highlights: tags, // Reuse tags/highlights
        status: targetStatus,
        availability: availabilityJSON,
        tags: tags,
        latitude: -1.2921,
        longitude: 36.8219,
      })

      toast.success(targetStatus === "published" ? "Tour published successfully!" : "Tour draft saved!", { id: toastId })
      navigate("/dashboard")
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Failed to save tour", { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-24 md:px-8">
      {/* Background Gradients */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/3 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-1/2 right-10 h-[400px] w-[400px] rounded-full bg-teal-500/5 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Back to Dashboard
            </Link>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Create a Tour
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSave("draft")} disabled={submitting}>
              Save as Draft
            </Button>
            <Button
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/95 hover:to-purple-600/95"
              onClick={() => handleSave("published")}
              disabled={submitting}
            >
              Publish Tour
            </Button>
          </div>
        </div>

        {/* Stepper progress */}
        <div className="mb-10 rounded-xl border border-border/40 bg-card/60 p-4 backdrop-blur-md">
          <div className="flex justify-between">
            {STEPS.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(idx)}
                className={`flex flex-col items-center gap-1.5 focus:outline-none ${
                  idx <= currentStep ? "text-primary" : "text-muted-foreground/50"
                }`}
              >
                <div
                  className={`flex size-8 items-center justify-center rounded-full border text-xs font-semibold transition-all ${
                    idx === currentStep
                      ? "border-primary bg-primary text-primary-foreground shadow-[0_0_15px_rgba(147,51,234,0.4)]"
                      : idx < currentStep
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-transparent"
                  }`}
                >
                  {idx < currentStep ? <Check className="size-4" /> : idx + 1}
                </div>
                <span className="hidden text-xs font-medium md:inline">{s.label}</span>
              </button>
            ))}
          </div>
          <div className="relative mt-4 h-1.5 w-full rounded-full bg-muted">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-primary to-teal-500 transition-all duration-300"
              style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Split Layout: Left Form / Right Card Live Preview */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          {/* Form Step Section */}
          <div className="space-y-6">
            {/* Step 1: Basic Info */}
            {currentStep === 0 && (
              <Card className="border-border/40 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl">Basic Tour Info</CardTitle>
                  <CardDescription>Give your experience a clear title and target category.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tour-title">Tour Title</Label>
                    <Input
                      id="tour-title"
                      placeholder="e.g. Traditional Swahili Feasts in Lamu"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="tour-category">Category</Label>
                      <Select value={category} onValueChange={(val) => setCategory(val as TourCategory)}>
                        <SelectTrigger id="tour-category">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tour-duration">Duration (hours)</Label>
                      <Input
                        id="tour-duration"
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="tour-type">Experience Type</Label>
                      <Select value={tourType} onValueChange={(val) => setTourType(val as TourType)}>
                        <SelectTrigger id="tour-type">
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_person">In-Person Experience</SelectItem>
                          <SelectItem value="virtual">Virtual Experience</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tour-max-guests">Max Guests Capacity</Label>
                      <Input
                        id="tour-max-guests"
                        type="number"
                        min="1"
                        value={maxGuests}
                        onChange={(e) => setMaxGuests(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tour-location">Location Name</Label>
                    <Input
                      id="tour-location"
                      placeholder="e.g. Mombasa Old Town, Kenya"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="flex items-center gap-1">
                      <Tag className="size-4 text-primary" />
                      Tags & Highlights
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {TAG_SUGGESTIONS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                            tags.includes(tag)
                              ? "bg-primary/20 border-primary text-primary"
                              : "bg-muted/30 border-border hover:bg-muted"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add custom tag..."
                        value={customTag}
                        onChange={(e) => setCustomTag(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTag())}
                        className="max-w-[200px]"
                      />
                      <Button variant="outline" size="sm" type="button" onClick={addCustomTag}>
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Description */}
            {currentStep === 1 && (
              <Card className="border-border/40 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl">Describe your Experience</CardTitle>
                  <CardDescription>Detail the itinerary and what makes your tour special.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-border bg-muted/20 p-2">
                    {/* Rich text Toolbar */}
                    <div className="flex items-center gap-1 border-b border-border pb-2 mb-2 flex-wrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        className="size-8"
                        onClick={() => insertFormatting("**", "**")}
                        title="Bold"
                      >
                        <Bold className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        className="size-8"
                        onClick={() => insertFormatting("*", "*")}
                        title="Italic"
                      >
                        <Italic className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        className="size-8"
                        onClick={() => insertFormatting("- ", "")}
                        title="Bullet List"
                      >
                        <List className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        className="size-8"
                        onClick={() => insertFormatting("[link text](", ")")}
                        title="Link"
                      >
                        <Link2 className="size-4" />
                      </Button>
                    </div>

                    <textarea
                      ref={descTextareaRef}
                      placeholder="Share detailed information about your tour. We support Markdown formatting!"
                      className="min-h-[260px] w-full bg-transparent p-2 text-sm text-foreground placeholder-muted-foreground outline-none resize-y"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/10">
                    <Info className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      Use the toolbar buttons to apply basic styling. Be description-rich! Airbnb listings with detailed descriptions receive 40% more bookings.
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Images */}
            {currentStep === 2 && (
              <Card className="border-border/40 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl">Upload Tour Photos</CardTitle>
                  <CardDescription>Add 2–10 high-quality photos. The first image will be the cover shown on the booking page.</CardDescription>
                </CardHeader>
                 <CardContent className="space-y-6">
                   <Dropzone
                     bucket="tours"
                     multiple={true}
                     maxSizeMB={20}
                     value={images}
                     onChange={setImages}
                   />
                   <div className="flex items-start gap-2 text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/10">
                     <Info className="size-4 text-primary shrink-0 mt-0.5" />
                     <span>
                       Upload <strong>at least 2 photos</strong> — a cover shot and an action/detail photo. Tours with multiple high-quality images get <strong>3× more bookings</strong>. Max 20MB per image, full resolution is preserved.
                     </span>
                   </div>
                 </CardContent>
              </Card>
            )}

            {/* Step 4: Pricing */}
            {currentStep === 3 && (
              <Card className="border-border/40 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl">Set Price & Discounts</CardTitle>
                  <CardDescription>Determine your base pricing and reward larger groups.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                  {/* Competitor Benchmarks */}
                  <div className="rounded-xl border border-[#7F5AF0]/30 bg-[#7F5AF0]/5 p-4 space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                      <TrendingUp className="size-4 text-[#7F5AF0]" />
                      Market Pricing Benchmarks — Kenya Tours
                    </h3>
                    <p className="text-xs text-muted-foreground">See what similar experiences charge. Use this to price competitively without undervaluing your time.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { platform: "Airbnb Experiences", type: "City walks / culture", low: "KES 2,500", high: "KES 6,000", avg: "KES 4,000", color: "#FF5A5F" },
                        { platform: "GetYourGuide", type: "Safari / nature day trips", low: "KES 5,000", high: "KES 18,000", avg: "KES 9,500", color: "#FF8000" },
                        { platform: "Viator", type: "Food & cooking tours", low: "KES 3,000", high: "KES 8,500", avg: "KES 5,200", color: "#0B6EFD" },
                      ].map((b) => (
                        <div key={b.platform} className="rounded-lg border border-border/50 bg-card/60 p-3 space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full shrink-0" style={{ background: b.color }} />
                            <span className="text-[11px] font-bold text-foreground">{b.platform}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{b.type}</p>
                          <div className="pt-1 border-t border-border/30">
                            <p className="text-xs font-semibold text-foreground">{b.avg} <span className="font-normal text-muted-foreground">avg/person</span></p>
                            <p className="text-[10px] text-muted-foreground">{b.low} – {b.high} range</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-[#2CB67D]/5 border border-[#2CB67D]/20 rounded-lg p-2.5">
                      <Info className="size-3.5 text-[#2CB67D] shrink-0 mt-0.5" />
                      <span><strong className="text-foreground">Ausaguide advantage:</strong> No platform fees means you keep 100% — so you can price 10–20% below competitors and still earn more.</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="tour-currency">Currency</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger id="tour-currency">
                          <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="KES">KES (Kenyan Shilling)</SelectItem>
                          <SelectItem value="USD">USD (US Dollar)</SelectItem>
                          <SelectItem value="EUR">EUR (Euro)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tour-physical-price">Physical Price (In-Person)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="tour-physical-price"
                          type="number"
                          min="0"
                          value={physicalPrice}
                          onChange={(e) => {
                            setPhysicalPrice(e.target.value)
                            setPrice(e.target.value)
                          }}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tour-virtual-price">Virtual Price (Virtual Live)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="tour-virtual-price"
                          type="number"
                          min="0"
                          value={virtualPrice}
                          onChange={(e) => setVirtualPrice(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-4">
                    <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                      <Tag className="size-4 text-teal" />
                      Group Discounts Settings
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="group-discount-pct">Discount Percentage (%)</Label>
                        <Input
                          id="group-discount-pct"
                          type="number"
                          min="0"
                          max="100"
                          value={groupDiscount}
                          onChange={(e) => setGroupDiscount(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="group-size-threshold">Min Guests for Discount</Label>
                        <Input
                          id="group-size-threshold"
                          type="number"
                          min="2"
                          value={groupSizeThreshold}
                          onChange={(e) => setGroupSizeThreshold(e.target.value)}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enable group pricing automatically! Guests booking more than {groupSizeThreshold} tickets will receive a {groupDiscount}% discount on the total checkout value.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 5: Availability */}
            {currentStep === 4 && (
              <Card className="border-border/40 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl">Select Availability & Sessions</CardTitle>
                  <CardDescription>Setup your schedule, recurring days, and hourly start times.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Recurring Days */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Available Days (Weekly Recurring)</Label>
                    <div className="flex flex-wrap gap-2">
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
                        const active = selectedDays.includes(day)
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() =>
                              setSelectedDays((prev) =>
                                active ? prev.filter((d) => d !== day) : [...prev, day]
                              )
                            }
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                              active
                                ? "bg-teal-500/20 border-teal text-teal-400"
                                : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {day}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Sessions Times */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Sessions Start Times</Label>
                    <div className="flex flex-wrap gap-2">
                      {timeSlots.map((slot) => (
                        <Badge key={slot} variant="secondary" className="gap-1.5 pr-1 py-1">
                          {slot}
                          <button
                            type="button"
                            onClick={() => removeTimeSlot(slot)}
                            className="rounded-full p-0.5 hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="time"
                        value={newTimeSlot}
                        onChange={(e) => setNewTimeSlot(e.target.value)}
                        className="max-w-[160px]"
                      />
                      <Button variant="outline" size="sm" type="button" onClick={addTimeSlot}>
                        <Plus className="size-4 mr-1" /> Add Slot
                      </Button>
                    </div>
                  </div>

                  {/* Specific Tour Date */}
                  <div className="space-y-2">
                    <Label htmlFor="tour-date" className="text-sm font-semibold">Specific Tour Date (Single Event Date)</Label>
                    <Input
                      id="tour-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="max-w-[200px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      If set, travelers will only be able to book this experience on the selected date.
                    </p>
                  </div>

                  {/* Date range bounds */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="availability-start">Season Start Date (Optional)</Label>
                      <Input
                        id="availability-start"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="availability-end">Season End Date (Optional)</Label>
                      <Input
                        id="availability-end"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Visibility Dropdown */}
                  <div className="space-y-2 border-t border-border/50 pt-4">
                    <Label htmlFor="visibility-status">Visibility Setting</Label>
                    <Select value={status} onValueChange={(val) => setStatus(val as "draft" | "published")}>
                      <SelectTrigger id="visibility-status" className="max-w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft (Visible only to you)</SelectItem>
                        <SelectItem value="published">Published (Visible to everyone)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={prevStep} disabled={currentStep === 0}>
                <ChevronLeft className="size-4 mr-1" /> Previous
              </Button>

              {currentStep < STEPS.length - 1 ? (
                <Button onClick={nextStep}>
                  Next <ChevronRight className="size-4 ml-1" />
                </Button>
              ) : (
                <Button
                  className="bg-teal hover:bg-teal/90"
                  onClick={() => handleSave()}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save & Finish"
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Right Live Preview Column (Real-time Tour Card Preview) */}
          <div className="hidden lg:block space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Eye className="size-4 text-primary" /> Live Card Preview
            </h3>

            <div className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg transition-all duration-300 hover:shadow-xl">
              <div className="relative aspect-video overflow-hidden bg-muted">
                {images.length > 0 ? (
                  <img src={images[0]} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground gap-2 bg-gradient-to-br from-primary/10 to-teal-500/10">
                    <Eye className="size-8 opacity-40 animate-pulse text-primary" />
                    <span className="text-xs italic">Upload a photo...</span>
                  </div>
                )}
                <div className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                  {category ? category.toUpperCase() : "CULTURE"}
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {duration} hours
                  </span>
                  <span className="capitalize">{tourType === "virtual" ? "Virtual" : "In-Person"}</span>
                </div>

                <h4 className="truncate text-base font-bold text-foreground">
                  {title || "Untitled Kenyan Experience"}
                </h4>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3.5 text-primary shrink-0" />
                  <span className="truncate">{locationName || "Nairobi, Kenya"}</span>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px] px-2 py-0">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-border/40 pt-3 mt-3">
                  <div>
                    <span className="text-xs text-muted-foreground">from</span>
                    <span className="ml-1 text-base font-extrabold text-foreground">
                      {currency} {Number(price).toLocaleString()}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick tips */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-xs space-y-2">
              <h5 className="font-semibold text-foreground">Hosting Pro Tips:</h5>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Choose a title that highlights your unique angle.</li>
                <li>Add at least 3 high-quality images.</li>
                <li>Offer a slight group discount to drive volume.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
