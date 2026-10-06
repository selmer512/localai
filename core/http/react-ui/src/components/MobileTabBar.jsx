import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { House, MessageCircle, Sparkles, Layers, Ellipsis } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { preloadRoute } from '../router'
import { cn } from '../lib/utils'

// Phone tab bar, iOS style: five tabs, labels under icons, translucent bar
// over the content. More is a page listing every other destination, and it
// stays the selected tab while you are anywhere it leads to, the way an iOS
// tab keeps ownership of the screens pushed from it.
const tabs = [
  { path: '/app', Icon: House, labelKey: 'items.home' },
  { path: '/app/chat', Icon: MessageCircle, labelKey: 'items.chat' },
  { path: '/app/studio', Icon: Sparkles, labelKey: 'items.studio' },
  { path: '/app/models', Icon: Layers, labelKey: 'items.models', adminOnly: true },
]

const STUDIO_PATHS = ['/app/studio', '/app/image', '/app/video', '/app/tts', '/app/sound', '/app/3d', '/app/transform']

export function tabForPath(pathname) {
  if (pathname === '/app' || pathname === '/app/') return '/app'
  if (pathname.startsWith('/app/chat')) return '/app/chat'
  if (STUDIO_PATHS.some(p => pathname.startsWith(p))) return '/app/studio'
  if (pathname.startsWith('/app/models') || pathname.startsWith('/app/import-model') || pathname.startsWith('/app/model-editor')) return '/app/models'
  return '/app/more'
}

export default function MobileTabBar() {
  const { t } = useTranslation('nav')
  const { isAdmin } = useAuth()
  const { pathname } = useLocation()
  const current = tabForPath(pathname)
  const items = [...tabs.filter(tab => !tab.adminOnly || isAdmin), { path: '/app/more', Icon: Ellipsis, label: t('more') }]

  return (
    <nav
      className="mobile-tabbar tw:fixed tw:inset-x-0 tw:bottom-0 tw:z-30 tw:flex tw:items-start tw:border-0 tw:border-t-[0.5px] tw:border-solid tw:border-line tw:bg-[color-mix(in_srgb,var(--color-bg-secondary)_88%,transparent)] tw:pb-[env(safe-area-inset-bottom)] tw:backdrop-blur-xl tw:backdrop-saturate-150"
      aria-label={t('mobileNavigation')}
    >
      {items.map(({ path, Icon, labelKey, label }) => {
        const active = current === path
        return (
          // Link, not NavLink: the active tab is decided by tabForPath (More
          // owns every screen pushed from it), not by URL matching.
          <Link
            key={path}
            to={path}
            aria-current={active ? 'page' : undefined}
            className={cn('mobile-tabbar__item tw:flex tw:min-h-[49px] tw:flex-1 tw:flex-col tw:items-center tw:gap-[3px] tw:pt-[7px] tw:text-[10px] tw:font-medium tw:tracking-[0.01em] tw:no-underline',
              active ? 'active tw:text-action' : 'tw:text-faint')}
            onTouchStart={() => preloadRoute(path)}
          >
            <Icon aria-hidden="true" className="tw:size-[26px]" strokeWidth={active ? 2.2 : 1.9} />
            <span className="mobile-tabbar__label">{label || t(labelKey)}</span>
          </Link>
        )
      })}
    </nav>
  )
}
