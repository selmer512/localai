import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

// shadcn Button, tuned to iOS: 44px targets, capsule "Get"-style small size,
// a plain text variant for nav-bar actions.
const buttonVariants = cva(
  'tw:inline-flex tw:items-center tw:justify-center tw:gap-1.5 tw:whitespace-nowrap tw:font-semibold tw:transition-[background-color,opacity] tw:select-none tw:cursor-pointer tw:border-0 tw:disabled:opacity-40 tw:disabled:pointer-events-none tw:focus-visible:outline-2 tw:focus-visible:outline-offset-2 tw:focus-visible:outline-action tw:active:opacity-70 tw:[&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'tw:bg-action tw:text-on-action',
        secondary: 'tw:bg-well tw:text-action',
        destructive: 'tw:bg-danger tw:text-on-action',
        ghost: 'tw:bg-transparent tw:text-foreground',
        plain: 'tw:bg-transparent tw:text-action tw:font-normal',
      },
      size: {
        default: 'tw:h-11 tw:px-5 tw:rounded-xl tw:text-[17px]',
        sm: 'tw:h-[30px] tw:min-w-[72px] tw:px-3.5 tw:rounded-full tw:text-[15px] tw:font-bold',
        icon: 'tw:size-11 tw:rounded-full tw:p-0',
        nav: 'tw:min-h-11 tw:px-2 tw:text-[17px]',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export function Button({ className, variant, size, asChild = false, type, ...props }) {
  const Comp = asChild ? Slot : 'button'
  return <Comp type={asChild ? undefined : (type || 'button')} className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

export { buttonVariants }
