'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, ShieldCheck, Truck, Wallet } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

const SLIDES = [
  { image: '/banners/hero-warehouse.png' },
  { image: '/banners/bulk-deals.png' },
]

export function HeroCarousel() {
  const { t, dir } = useI18n()
  const [index, setIndex] = useState(0)
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="mx-auto max-w-7xl px-4 pt-4">
      <div className="relative overflow-hidden rounded-2xl">
        {SLIDES.map((slide, i) => (
          <img
            key={i}
            src={slide.image || '/placeholder.svg'}
            alt=""
            aria-hidden={i !== index}
            className={`h-56 w-full object-cover transition-opacity duration-700 sm:h-80 md:h-96 ${
              i === index ? 'opacity-100' : 'absolute inset-0 opacity-0'
            }`}
          />
        ))}

        {/* Overlay content */}
        <div className="absolute inset-0 bg-gradient-to-e from-foreground/80 via-foreground/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center gap-3 p-6 sm:p-10 md:max-w-lg">
          <span className="w-fit rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
            {t('tagline')}
          </span>
          <h1 className="text-2xl font-black leading-tight text-background text-balance sm:text-4xl">
            {t('heroTitle')}
          </h1>
          <p className="text-sm text-background/85 text-pretty sm:text-base">
            {t('heroSubtitle')}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href="#products"
              className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              {t('shopNow')}
              <Arrow className="size-4" />
            </Link>
            <Link
              href="#deals"
              className="rounded-lg bg-background/90 px-5 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-background"
            >
              {t('exploreDeals')}
            </Link>
          </div>
        </div>

        {/* Dots */}
        <div className="absolute bottom-3 start-1/2 flex -translate-x-1/2 gap-1.5 rtl:translate-x-1/2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-6 bg-primary' : 'w-1.5 bg-background/70'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Trust badges */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Truck, label: t('fastDelivery') },
          { icon: ShieldCheck, label: t('orderProtection') },
          { icon: Wallet, label: t('securePayment') },
          { icon: ShieldCheck, label: t('verified') },
        ].map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-xl border border-border bg-card p-3"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
              <item.icon className="size-5" />
            </span>
            <span className="text-xs font-semibold sm:text-sm">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
