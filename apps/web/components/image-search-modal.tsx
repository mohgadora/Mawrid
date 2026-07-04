'use client'

import { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Camera, Upload, X, Loader2, ScanSearch, Sparkles, AlertCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/data'

interface ImageSearchModalProps {
  open: boolean
  onClose: () => void
}

export function ImageSearchModal({ open, onClose }: ImageSearchModalProps) {
  const { lang, formatPrice } = useI18n()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Product[]>([])
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en)

  function reset() {
    setPreview(null)
    setResults([])
    setDescription('')
    setError(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function processFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError(t('الملف يجب أن يكون صورة', 'File must be an image'))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t('حجم الصورة يجب ألا يتجاوز 5 ميجا', 'Image must be smaller than 5 MB'))
      return
    }

    // Preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setLoading(true)
    setError(null)
    setResults([])
    setDescription('')

    try {
      const fd = new FormData()
      fd.append('image', file)
      fd.append('lang', lang)
      const res = await fetch('/api/image-search', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setResults(data.results ?? [])
      setDescription(data.description ?? '')
    } catch {
      setError(t('حدث خطأ أثناء تحليل الصورة', 'Failed to analyze image. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={t('البحث بالصورة', 'Search by image')}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="flex w-full max-w-xl flex-col gap-4 rounded-t-3xl border border-border bg-card p-5 shadow-2xl sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="size-4 text-primary" />
            </span>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {t('البحث بالصورة', 'Search by Image')}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t('الذكاء الاصطناعي يحلل صورتك ويجد المنتجات المشابهة', 'AI analyzes your image and finds matching products')}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label={t('إغلاق', 'Close')}
            className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Drop zone */}
        {!preview && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 transition-colors',
              dragging
                ? 'border-primary bg-primary/5'
                : 'border-border bg-muted/30 hover:border-primary/60 hover:bg-accent/30',
            )}
            onClick={() => fileRef.current?.click()}
          >
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
              <ScanSearch className="size-7 text-primary" />
            </span>
            <div className="text-center">
              <p className="font-semibold text-foreground">
                {t('اسحب وأفلت الصورة هنا', 'Drag and drop your image here')}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('أو اضغط لاختيار صورة من جهازك', 'or click to upload from your device')}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {t('JPG، PNG، WEBP — حتى 5 ميجابايت', 'JPG, PNG, WEBP — up to 5 MB')}
              </p>
            </div>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <Upload className="size-3.5" />
                {t('رفع صورة', 'Upload image')}
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <Camera className="size-3.5" />
                {t('الكاميرا', 'Camera')}
              </span>
            </div>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={onFileChange}
        />

        {/* Preview + results */}
        {preview && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                <Image src={preview} alt="preview" fill sizes="80px" className="object-cover" />
              </div>
              <div className="flex-1">
                {loading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    {t('يحلل الذكاء الاصطناعي الصورة...', 'AI is analyzing your image...')}
                  </div>
                )}
                {description && !loading && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="size-4 shrink-0" />
                    {error}
                  </div>
                )}
              </div>
              <button
                onClick={reset}
                aria-label={t('صورة جديدة', 'New image')}
                className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {results.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  {t('المنتجات المشابهة', 'Similar products')} ({results.length})
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {results.map((p) => (
                    <Link
                      key={p.id}
                      href={`/product/${p.id}`}
                      onClick={handleClose}
                      className="flex flex-col overflow-hidden rounded-xl border border-border bg-background transition-colors hover:border-primary/40 hover:bg-accent/30"
                    >
                      <div className="relative aspect-square bg-muted">
                        <Image
                          src={p.image || '/placeholder.svg'}
                          alt={lang === 'ar' ? p.nameAr : p.nameEn}
                          fill
                          sizes="150px"
                          className="object-cover"
                        />
                      </div>
                      <div className="p-2">
                        <p className="line-clamp-2 text-[11px] font-medium leading-tight text-foreground">
                          {lang === 'ar' ? p.nameAr : p.nameEn}
                        </p>
                        <p className="mt-1 text-xs font-bold text-primary">
                          {formatPrice(p.basePrice)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {!loading && results.length === 0 && !error && (
              <p className="text-center text-sm text-muted-foreground">
                {t('لم نجد منتجات مشابهة. جرّب صورة أخرى.', 'No matching products found. Try a different image.')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
