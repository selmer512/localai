import * as ToggleGroup from '@radix-ui/react-toggle-group'
import { cn } from '../../lib/utils'

// iOS segmented control on Radix ToggleGroup (single choice, arrow-key nav).
export function Segmented({ value, onValueChange, options, label, className }) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(v) => { if (v) onValueChange(v) }}
      aria-label={label}
      className={cn('tw:flex tw:gap-0.5 tw:rounded-[9px] tw:bg-well tw:p-0.5', className)}
    >
      {options.map(o => (
        <ToggleGroup.Item
          key={o.value}
          value={o.value}
          className="tw:flex-1 tw:h-7 tw:rounded-[7px] tw:border-0 tw:bg-transparent tw:text-[13px] tw:font-medium tw:text-foreground-2 tw:cursor-pointer tw:inline-flex tw:items-center tw:justify-center tw:gap-1.5 tw:data-[state=on]:bg-elevated tw:data-[state=on]:text-foreground tw:data-[state=on]:font-semibold tw:data-[state=on]:shadow-[0_1px_3px_rgba(0,0,0,0.3)] tw:focus-visible:outline-2 tw:focus-visible:outline-action"
        >
          {o.icon}{o.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  )
}
