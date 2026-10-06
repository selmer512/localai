import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '../../lib/utils'

// iOS bottom sheet on Radix Dialog: focus trap, Escape, scroll lock and
// aria wiring come from Radix; the look is the iOS page sheet (grabber,
// Cancel / title / Done bar, rounded top, content scrolls inside).
export function Sheet({ open, onOpenChange, title, cancelLabel, onCancel, doneLabel, onDone, children, className, description }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="ios-sheet-overlay tw:fixed tw:inset-0 tw:z-[1000] tw:bg-black/55" />
        <Dialog.Content
          className={cn('ios-sheet tw:fixed tw:inset-x-0 tw:bottom-0 tw:z-[1001] tw:flex tw:max-h-[calc(100dvh-env(safe-area-inset-top,0px)-10px)] tw:flex-col tw:rounded-t-[12px] tw:bg-background tw:text-foreground tw:shadow-[0_-1px_0_var(--color-border-default)] tw:outline-none', className)}
        >
          <span aria-hidden="true" className="tw:mx-auto tw:mt-1.5 tw:h-[5px] tw:w-9 tw:shrink-0 tw:rounded-full tw:bg-line-strong" />
          <div className="tw:grid tw:grid-cols-[1fr_auto_1fr] tw:items-center tw:px-4">
            <span className="tw:justify-self-start">
              {cancelLabel && (
                <Dialog.Close asChild>
                  <button type="button" onClick={onCancel} className="tw:min-h-11 tw:border-0 tw:bg-transparent tw:p-0 tw:text-[17px] tw:text-action tw:cursor-pointer">{cancelLabel}</button>
                </Dialog.Close>
              )}
            </span>
            <Dialog.Title className="tw:m-0 tw:text-[17px] tw:font-semibold">{title}</Dialog.Title>
            <span className="tw:justify-self-end">
              {doneLabel && (
                <button type="button" onClick={onDone || (() => onOpenChange?.(false))} className="tw:min-h-11 tw:border-0 tw:bg-transparent tw:p-0 tw:text-[17px] tw:font-semibold tw:text-action tw:cursor-pointer">{doneLabel}</button>
              )}
            </span>
          </div>
          {description ? <Dialog.Description className="tw:sr-only">{description}</Dialog.Description> : <Dialog.Description className="tw:sr-only">{title}</Dialog.Description>}
          <div className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col tw:gap-5 tw:overflow-y-auto tw:overscroll-contain tw:pb-[max(16px,env(safe-area-inset-bottom))] tw:pt-1">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
