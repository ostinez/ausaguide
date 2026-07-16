import React, { useState, useRef } from "react"
import { Upload, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface UploadingFile {
  id: string
  name: string
  progress: number
}

interface DropzoneProps {
  bucket?: string
  multiple?: boolean
  maxSizeMB?: number
  value: string[]
  onChange: (urls: string[]) => void
  onUploadingChange?: (uploading: boolean) => void
  aspectRatio?: "square" | "video" | "auto"
}

export default function Dropzone({
  bucket = "tours",
  multiple = true,
  maxSizeMB = 5,
  value = [],
  onChange,
  onUploadingChange,
  aspectRatio = "video",
}: DropzoneProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleUpload(e.dataTransfer.files)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleUpload(e.target.files)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleUpload = async (fileList: FileList) => {
    const filesToUpload = Array.from(fileList).filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" is not an image. Only image files are supported.`)
        return false
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds the ${maxSizeMB}MB file size limit.`)
        return false
      }
      return true
    })

    if (filesToUpload.length === 0) return

    onUploadingChange?.(true)

    // Setup active state tracking for progress bars
    const pendingUploads: UploadingFile[] = filesToUpload.map((f) => ({
      id: `${f.name}_${Date.now()}`,
      name: f.name,
      progress: 0,
    }))
    setUploadingFiles((prev) => [...prev, ...pendingUploads])

    const uploadedUrls: string[] = []

    const uploadPromises = filesToUpload.map(async (file, index) => {
      const currentUpload = pendingUploads[index]

      // Start simulating progress bar loading animation
      const interval = setInterval(() => {
        setUploadingFiles((prev) =>
          prev.map((uf) =>
            uf.id === currentUpload.id
              ? { ...uf, progress: Math.min(uf.progress + Math.floor(Math.random() * 15) + 5, 90) }
              : uf
          )
        )
      }, 150)

      try {
        const fileExt = file.name.split(".").pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        // Upload to Supabase
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          })

        if (uploadError) {
          if (uploadError.message.includes("Bucket not found")) {
            await supabase.storage.createBucket(bucket, {
              public: true,
            })
            const { error: retryError } = await supabase.storage
              .from(bucket)
              .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false,
              })
            if (retryError) throw retryError
          } else {
            throw uploadError
          }
        }

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath)

        clearInterval(interval)
        setUploadingFiles((prev) =>
          prev.map((uf) => (uf.id === currentUpload.id ? { ...uf, progress: 100 } : uf))
        )

        return publicUrl
      } catch (err) {
        clearInterval(interval)
        console.error(err)
        toast.error(`Failed to upload file: ${file.name}`)
        setUploadingFiles((prev) => prev.filter((uf) => uf.id !== currentUpload.id))
        return null
      }
    })

    const results = await Promise.all(uploadPromises)
    const newUploadedUrls = results.filter((url): url is string => url !== null)
    uploadedUrls.push(...newUploadedUrls)

    // Done uploading
    setTimeout(() => {
      setUploadingFiles((prev) => prev.filter((uf) => !pendingUploads.some((pu) => pu.id === uf.id)))
      onUploadingChange?.(false)
    }, 500)

    if (uploadedUrls.length > 0) {
      if (multiple) {
        onChange([...value, ...uploadedUrls])
      } else {
        onChange([uploadedUrls[0]])
      }
      toast.success("Photos uploaded successfully!")
    }
  }

  const handleRemove = (urlToRemove: string) => {
    onChange(value.filter((url) => url !== urlToRemove))
    toast.success("Photo removed")
  }

  const handleReorder = (index: number, direction: "left" | "right") => {
    const newValue = [...value]
    const targetIndex = direction === "left" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newValue.length) return
    const temp = newValue[index]
    newValue[index] = newValue[targetIndex]
    newValue[targetIndex] = temp
    onChange(newValue)
  }

  return (
    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
      {/* Drop / Drag Area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer",
          dragActive
            ? "border-primary bg-primary/5 scale-[0.99]"
            : "border-border hover:border-primary/50 bg-card/30 hover:bg-card/50"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple={multiple}
          accept="image/*"
          className="hidden"
        />
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 mb-4 text-primary">
          <Upload className="size-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">
          Drag and drop your photos here
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          or <span className="text-primary font-semibold hover:underline">browse files</span> from your device
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-3">
          Supports JPEG, PNG, WebP up to {maxSizeMB}MB
        </p>
      </div>

      {/* Progress Bars List */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Uploading files...</p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {uploadingFiles.map((file) => (
              <div key={file.id} className="relative flex flex-col rounded-xl border border-border bg-card/40 p-2.5 shadow-sm">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground mb-1">
                  <span className="truncate pr-2">{file.name}</span>
                  <span className="text-primary">{file.progress}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Thumbnails Grid */}
      {value.length > 0 && (
        <div className="space-y-2">
          {multiple && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Uploaded Photos ({value.length})
            </p>
          )}
          <div
            className={cn(
              "grid gap-4",
              multiple
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
                : "grid-cols-1 max-w-[200px]"
            )}
          >
            {value.map((url, idx) => (
              <div
                key={url}
                className={cn(
                  "group relative overflow-hidden rounded-xl border border-border bg-muted",
                  aspectRatio === "square" ? "aspect-square" : "aspect-video"
                )}
              >
                <img
                  src={url}
                  alt={`Upload ${idx + 1}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {idx === 0 && multiple && (
                  <Badge className="absolute left-2 top-2 bg-teal hover:bg-teal text-white border-none py-0.5 text-[9px] uppercase tracking-wider">
                    Cover
                  </Badge>
                )}
                
                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center gap-1.5">
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="size-7 rounded-full shadow"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove(url)
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                  
                  {multiple && idx > 0 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="size-7 rounded-full bg-black/75 hover:bg-black text-white border-none shadow"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReorder(idx, "left")
                      }}
                    >
                      <ChevronLeft className="size-3.5" />
                    </Button>
                  )}
                  
                  {multiple && idx < value.length - 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="size-7 rounded-full bg-black/75 hover:bg-black text-white border-none shadow"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReorder(idx, "right")
                      }}
                    >
                      <ChevronRight className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
