import { Construction } from 'lucide-react'

type Props = { title: string; description?: string }

export function ComingSoon({ title, description }: Props) {
  return (
    <div className="route-fade flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-10 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-full bg-primary/10">
        <Construction className="size-7 text-primary" />
      </div>
      <p className="text-base font-bold text-foreground">{title}</p>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
        {description ?? 'هذه الشاشة مصممة وجاهزة للتطوير في المرحلة القادمة من المشروع.'}
      </p>
      <span className="mt-4 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">قريباً</span>
    </div>
  )
}
