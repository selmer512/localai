import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Server, ChevronsUpDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useBranding } from '../contexts/BrandingContext'
import { useOperations } from '../hooks/useOperations'
import { systemApi } from '../utils/api'
import { apiUrl } from '../utils/basePath'
import { SUPPORTED_LANGUAGES } from '../i18n'
import { consoles, isConsoleItemVisible } from '../components/console/consoleConfig'
import { InsetGroup, ListRow, IconTile, RowValue } from '../components/ui/list'
import { Switch } from '../components/ui/switch'

// The phone's More tab, laid out like the iOS Settings app. It is built from
// the same console config the sidebar renders, with the same gates, so every
// destination the desktop sidebar offers is here too and the two cannot drift.

const GROUP_COLORS = ['blue', 'purple', 'teal', 'mint', 'soft', 'amber', 'orange']

export default function More() {
  const { t, i18n } = useTranslation('nav')
  const { isAdmin, authEnabled, user, logout, hasFeature } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const branding = useBranding()
  const { operations } = useOperations()
  const [features, setFeatures] = useState({})
  const [version, setVersion] = useState('')

  useEffect(() => {
    fetch(apiUrl('/api/features')).then(r => r.json()).then(setFeatures).catch(() => {})
    systemApi.version().then(d => setVersion(typeof d === 'string' ? d : (d?.version || ''))).catch(() => {})
  }, [])

  const auth = { isAdmin, authEnabled, hasFeature, features }
  const failedOps = operations.filter(op => op.error).length
  const language = SUPPORTED_LANGUAGES.find(l => l.code === i18n.resolvedLanguage) || SUPPORTED_LANGUAGES[0]
  let colorIndex = 0

  return (
    <div className="page more-page tw:flex tw:flex-col tw:gap-7 tw:pb-4">
      <h1 className="page-title tw:m-0 tw:px-4">{t('more')}</h1>

      <InsetGroup>
        <ListRow
          to={isAdmin ? '/app/operate' : undefined}
          leading={<span className="tw:flex tw:size-[52px] tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-elevated tw:text-live"><Server aria-hidden="true" className="tw:size-[26px]" strokeWidth={1.9} /></span>}
          title={branding.instanceName}
          subtitle={[window.location.host, /\d/.test(version) ? version : ''].filter(Boolean).join(' · ')}
          titleClassName="tw:font-semibold"
          className="tw:py-1.5"
        />
      </InsetGroup>

      {authEnabled && user && (
        <InsetGroup header={t('account')}>
          <ListRow
            to="/app/account"
            leading={user.avatarUrl
              ? <img src={user.avatarUrl} alt="" className="tw:size-[30px] tw:shrink-0 tw:rounded-full" />
              : <IconTile icon="fas fa-user" color="gray" />}
            title={user.name || user.email}
            subtitle={user.name && user.email ? user.email : undefined}
          />
          <ListRow onClick={logout} title={t('logout')} titleClassName="tw:text-danger" chevron={false}
            leading={<IconTile icon="fas fa-arrow-right-from-bracket" color="red" />} />
        </InsetGroup>
      )}

      <InsetGroup header={t('sections.create')}>
        <ListRow to="/app/talk" leading={<IconTile icon="fas fa-wave-square" color="mint" />} title={t('items.talk')} />
      </InsetGroup>

      {consoles.flatMap(config => config.groups.map(group => {
        const items = group.items.filter(item => isConsoleItemVisible(item, auth))
        if (items.length === 0) return null
        const color = GROUP_COLORS[colorIndex++ % GROUP_COLORS.length]
        return (
          <InsetGroup key={`${config.id}-${group.titleKey}`} header={`${t(config.titleKey)} · ${t(group.titleKey)}`}>
            {items.map(item => (
              <ListRow
                key={item.path || item.href}
                to={item.path}
                href={item.href ? apiUrl(item.href) : undefined}
                external={item.external}
                leading={<IconTile icon={item.icon} color={color} />}
                title={t(item.labelKey)}
                trailing={item.badge === 'operations' && operations.length > 0 ? (
                  <span className={`tw:min-w-6 tw:rounded-full tw:px-2 tw:py-0.5 tw:text-center tw:text-[13px] tw:font-semibold tw:text-on-action ${failedOps > 0 ? 'tw:bg-danger' : 'tw:bg-action'}`}>
                    {failedOps > 0 ? failedOps : operations.length}
                  </span>
                ) : undefined}
              />
            ))}
          </InsetGroup>
        )
      }))}

      <InsetGroup header={t('more_page.preferences')}>
        <ListRow
          leading={<IconTile icon="fas fa-moon" color="blue" />}
          title={t('more_page.darkMode')}
          trailing={<Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} aria-label={t('more_page.darkMode')} />}
          chevron={false}
        />
        <label className="tw:block">
          <ListRow
            leading={<IconTile icon="fas fa-globe" color="soft" />}
            title={t('changeLanguage')}
            chevron={false}
            trailing={(
              <span className="tw:relative tw:flex tw:items-center tw:gap-1 tw:text-faint">
                <RowValue>{language.name}</RowValue>
                <ChevronsUpDown aria-hidden="true" className="tw:size-4" />
                <select
                  aria-label={t('changeLanguage')}
                  value={language.code}
                  onChange={e => i18n.changeLanguage(e.target.value)}
                  className="tw:absolute tw:inset-0 tw:cursor-pointer tw:opacity-0"
                >
                  {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                </select>
              </span>
            )}
          />
        </label>
      </InsetGroup>

      <InsetGroup header={t('more_page.about')}>
        <ListRow href="https://localai.io" external leading={<IconTile icon="fas fa-book" color="gray" />} title={t('footer.documentation')} />
        <ListRow href="https://github.com/mudler/LocalAI" external leading={<IconTile icon="fab fa-github" color="gray" />} title={t('footer.github')} />
        {/\d/.test(version) && <ListRow leading={<IconTile icon="fas fa-circle-info" color="gray" />} title={t('more_page.version')} trailing={<RowValue>{version}</RowValue>} chevron={false} />}
      </InsetGroup>

      <p className="tw:m-0 tw:px-8 tw:text-center tw:text-[13px] tw:text-faint">
        &copy; 2023-2026 <a href="https://mudler.pm" target="_blank" rel="noopener noreferrer" className="tw:text-faint">Ettore Di Giacinto</a>
      </p>
    </div>
  )
}
