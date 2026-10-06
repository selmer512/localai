import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// shadcn's class combiner. tailwind-merge is told about the tw: prefix so it
// knows which conflicting utilities replace each other.
const merge = extendTailwindMerge({ prefix: 'tw' })

export function cn(...inputs) {
  return merge(clsx(inputs))
}
