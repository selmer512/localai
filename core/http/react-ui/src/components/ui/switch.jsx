import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '../../lib/utils'

// iOS switch: 51x31 track, mint when on (LocalAI's "live" colour).
export function Switch({ className, ...props }) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'tw:relative tw:inline-flex tw:h-[31px] tw:w-[51px] tw:shrink-0 tw:cursor-pointer tw:items-center tw:rounded-full tw:border-0 tw:p-[2px] tw:transition-colors tw:bg-line tw:data-[state=checked]:bg-live tw:disabled:opacity-40 tw:focus-visible:outline-2 tw:focus-visible:outline-offset-2 tw:focus-visible:outline-action',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="tw:block tw:size-[27px] tw:rounded-full tw:bg-white tw:shadow-[0_3px_8px_rgba(0,0,0,0.25),0_1px_1px_rgba(0,0,0,0.16)] tw:transition-transform tw:data-[state=checked]:translate-x-5" />
    </SwitchPrimitive.Root>
  )
}
