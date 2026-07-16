import { useState, useEffect, useRef } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
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
  DollarSign,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { fetchTourById, updateTour } from "@/lib/api/tours"
import type { TourCategory, TourType } from "@/lib/types"
import Dropzone from "@/components/ui/Dropzone"
import CoverImageUploader from "@/components/ui/CoverImageUploader"

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

export default function EditTourPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
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

  // Images state — cover is images[0], gallery is images[1..n]
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [galleryImages, setGalleryImages] = useState<string[]>([])

  // Pricing
  const [price, setPrice] = useState("3500")
  const [physicalPrice, setPhysicalPrice] = useState("3500")
  const [virtualPrice, setVirtualPrice] = useState("1500")
  const [currency, setCurrency] = useState("KES")
  const [groupDiscount, setGroupDiscount] = useState("10")
  const [groupSizeThreshold, setGroupSizeThreshold] = useState("5")

  // Availability
  const [date, setDate] = useState("")
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [newTimeSlot, setNewTimeSlot] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Tags
  const [tags, setTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState("")

  // Visibility / Status
  const [status, setStatus] = useState<"draft" | "published">("draft")

  useEffect(() => {
    if (!id) return
    fetchTourById(id)
      .then((tour) => {
        if (!tour) {
          toast.error("Tour not found.")
          navigate("/dashboard")
          return
        }
        
        // Populate states
        setTitle(tour.title)
        setCategory(tour.category)
        setDuration(tour.duration_hours.toString())
        setLocationName(tour.location_name)
        setTourType(tour.tour_type)
        setMaxGuests(tour.max_guests.toString())
        setDescription(tour.description)
        // Split existing images into cover + gallery
        const existingImages = tour.images ?? []
        setCoverImage(existingImages[0] ?? null)
        setGalleryImages(existingImages.slice(1))
        setPrice(tour.price.toString())
        setPhysicalPrice((tour.physical_price ?? tour.price).toString())
        setVirtualPrice((tour.virtual_price ?? 1500).toString())
        setCurrency(tour.currency)
        setTags(tour.tags || [])
        setStatus(tour.status || (tour.is_published ? "published" : "draft"))

        // Populate availability
        const avail = tour.availability || {}
        setSelectedDays(avail.days || [])
        setTimeSlots(avail.times || [])
        setStartDate(avail.startDate || "")
        setEndDate(avail.endDate || "")
        setDate(avail.date || "")
        
        const disc = avail.discounts || {}
        setGroupDiscount((disc.percentage ?? 10).toString())
        setGroupSizeThreshold((disc.threshold ?? 5).toString())
      })
      .catch((err) => {
        console.error(err)
        toast.error("Failed to load tour details.")
      })
      .finally(() => setLoading(false))
  }, [id, navigate])

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

  const insertFormatting = (prefix: string, suffix: string) => {
    const textarea = descTextareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const selected = text.substring(start, end)
    const replacement = prefix + selected + suffix

    setDescription(text.substring(0, start) + replacement + text.substring(end))
    
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length)
    }, 50)
  }

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

  const handleSave = async (visibilityStatus?: "draft" | "published") => {
    const targetStatus = visibilityStatus || status

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
    const toastId = toast.loading("Updating tour...")

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

      await updateTour(id!, {
        title: title.trim(),
        description: description.trim(),
        short_description: description.trim().substring(0, 150),
        price: Number(physicalPrice) || 0,
        physical_price: Number(physicalPrice) || 0,
        virtual_price: Number(virtualPrice) || 0,
        currency,
        duration_hours: Number(duration) || 1,
        max_guests: Number(maxGuests) || 10,
        location_name: locationName.trim(),
        category,
        tour_type: tourType,
        images: [coverImage, ...galleryImages].filter(Boolean) as string[],
        status: targetStatus,
        availability: availabilityJSON,
        tags: tags,
      })

      toast.success(targetStatus === "published" ? "Tour published successfully!" : "Tour draft updated!", { id: toastId })
      navigate("/dashboard")
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Failed to save tour", { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <Spinner className="size-8 text-primary" />
        <p className="text-sm text-muted-foreground">Loading tour details…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 py-24 md:px-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/3 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
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
              Edit Tour
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSave("draft")} disabled={submitting}>
              Save as Draft
            </Button>
            <Button
              className="bg-gradient-to-r from-primary to-purple-600"
              onClick={() => handleSave("published")}
              disabled={submitting}
            >
              Publish changes
            </Button>
          </div>
        </div>

        {/* Stepper */}
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
                      ? "border-primary bg-primary text-primary-foreground"
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

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          {/* Form */}
          <div className="space-y-6">
            {currentStep === 0 && (
              <Card className="border-border/40 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl">Basic Tour Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tour-title">Tour Title</Label>
                    <Input
                      id="tour-title"
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

            {currentStep === 1 && (
              <Card className="border-border/40 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl">Description</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-border bg-muted/20 p-2">
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
                      placeholder="Markdown descriptions are welcome..."
                      className="min-h-[260px] w-full bg-transparent p-2 text-sm text-foreground outline-none resize-y font-sans"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card className="border-border/40 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl">Tour Photos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">

                  {/* Cover photo */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">1</span>
                      <h3 className="text-sm font-semibold text-foreground">Cover Photo <span className="text-destructive">*</span></h3>
                      <span className="ml-auto text-[10px] text-muted-foreground">Required · shown on tour card</span>
                    </div>
                    <CoverImageUploader
                      bucket="chat-images"
                      maxSizeMB={20}
                      value={coverImage}
                      onChange={setCoverImage}
                    />
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Gallery / Checkpoints (optional)</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Gallery photos */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">2</span>
                      <h3 className="text-sm font-semibold text-foreground">Checkpoint / Gallery Photos</h3>
                      <span className="ml-auto text-[10px] text-muted-foreground">Optional · up to 10 extra photos</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Add photos of each stop on your tour — markets, viewpoints, restaurants, etc.</p>
                    <Dropzone
                      bucket="chat-images"
                      multiple={true}
                      maxSizeMB={20}
                      value={galleryImages}
                      onChange={setGalleryImages}
                    />
                  </div>

                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <Card className="border-border/40 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl">Set Price & Discounts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="edit-currency">Currency</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger id="edit-currency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="KES">KES</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-physical-price">Physical Price (In-Person)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="edit-physical-price"
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
                      <Label htmlFor="edit-virtual-price">Virtual Price (Virtual Live)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="edit-virtual-price"
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
                    <h3 className="font-semibold text-sm">Group Discounts</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="edit-discount">Discount Percentage (%)</Label>
                        <Input
                          id="edit-discount"
                          type="number"
                          value={groupDiscount}
                          onChange={(e) => setGroupDiscount(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-threshold">Min Guests for Discount</Label>
                        <Input
                          id="edit-threshold"
                          type="number"
                          value={groupSizeThreshold}
                          onChange={(e) => setGroupSizeThreshold(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 4 && (
              <Card className="border-border/40 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl">Availability & Visibility</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
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
                              active ? "bg-teal-500/20 border-teal text-teal-400" : "bg-muted/40 border-border text-muted-foreground"
                            }`}
                          >
                            {day}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Sessions Start Times</Label>
                    <div className="flex flex-wrap gap-2">
                      {timeSlots.map((slot) => (
                        <Badge key={slot} variant="secondary" className="gap-1.5 pr-1 py-1">
                          {slot}
                          <button type="button" onClick={() => removeTimeSlot(slot)}>
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
                      <Button variant="outline" size="sm" onClick={addTimeSlot}>
                        <Plus className="size-4 mr-1" /> Add
                      </Button>
                    </div>
                  </div>

                  {/* Specific Tour Date */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-tour-date" className="text-sm font-semibold">Specific Tour Date (Single Event Date)</Label>
                    <Input
                      id="edit-tour-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="max-w-[200px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      If set, travelers will only be able to book this experience on the selected date.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-start">Season Start Date</Label>
                      <Input
                        id="edit-start"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-end">Season End Date</Label>
                      <Input
                        id="edit-end"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-border/50 pt-4">
                    <Label htmlFor="edit-status">Visibility Setting</Label>
                    <Select value={status} onValueChange={(val) => setStatus(val as "draft" | "published")}>
                      <SelectTrigger id="edit-status" className="max-w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={prevStep} disabled={currentStep === 0}>
                <ChevronLeft className="size-4 mr-1" /> Previous
              </Button>
              {currentStep < STEPS.length - 1 ? (
                <Button onClick={nextStep}>
                  Next <ChevronRight className="size-4 ml-1" />
                </Button>
              ) : (
                <Button className="bg-teal hover:bg-teal/90" onClick={() => handleSave()} disabled={submitting}>
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : "Publish changes"}
                </Button>
              )}
            </div>
          </div>

          {/* Live Preview */}
          <div className="hidden lg:block space-y-4">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
              <Eye className="size-4 text-primary" /> Live Card Preview
            </h3>

            <div className="group overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
              <div className="relative aspect-video bg-muted">
                {coverImage ? (
                  <img src={coverImage} alt={title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">Preview Image</div>
                )}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{duration} hours</span>
                  <span className="capitalize">{tourType}</span>
                </div>
                <h4 className="truncate font-bold">{title || "Untitled Tour"}</h4>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" />
                  <span>{locationName || "Location"}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.slice(0, 3).map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                </div>
                <div className="flex justify-between border-t pt-3 mt-3">
                  <span>{currency} {Number(price).toLocaleString()}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{status}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
