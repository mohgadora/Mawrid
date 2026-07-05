'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Mic, MicOff, Camera } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { CATEGORIES } from '@/lib/data'
import { CategoryIcon } from '@/components/category-icon'
import { useProducts } from '@/lib/use-products'
import { ImageSearchModal } from '@/components/image-search-modal'
import { cn } from '@/lib/utils'

export function HeaderSearch({
  variant = 'desktop',
  onNavigate,
}: {
  variant?: 'desktop' | 'mobile'
  onNavigate?: () => void
}) {
  const { t, lang } = useI18n()
  const router = useRouter()
  const { products: PRODUCTS } = useProducts()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [composing, setComposing] = useState(false)
  const [listening, setListening] = useState(false)
  const [imgSearchOpen, setImgSearchOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  const [mounted, setMounted] = useState(false)
  const [hasVoice, setHasVoice] = useState(false)

  useEffect(() => {
    setMounted(true)
    setHasVoice('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  }, [])

  function startVoice() {
    if (!hasVoice) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = lang === 'ar' ? 'ar-SA' : 'en-US'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onresult = (e: any) => {
      const transcript = e.results[0]?.[0]?.transcript ?? ''
      setQuery(transcript)
      setOpen(true)
      setListening(false)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recognitionRef.current = rec
    rec.start()
    setListening(true)
  }

  function stopVoice() {
    recognitionRef.current?.stop()
    setListening(false)
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const q = query.trim().toLowerCase()

  const productMatches = useMemo(() => {
    if (!q) return []
    return PRODUCTS.filter((p) =>
      [p.nameAr, p.nameEn, p.supplierAr, p.supplierEn].join(' ').toLowerCase().includes(q),
    ).slice(0, 5)
  }, [q])

  const categoryMatches = useMemo(() => {
    if (!q) return []
    return CATEGORIES.filter((c) => `${c.nameAr} ${c.nameEn}`.toLowerCase().includes(q)).slice(0, 4)
  }, [q])

  const hasSuggestions = productMatches.length > 0 || categoryMatches.length > 0

  function go(href: string) {
    router.push(href)
    setOpen(false)
    setQuery('')
    onNavigate?.()
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) go(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <>
    <ImageSearchModal open={imgSearchOpen} onClose={() => setImgSearchOpen(false)} />
    <div ref={ref} className="relative mx-auto w-full max-w-2xl flex-1">
      <form onSubmit={submitSearch} className="flex items-center">
        <div className="flex w-full items-center rounded-lg border-2 border-primary/70 bg-background focus-within:border-primary">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onCompositionStart={() => setComposing(true)}
            onCompositionEnd={() => setComposing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (composing || e.nativeEvent.isComposing || e.keyCode === 229)) {
                e.preventDefault()
              }
            }}
            placeholder={listening ? (lang === 'ar' ? 'جاري الاستماع...' : 'Listening...') : t('searchPlaceholder')}
            className={`w-full bg-transparent px-4 text-sm outline-none ${
              variant === 'mobile' ? 'py-2' : 'py-2.5'
            }`}
            aria-label={t('search')}
            role="combobox"
            aria-expanded={open && hasSuggestions}
            aria-autocomplete="list"
          />
          <button
            type="button"
            onClick={() => setImgSearchOpen(true)}
            aria-label={lang === 'ar' ? 'البحث بالصورة' : 'Search by image'}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring me-0.5"
          >
            <Camera className="size-4" />
          </button>
          {mounted && hasVoice && (
            <button
              type="button"
              onClick={listening ? stopVoice : startVoice}
              aria-label={lang === 'ar' ? 'البحث الصوتي' : 'Voice search'}
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring me-1',
                listening
                  ? 'text-destructive animate-pulse'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
              )}
            >
              {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            </button>
          )}
          <button
            type="submit"
            className="m-0.5 flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4"
            aria-label={t('search')}
          >
            <Search className="size-4" />
            <span className="hidden sm:inline">{t('search')}</span>
          </button>
        </div>
      </form>

      {open && q.length > 0 && (
        <div className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-popover py-1 text-popover-foreground shadow-lg">
          {!hasSuggestions && (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              {t('noSuggestions')}
            </p>
          )}

          {categoryMatches.length > 0 && (
            <div className="py-1">
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase text-muted-foreground">
                {t('suggestCategories')}
              </p>
              {categoryMatches.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => go(`/category/${c.slug}`)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-start text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                >
                  <CategoryIcon name={c.icon} className="size-4 text-primary" />
                  {lang === 'ar' ? c.nameAr : c.nameEn}
                </button>
              ))}
            </div>
          )}

          {productMatches.length > 0 && (
            <div className="border-t border-border py-1">
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase text-muted-foreground">
                {t('suggestProducts')}
              </p>
              {productMatches.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  onClick={() => go(`/product/${p.id}`)}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                >
                  <span className="relative size-9 shrink-0 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={p.image || '/placeholder.svg'}
                      alt=""
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  </span>
                  <span className="line-clamp-1 flex-1 text-sm text-foreground">
                    {lang === 'ar' ? p.nameAr : p.nameEn}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
    </>
  )
}
