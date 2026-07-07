'use client'

import { useEffect, useRef, useState } from 'react'
import { UserPlus, Copy, Check, Share2, MessageCircle, Mail } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/toast'

const REFERRAL_CODE = 'WHOLESALE2024'
const REFERRAL_LINK = 'https://app.example.com/join?ref=WHOLESALE2024'

type InvitedColleague = {
  id: string
  name: string
  status: 'pending' | 'joined'
  date: string
}

const MOCK_INVITED: InvitedColleague[] = [
  { id: '1', name: 'أحمد المطيري / Ahmed Al-Mutairi', status: 'joined', date: '2024-06-01' },
  { id: '2', name: 'سارة العتيبي / Sara Al-Otaibi', status: 'pending', date: '2024-06-15' },
]

export function InviteSection() {
  const { t, lang } = useI18n()
  const { success } = useToast()
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const copiedLinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    if (copiedLinkTimerRef.current) clearTimeout(copiedLinkTimerRef.current)
  }, [])

  function copyCode() {
    navigator.clipboard.writeText(REFERRAL_CODE).catch(() => {})
    setCopied(true)
    success(lang === 'ar' ? 'تم نسخ الكود!' : 'Code copied!')
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000)
  }

  function copyLink() {
    navigator.clipboard.writeText(REFERRAL_LINK).catch(() => {})
    setCopiedLink(true)
    success(lang === 'ar' ? 'تم نسخ الرابط!' : 'Link copied!')
    if (copiedLinkTimerRef.current) clearTimeout(copiedLinkTimerRef.current)
    copiedLinkTimerRef.current = setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Hero card */}
      <div className="overflow-hidden rounded-2xl border border-success/30 bg-success/5 p-5">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-success/15 text-success">
            <UserPlus className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-foreground">
              {lang === 'ar' ? 'ادعُ زملاءك واكسب مكافآت' : 'Invite colleagues & earn rewards'}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">
              {lang === 'ar'
                ? 'شارك رابط الإحالة مع زملائك. احصل على 200 نقطة لكل شخص ينضم عبر رابطك.'
                : 'Share your referral link with colleagues. Earn 200 points for every person who joins through your link.'}
            </p>
          </div>
        </div>

        {/* Referral code */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
            <span className="text-xs text-muted-foreground">
              {lang === 'ar' ? 'كود الإحالة' : 'Referral code'}
            </span>
            <span className="flex-1 text-center font-black tracking-widest text-primary">
              {REFERRAL_CODE}
            </span>
            <button
              onClick={copyCode}
              className="grid size-8 shrink-0 place-items-center rounded-lg transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={lang === 'ar' ? 'نسخ الكود' : 'Copy code'}
            >
              {copied ? (
                <Check className="size-4 text-success" />
              ) : (
                <Copy className="size-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Share buttons */}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {copiedLink ? <Check className="size-4 text-success" /> : <Share2 className="size-4" />}
            {lang === 'ar' ? 'نسخ الرابط' : 'Copy link'}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              lang === 'ar'
                ? `انضم إلى منصة الجملة باستخدام كودي ${REFERRAL_CODE}: ${REFERRAL_LINK}`
                : `Join the wholesale platform using my code ${REFERRAL_CODE}: ${REFERRAL_LINK}`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-success/15 px-3 py-2 text-sm font-semibold text-success transition-colors hover:bg-success/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MessageCircle className="size-4" />
            WhatsApp
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent(lang === 'ar' ? 'دعوة للانضمام' : 'Invitation to join')}&body=${encodeURIComponent(
              lang === 'ar'
                ? `مرحباً، أدعوك للانضمام إلى منصة الجملة. استخدم كودي: ${REFERRAL_CODE}\nالرابط: ${REFERRAL_LINK}`
                : `Hi, I invite you to join our wholesale platform. Use my code: ${REFERRAL_CODE}\nLink: ${REFERRAL_LINK}`,
            )}`}
            className="flex items-center gap-1.5 rounded-lg bg-chart-4/15 px-3 py-2 text-sm font-semibold text-chart-4 transition-colors hover:bg-chart-4/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Mail className="size-4" />
            {lang === 'ar' ? 'بريد إلكتروني' : 'Email'}
          </a>
        </div>
      </div>

      {/* Invited colleagues list */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <h4 className="mb-3 text-sm font-bold text-muted-foreground">
          {lang === 'ar' ? 'الزملاء المدعوون' : 'Invited colleagues'}
        </h4>
        {MOCK_INVITED.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {lang === 'ar' ? 'لم تدعُ أحداً بعد.' : 'No invites sent yet.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {MOCK_INVITED.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                  {c.name.charAt(0)}
                </span>
                <span className="flex-1 truncate text-sm font-medium text-foreground">{c.name}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    c.status === 'joined'
                      ? 'bg-success/15 text-success'
                      : 'bg-chart-3/15 text-chart-3'
                  }`}
                >
                  {c.status === 'joined'
                    ? lang === 'ar' ? 'انضم' : 'Joined'
                    : lang === 'ar' ? 'في الانتظار' : 'Pending'}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 rounded-lg bg-primary/8 px-3 py-2 text-sm text-primary font-semibold">
          {lang === 'ar' ? '1 زميل انضم · ربحت 200 نقطة حتى الآن' : '1 colleague joined · 200 points earned so far'}
        </div>
      </div>
    </div>
  )
}
