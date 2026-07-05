'use client'

import { useState } from 'react'
import { Truck, Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdminCollection } from '@/lib/use-admin-collection'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/toast'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'

type Carrier = {
  id: number
  name: string
  code: string
  enabled: boolean
  domestic: boolean
  international: boolean
  trackingUrl: string
}

type Method = {
  id: number
  name: string
  days: string
  fee: number
  minOrder: number
  enabled: boolean
}

const INITIAL_CARRIERS: Carrier[] = [
  { id: 1, name: 'أرامكس', code: 'aramex', enabled: true, domestic: true, international: true, trackingUrl: 'https://aramex.com/track' },
  { id: 2, name: 'DHL Express', code: 'dhl', enabled: true, domestic: false, international: true, trackingUrl: 'https://dhl.com/track' },
  { id: 3, name: 'SMSA Express', code: 'smsa', enabled: true, domestic: true, international: false, trackingUrl: 'https://smsa.com/track' },
  { id: 4, name: 'Naqel', code: 'naqel', enabled: false, domestic: true, international: false, trackingUrl: 'https://naqel.com.sa/track' },
]

const INITIAL_METHODS: Method[] = [
  { id: 1, name: 'توصيل سريع', days: '1-2', fee: 45, minOrder: 0, enabled: true },
  { id: 2, name: 'توصيل عادي', days: '3-5', fee: 25, minOrder: 500, enabled: true },
  { id: 3, name: 'توصيل مجاني', days: '5-7', fee: 0, minOrder: 2000, enabled: true },
  { id: 4, name: 'توصيل فائق السرعة', days: 'نفس اليوم', fee: 80, minOrder: 0, enabled: false },
]

export default function ShippingPage() {
  const { t } = useI18n()
  const { success, error: toastError } = useToast()
  const carriers = useAdminCollection<Carrier>('admin-shipping-carriers', INITIAL_CARRIERS)
  const methods = useAdminCollection<Method>('admin-shipping-methods', INITIAL_METHODS)

  const [carrierDialog, setCarrierDialog] = useState(false)
  const [methodDialog, setMethodDialog] = useState(false)
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null)
  const [editingMethod, setEditingMethod] = useState<Method | null>(null)
  const [deleteCarrier, setDeleteCarrier] = useState<number | null>(null)
  const [deleteMethod, setDeleteMethod] = useState<number | null>(null)
  const [carrierForm, setCarrierForm] = useState({ name: '', code: '', trackingUrl: '', domestic: true, international: false, enabled: true })
  const [methodForm, setMethodForm] = useState({ name: '', days: '', fee: '0', minOrder: '0', enabled: true })

  function openCarrierAdd() {
    setEditingCarrier(null)
    setCarrierForm({ name: '', code: '', trackingUrl: '', domestic: true, international: false, enabled: true })
    setCarrierDialog(true)
  }

  function openCarrierEdit(c: Carrier) {
    setEditingCarrier(c)
    setCarrierForm({ name: c.name, code: c.code, trackingUrl: c.trackingUrl, domestic: c.domestic, international: c.international, enabled: c.enabled })
    setCarrierDialog(true)
  }

  async function saveCarrier() {
    if (!carrierForm.name.trim()) return
    try {
      if (editingCarrier) await carriers.update(editingCarrier.id, carrierForm)
      else await carriers.add(carrierForm)
      setCarrierDialog(false)
      success(t('toastProfileSaved'))
    } catch {
      toastError(t('toastSaveFailed'))
    }
  }

  function openMethodAdd() {
    setEditingMethod(null)
    setMethodForm({ name: '', days: '', fee: '0', minOrder: '0', enabled: true })
    setMethodDialog(true)
  }

  function openMethodEdit(m: Method) {
    setEditingMethod(m)
    setMethodForm({ name: m.name, days: m.days, fee: String(m.fee), minOrder: String(m.minOrder), enabled: m.enabled })
    setMethodDialog(true)
  }

  async function saveMethod() {
    if (!methodForm.name.trim()) return
    const payload = { name: methodForm.name, days: methodForm.days, fee: Number(methodForm.fee) || 0, minOrder: Number(methodForm.minOrder) || 0, enabled: methodForm.enabled }
    try {
      if (editingMethod) await methods.update(editingMethod.id, payload)
      else await methods.add(payload)
      setMethodDialog(false)
      success(t('toastProfileSaved'))
    } catch {
      toastError(t('toastSaveFailed'))
    }
  }

  return (
    <div className="space-y-6 route-fade">
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div>
            <h2 className="text-sm font-bold text-foreground">شركات الشحن</h2>
            <p className="text-xs text-muted-foreground mt-0.5">تفعيل أو تعطيل شركات الشحن المتاحة</p>
          </div>
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={openCarrierAdd}>
            <Plus className="size-3.5" /> إضافة شركة
          </Button>
        </div>
        <div className="divide-y divide-border/50">
          {carriers.items.map((c) => (
            <div key={c.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent">
                <Truck className="size-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{c.name}</p>
                <div className="mt-0.5 flex gap-3 text-[11px] text-muted-foreground">
                  {c.domestic && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary font-medium">محلي</span>}
                  {c.international && <span className="rounded-full bg-accent px-2 py-0.5">دولي</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => openCarrierEdit(c)}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteCarrier(c.id)}>
                  <Trash2 className="size-3.5" />
                </Button>
                <button
                  onClick={() => void carriers.update(c.id, { enabled: !c.enabled })}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    c.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {c.enabled
                    ? <><ToggleRight className="size-4" /> مفعّل</>
                    : <><ToggleLeft className="size-4" /> معطّل</>
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div>
            <h2 className="text-sm font-bold text-foreground">طرق التوصيل</h2>
            <p className="text-xs text-muted-foreground mt-0.5">تحكم في طرق التوصيل المعروضة للمشترين</p>
          </div>
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={openMethodAdd}>
            <Plus className="size-3.5" /> إضافة طريقة
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-5 py-3 text-start font-medium">الاسم</th>
                <th className="px-5 py-3 text-start font-medium">مدة التوصيل</th>
                <th className="px-5 py-3 text-start font-medium">الرسوم (ريال)</th>
                <th className="px-5 py-3 text-start font-medium">الحد الأدنى للطلب</th>
                <th className="px-5 py-3 text-start font-medium">الحالة</th>
                <th className="px-5 py-3 text-start font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {methods.items.map((m) => (
                <tr key={m.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-foreground">{m.name}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{m.days} أيام</td>
                  <td className="px-5 py-3 text-xs font-semibold text-foreground">
                    {m.fee === 0 ? <span className="text-primary">مجاني</span> : `${m.fee} ر.س`}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {m.minOrder === 0 ? 'بلا حد أدنى' : `${m.minOrder.toLocaleString('ar-SA')} ر.س`}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => void methods.update(m.id, { enabled: !m.enabled })}
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        m.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {m.enabled ? 'مفعّل' : 'معطّل'}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => openMethodEdit(m)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive/60 hover:text-destructive" onClick={() => setDeleteMethod(m.id)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={carrierDialog} onOpenChange={setCarrierDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingCarrier ? 'تعديل شركة شحن' : 'إضافة شركة شحن'}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Input placeholder="الاسم" value={carrierForm.name} onChange={(e) => setCarrierForm((f) => ({ ...f, name: e.target.value }))} />
            <Input placeholder="الرمز" value={carrierForm.code} onChange={(e) => setCarrierForm((f) => ({ ...f, code: e.target.value }))} dir="ltr" />
            <Input placeholder="رابط التتبع" value={carrierForm.trackingUrl} onChange={(e) => setCarrierForm((f) => ({ ...f, trackingUrl: e.target.value }))} dir="ltr" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCarrierDialog(false)}>{t('cancel')}</Button>
            <Button onClick={saveCarrier}>{t('saveChanges')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={methodDialog} onOpenChange={setMethodDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingMethod ? 'تعديل طريقة توصيل' : 'إضافة طريقة توصيل'}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Input placeholder="الاسم" value={methodForm.name} onChange={(e) => setMethodForm((f) => ({ ...f, name: e.target.value }))} />
            <Input placeholder="مدة التوصيل" value={methodForm.days} onChange={(e) => setMethodForm((f) => ({ ...f, days: e.target.value }))} />
            <Input type="number" placeholder="الرسوم" value={methodForm.fee} onChange={(e) => setMethodForm((f) => ({ ...f, fee: e.target.value }))} dir="ltr" />
            <Input type="number" placeholder="الحد الأدنى للطلب" value={methodForm.minOrder} onChange={(e) => setMethodForm((f) => ({ ...f, minOrder: e.target.value }))} dir="ltr" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMethodDialog(false)}>{t('cancel')}</Button>
            <Button onClick={saveMethod}>{t('saveChanges')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteCarrier !== null} onOpenChange={(o) => !o && setDeleteCarrier(null)} title="حذف الشركة؟" description="سيتم حذف شركة الشحن." confirmLabel={t('deleteAddress')} cancelLabel={t('cancel')} onConfirm={async () => { if (deleteCarrier) { try { await carriers.remove(deleteCarrier); setDeleteCarrier(null); success(t('toastProfileSaved')) } catch { toastError(t('toastSaveFailed')) } } }} />
      <ConfirmDialog open={deleteMethod !== null} onOpenChange={(o) => !o && setDeleteMethod(null)} title="حذف الطريقة؟" description="سيتم حذف طريقة التوصيل." confirmLabel={t('deleteAddress')} cancelLabel={t('cancel')} onConfirm={async () => { if (deleteMethod) { try { await methods.remove(deleteMethod); setDeleteMethod(null); success(t('toastProfileSaved')) } catch { toastError(t('toastSaveFailed')) } } }} />
    </div>
  )
}
