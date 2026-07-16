import React, { useState, useRef } from "react"
import { Upload, X, ImageIcon, Loader2, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CoverImageUploaderProps {
  value: string | null // current cover URL
  onChange: (url: string | null) => void
  bucket?: string
  maxSizeMB?: number
}

export default function CoverImageUploader({
  value,
  onChange,
  bucket = "tours",
  maxSizeMB = 20,
}: CoverImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingPreview, setPendingPreview] = useState<string | null>(null) // blob preview while uploading
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === "dragenter" || e.type === "dragover")
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    // reset input so the same file can be re-selected
    e.target.value = ""
  }

  async function processFile(file: File) {
    setError(null)

    if (!file.type.startsWith("image/")) {
      setError("Only image files are supported (JPEG, PNG, WebP, HEIC).")
      return
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${maxSizeMB}MB.`)
      return
    }

    // Show local preview immediately — we'll clear it if upload fails
    const blobUrl = URL.createObjectURL(file)
    setPendingPreview(blobUrl)
    setUploading(true)

    try {
      const fileExt = file.name.split(".").pop() ?? "jpg"
      const fileName = `cover_${Math.random().toString(36).substring(2, 12)}_${Date.now()}.${fileExt}`

      // Ensure bucket exists
      const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { cacheControl: "3600", upsert: false })

      if (uploadErr) {
        // If bucket missing, create it and retry
        if (uploadErr.message.toLowerCase().includes("bucket not found")) {
          await supabase.storage.createBucket(bucket, { public: true })
          const { error: retryErr } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, { cacheControl: "3600", upsert: false })
          if (retryErr) throw retryErr
        } else {
          throw uploadErr
        }
      }

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName)

      // Only now update the real value
      onChange(publicUrl)
      toast.success("Cover photo uploaded!")
    } catch (err: any) {
      // Upload failed — clear the pending preview so old cover stays visible
      setPendingPreview(null)
      const msg = err?.message ?? "Upload failed. Please try again."
      setError(msg)
      toast.error(msg)
    } finally {
      URL.revokeObjectURL(blobUrl)
      setUploading(false)
    }
  }

  const displaySrc = pendingPreview ?? value

  return (
    <div className="space-y-3">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={cn(
          "relative group overflow-hidden rounded-2xl border-2 transition-all duration-200 cursor-pointer",
          dragActive
            ? "border-primary bg-primary/5 scale-[0.99]"
            : displaySrc
            ? "border-border hover:border-primary/50"
            : "border-dashed border-border hover:border-primary/50 bg-card/30 hover:bg-card/50",
          uploading && "pointer-events-none"
        )}
        style={{ aspectRatio: "16/9", minHeight: "220px" }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {displaySrc ? (
          <>
            {/* Current / pending preview image */}
            <img
              src={displaySrc}
              alt="Cover"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />

            {/* Overlay: uploading spinner */}
            {uploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 backdrop-blur-sm z-10">
                <Loader2 className="size-8 text-white animate-spin" />
                <p className="text-white text-sm font-semibold">Uploading…</p>
              </div>
            )}

            {/* Overlay: hover change button */}
            {!uploading && (
              <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-semibold border border-white/20">
                  <RefreshCw className="size-4" />
                  Change cover photo
                </div>
              </div>
            )}

            {/* Remove button */}
            {!uploading && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(null) }}
                className="absolute top-3 right-3 z-20 flex size-8 items-center justify-center rounded-full bg-black/60 text-white border border-white/20 hover:bg-red-600 transition-colors"
                title="Remove cover photo"
              >
                <X className="size-4" />
              </button>
            )}

            {/* Cover badge */}
            <div className="absolute bottom-3 left-3 z-10 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white border border-white/20 backdrop-blur-sm">
              Cover Photo
            </div>
          </>
        ) : (
          // Empty state
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ImageIcon className="size-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Upload cover photo</p>
              <p className="text-xs text-muted-foreground mt-1">
                Drag & drop or <span className="text-primary font-semibold">browse files</span>
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-2">
                JPEG, PNG, WebP · Up to {maxSizeMB}MB · Full resolution preserved
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
          <span className="shrink-0">⚠️</span>
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto shrink-0 text-destructive/60 hover:text-destructive"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
