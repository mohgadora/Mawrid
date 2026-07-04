'use client'

import { Dialog } from '@base-ui/react/dialog'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Accessible confirmation dialog for destructive actions (remove from cart,
 * cancel order, delete address). Built on Base UI's Dialog so focus trapping,
 * escape-to-close and scroll locking come for free. Fully RTL-safe.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  destructive = true,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  destructive?: boolean
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[90] bg-foreground/40 backdrop-blur-[1px] data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity" />
        <Dialog.Popup className="fixed inset-x-4 top-1/2 z-[91] mx-auto max-w-sm -translate-y-1/2 rounded-2xl border border-border bg-popover p-5 text-popover-foreground shadow-xl outline-none data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 transition-all sm:inset-x-0">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'grid size-10 shrink-0 place-items-center rounded-full',
                destructive ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary',
              )}
            >
              <AlertTriangle className="size-5" />
            </span>
            <div className="flex-1">
              <Dialog.Title className="text-base font-bold text-foreground">{title}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm leading-relaxed text-muted-foreground text-pretty">
                {description}
              </Dialog.Description>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <Dialog.Close className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {cancelLabel}
            </Dialog.Close>
            <button
              type="button"
              onClick={() => {
                onConfirm()
                onOpenChange(false)
              }}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                destructive ? 'bg-destructive' : 'bg-primary',
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
