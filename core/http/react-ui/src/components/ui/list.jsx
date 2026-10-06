import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

// iOS inset grouped list: a rounded group of rows on the page ground, with
// an optional uppercase header and a footnote. Rows draw their own hairline
// separator, inset to where the text starts, and none under the last row.

export function InsetGroup({ header, footer, children, className, ...props }) {
  return (
    <section className={cn('tw:flex tw:flex-col tw:px-4', className)} {...props}>
      {header && <h2 className="tw:m-0 tw:px-4 tw:pb-[7px] tw:text-[13px] tw:font-medium tw:uppercase tw:tracking-[0.02em] tw:text-faint">{header}</h2>}
      <div className="tw:overflow-hidden tw:rounded-cell tw:bg-cell tw:[&>*:last-child_.ios-row-sep]:border-b-0">{children}</div>
      {footer && <p className="tw:m-0 tw:mt-[7px] tw:px-4 tw:text-[13px] tw:leading-[18px] tw:text-faint">{footer}</p>}
    </section>
  )
}

const TILE = {
  blue: 'tw:bg-tile-blue', mint: 'tw:bg-tile-mint', purple: 'tw:bg-tile-purple', amber: 'tw:bg-tile-amber',
  orange: 'tw:bg-tile-orange', teal: 'tw:bg-tile-teal', soft: 'tw:bg-tile-soft', red: 'tw:bg-tile-red', gray: 'tw:bg-faint',
}

// Settings-style coloured glyph tile (iOS 29pt icon). Takes a Font Awesome
// class or a node.
export function IconTile({ icon, color = 'blue', className }) {
  return (
    <span
      aria-hidden="true"
      className={cn('tw:flex tw:size-[30px] tw:shrink-0 tw:items-center tw:justify-center tw:rounded-[8px] tw:text-[15px] tw:text-on-action', TILE[color] || TILE.blue, className)}
    >
      {typeof icon === 'string' ? <i className={icon} /> : icon}
    </span>
  )
}

export function ListRow({ to, href, onClick, external, leading, title, subtitle, trailing, chevron, className, titleClassName, ...props }) {
  const interactive = !!(to || href || onClick)
  const showChevron = chevron ?? (!!(to || href) && !external)
  const body = (
    <>
      {leading}
      <span className={cn('ios-row-sep tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:gap-2 tw:self-stretch tw:border-b-[0.5px] tw:border-solid tw:border-0 tw:border-separator tw:pr-4', subtitle ? 'tw:min-h-[60px]' : 'tw:min-h-11')}>
        <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:justify-center tw:py-2">
          <span className={cn('tw:truncate tw:text-[17px] tw:leading-[22px] tw:text-foreground', titleClassName)}>{title}</span>
          {subtitle && <span className="tw:truncate tw:text-[13px] tw:leading-[18px] tw:text-muted">{subtitle}</span>}
        </span>
        {trailing}
        {showChevron && <ChevronRight aria-hidden="true" className="tw:size-[18px] tw:shrink-0 tw:text-line-strong" strokeWidth={2.4} />}
        {external && <i className="fas fa-arrow-up-right-from-square tw:text-[13px] tw:text-faint" aria-hidden="true" />}
      </span>
    </>
  )
  const cls = cn('tw:flex tw:items-center tw:gap-3.5 tw:pl-4 tw:text-foreground tw:no-underline tw:bg-transparent tw:border-0 tw:w-full tw:text-left tw:font-[inherit]',
    interactive && 'tw:cursor-pointer tw:active:bg-well', className)
  if (to) return <Link to={to} onClick={onClick} className={cls} {...props}>{body}</Link>
  if (href) return <a href={href} onClick={onClick} className={cls} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...props}>{body}</a>
  if (onClick) return <button type="button" onClick={onClick} className={cls} {...props}>{body}</button>
  return <div className={cls} {...props}>{body}</div>
}

export function RowValue({ children, className }) {
  return <span className={cn('tw:whitespace-nowrap tw:text-[17px] tw:text-faint', className)}>{children}</span>
}
