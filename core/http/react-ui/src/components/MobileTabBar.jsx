import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { preloadRoute } from '../router'

// Phone-only primary navigation, kept within thumb reach. It mirrors the
// sidebar's most-used destinations rather than replacing them: "More" opens
// the existing drawer, which still holds every other page.
const tabs = [
  { path: '/app', icon: 'fas fa-home', labelKey: 'items.home', end: true },
  { path: '/app/chat', icon: 'fas fa-comments', labelKey: 'items.chat' },
  { path: '/app/studio', icon: 'fas fa-palette', labelKey: 'items.studio' },
  { path: '/app/models', icon: 'fas fa-cubes', labelKey: 'items.models', adminOnly: true },
]

export default function MobileTabBar({ drawerOpen, onOpenMore }) {
  const { t } = useTranslation('nav')
  const { isAdmin } = useAuth()

  return (
    <nav className="mobile-tabbar" aria-label={t('mobileNavigation')}>
      {tabs.filter(tab => !tab.adminOnly || isAdmin).map(tab => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end={tab.end}
          className={({ isActive }) => `mobile-tabbar__item${isActive ? ' active' : ''}`}
          onTouchStart={() => preloadRoute(tab.path)}
        >
          <span className="mobile-tabbar__icon"><i className={tab.icon} aria-hidden="true" /></span>
          <span className="mobile-tabbar__label">{t(tab.labelKey)}</span>
        </NavLink>
      ))}
      <button
        type="button"
        className={`mobile-tabbar__item${drawerOpen ? ' active' : ''}`}
        onClick={onOpenMore}
        aria-expanded={drawerOpen}
        aria-controls="app-sidebar"
      >
        <span className="mobile-tabbar__icon"><i className="fas fa-ellipsis-h" aria-hidden="true" /></span>
        <span className="mobile-tabbar__label">{t('more')}</span>
      </button>
    </nav>
  )
}
