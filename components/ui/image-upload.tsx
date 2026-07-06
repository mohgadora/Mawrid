'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  label?: string
  className?: string
  aspectRatio?: 'square' | 'banner'
}

export function ImageUpload({ value, onChange, label, className, aspectRatio = 'square' }: ImageUploadProps) {
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/v1/upload', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload failed')
      onChange(json.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const isBanner = aspectRatio === 'banner'

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !uploading && ref.current?.click()}
        className={cn(
          'relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary hover:bg-muted/60',
          isBanner ? 'h-28 w-full' : 'h-28 w-28',
          uploading && 'pointer-events-none opacity-60',
        )}
      >
        {value && !uploading ? (
          <>
            <Image
              src={value}
              alt="preview"
              fill
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange('') }}
              className="absolute end-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
            >
              <X className="size-3.5" />
            </button>
          </>
        ) : uploading ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-center">
            <Upload className="size-5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">اضغط أو اسحب الصورة</span>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={onInputChange} />
    </div>
  )
}
