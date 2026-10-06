import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'
import { tabForPath } from '../MobileTabBar'
import { cn } from '../../lib/utils'

// iOS navigation bar for phones. Every page already renders its own <h1>;
// the bar marks it as the large title (styled in App.css under
// [data-ios-large-title]) and shows the same words small and centred once it
// scrolls under the bar, so all 50-odd pages get the iOS header without a
// per-page title table. Screens below a tab get a back button labelled with
// the screen you came from.

const TAB_ROOTS = ['/app', '/app/chat', '/app/studio', '/app/models', '/app/more']
const TAB_LABEL_KEYS = { '/app': 'items.home', '/app/chat': 'items.chat', '/app/studio': 'items.studio', '/app/models': 'items.models', '/app/more': 'more' }

// Title of each history entry, by react-router's history index, so the back
// button can name the screen it returns to.
const titlesByIndex = new Map()
const historyIndex = () => (typeof window !== 'undefined' && window.history.state && typeof window.history.state.idx === 'number') ? window.history.state.idx : 0

export default function NavBar() {
  const { t } = useTranslation('nav')
  const location = useLocation()
  const navigate = useNavigate()
  const barRef = useRef(null)
  const [title, setTitle] = useState('')
  const [compact, setCompact] = useState(false)
  const path = location.pathname.replace(/\/$/, '') || '/app'
  const isRoot = TAB_ROOTS.includes(path)
  const parent = tabForPath(path)

  useEffect(() => {
    const main = document.querySelector('.main-content-inner')
    if (!main) return
    let h1 = null
    let frame = 0
    const measure = () => {
      const bar = barRef.current
      if (!bar) return
      setCompact(h1 ? h1.getBoundingClientRect().bottom <= bar.getBoundingClientRect().bottom + 1 : window.scrollY > 4)
    }
    const sync = () => {
      frame = 0
      const el = main.querySelector('h1')
      if (el !== h1) {
        h1?.removeAttribute('data-ios-large-title')
        h1 = el
        h1?.setAttribute('data-ios-large-title', '')
      }
      const text = h1?.textContent?.trim() || ''
      setTitle(text)
      titlesByIndex.set(historyIndex(), text)
      measure()
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(sync) }
    sync()
    // Pages load lazily and fetch their data, so the heading can appear (or
    // change) after the route does.
    const observer = new MutationObserver(schedule)
    observer.observe(main, { childList: true, subtree: true, characterData: true })
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
      h1?.removeAttribute('data-ios-large-title')
    }
  }, [location.key])

  const idx = historyIndex()
  const canGoBack = idx > 0
  const backLabel = (canGoBack && titlesByIndex.get(idx - 1)) || t(TAB_LABEL_KEYS[parent])
  const goBack = () => (canGoBack ? navigate(-1) : navigate(parent))

  return (
    <header
      ref={barRef}
      className={cn('ios-navbar tw:sticky tw:top-0 tw:z-40 tw:grid tw:grid-cols-[1fr_minmax(0,auto)_1fr] tw:items-center tw:px-2 tw:pt-[env(safe-area-inset-top)] tw:min-h-[calc(44px+env(safe-area-inset-top))] tw:border-0 tw:border-b-[0.5px] tw:border-solid tw:transition-[border-color,background-color] tw:duration-200',
        compact ? 'tw:border-separator tw:bg-[color-mix(in_srgb,var(--color-bg-primary)_86%,transparent)] tw:backdrop-blur-xl tw:backdrop-saturate-150' : 'tw:border-transparent tw:bg-background')}
    >
      <div className="tw:justify-self-start tw:min-w-0">
        {!isRoot && (
          <button
            type="button"
            onClick={goBack}
            className="ios-navbar__back tw:flex tw:min-h-11 tw:max-w-[40vw] tw:items-center tw:gap-0.5 tw:border-0 tw:bg-transparent tw:p-0 tw:pr-2 tw:text-[17px] tw:text-action tw:cursor-pointer tw:active:opacity-50"
          >
            <ChevronLeft aria-hidden="true" className="tw:size-7 tw:shrink-0 tw:-ml-1" strokeWidth={2.4} />
            <span className="tw:truncate">{backLabel}</span>
          </button>
        )}
      </div>
      <span
        aria-hidden={!compact}
        className={cn('ios-navbar__title tw:truncate tw:text-[17px] tw:font-semibold tw:text-foreground tw:transition-opacity tw:duration-200', compact ? 'tw:opacity-100' : 'tw:opacity-0')}
      >
        {title}
      </span>
      <div className="tw:justify-self-end" />
    </header>
  )
}
