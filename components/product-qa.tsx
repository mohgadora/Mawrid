'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, HelpCircle, MessageSquare, Send, BadgeCheck } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type QA = {
  id: string
  questionAr: string
  questionEn: string
  answerAr: string | null
  answerEn: string | null
  askedBy: string
  answeredBySupplier: boolean
  date: string
}

function seedQA(productId: string): QA[] {
  // Deterministic demo questions seeded from product id
  const hash = productId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return [
    {
      id: `${productId}_q1`,
      questionAr: 'هل المنتج متاح بكميات أقل من الحد الأدنى للطلب؟',
      questionEn: 'Is the product available in quantities below the minimum order?',
      answerAr: 'عذراً، نعمل بنظام الجملة فقط والحد الأدنى للطلب هو كما مُوضّح في صفحة المنتج.',
      answerEn: 'Sorry, we only operate wholesale and the minimum order is as shown on the product page.',
      askedBy: hash % 2 === 0 ? 'متجر الأمانة' : 'Al Amanah Store',
      answeredBySupplier: true,
      date: '2025-11-14',
    },
    {
      id: `${productId}_q2`,
      questionAr: 'ما هي مدة الصلاحية للمنتج؟',
      questionEn: 'What is the shelf life of this product?',
      answerAr: 'مدة الصلاحية 18 شهراً من تاريخ التصنيع وتكون مطبوعة على الغلاف الخارجي.',
      answerEn: 'Shelf life is 18 months from the manufacturing date, printed on the outer packaging.',
      askedBy: hash % 3 === 0 ? 'بقالة النور' : 'Al Nour Grocery',
      answeredBySupplier: true,
      date: '2025-12-02',
    },
    {
      id: `${productId}_q3`,
      questionAr: 'هل يوجد خصم عند الطلب المتكرر؟',
      questionEn: 'Is there a discount for repeat orders?',
      answerAr: null,
      answerEn: null,
      askedBy: hash % 2 === 1 ? 'سوبرماركت الخليج' : 'Gulf Supermarket',
      answeredBySupplier: false,
      date: '2026-01-08',
    },
  ]
}

export function ProductQA({ productId }: { productId: string }) {
  const { lang } = useI18n()
  const [questions] = useState<QA[]>(() => seedQA(productId))
  const [expanded, setExpanded] = useState<string | null>(questions[0]?.id ?? null)
  const [showForm, setShowForm] = useState(false)
  const [question, setQuestion] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim()) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    setSubmitted(true)
    setQuestion('')
    setShowForm(false)
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <HelpCircle className="size-5 text-primary" />
          {lang === 'ar' ? 'أسئلة وأجوبة' : 'Questions & Answers'}
          <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            {questions.length}
          </span>
        </h2>
        <button
          onClick={() => { setShowForm((s) => !s); setSubmitted(false) }}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MessageSquare className="size-3.5" />
          {lang === 'ar' ? 'اطرح سؤالاً' : 'Ask a question'}
        </button>
      </div>

      {/* Ask a question form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-5 overflow-hidden rounded-xl border border-border bg-accent/30"
        >
          <div className="border-b border-border bg-accent/40 px-4 py-2.5">
            <p className="text-sm font-semibold text-foreground">
              {lang === 'ar' ? 'سؤالك للمورّد' : 'Your question to the supplier'}
            </p>
          </div>
          <div className="p-4">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={
                lang === 'ar'
                  ? 'اكتب سؤالك هنا، سيُجيب المورّد في أقرب وقت...'
                  : 'Write your question here, the supplier will reply soon...'
              }
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <div className="mt-3 flex items-center justify-between">
              {submitted && (
                <p className="text-xs text-success">
                  {lang === 'ar' ? 'تم إرسال سؤالك بنجاح!' : 'Your question was submitted!'}
                </p>
              )}
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="ms-auto flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Send className="size-3.5" />
                {loading
                  ? lang === 'ar' ? 'جارٍ الإرسال...' : 'Sending...'
                  : lang === 'ar' ? 'إرسال' : 'Submit'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Q&A list */}
      <div className="flex flex-col divide-y divide-border">
        {questions.map((qa) => {
          const q = lang === 'ar' ? qa.questionAr : qa.questionEn
          const a = lang === 'ar' ? qa.answerAr : qa.answerEn
          const isOpen = expanded === qa.id
          return (
            <div key={qa.id} className="py-3">
              <button
                onClick={() => setExpanded(isOpen ? null : qa.id)}
                className="flex w-full items-start gap-3 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
              >
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                  Q
                </span>
                <span className="flex-1 text-sm font-semibold text-foreground">{q}</span>
                <span className="mt-0.5 shrink-0 text-muted-foreground">
                  {isOpen
                    ? <ChevronUp className="size-4" />
                    : <ChevronDown className="size-4" />}
                </span>
              </button>

              {isOpen && (
                <div className="mt-3 ms-9">
                  {a ? (
                    <div className="rounded-lg border border-success/20 bg-success/5 px-4 py-3">
                      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-success">
                        <BadgeCheck className="size-3.5" />
                        {lang === 'ar' ? 'إجابة المورّد' : 'Supplier answer'}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{a}</p>
                    </div>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      {lang === 'ar'
                        ? 'لم يتم الرد على هذا السؤال بعد.'
                        : 'This question has not been answered yet.'}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {lang === 'ar' ? 'سأل:' : 'Asked by:'} {qa.askedBy} · {qa.date}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
