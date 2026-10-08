import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronsUpDown, ChevronRight } from 'lucide-react'
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

// Which section was open, so Back from a page lands on the same list. Per
// tab and best effort: storage can be missing or throw in private browsing.
const OPEN_SECTION_KEY = 'localai_more_open_section'
function readOpenSection() {
  try { return sessionStorage.getItem(OPEN_SECTION_KEY) } catch { return null }
}
function writeOpenSection(value) {
  try {
    if (value) sessionStorage.setItem(OPEN_SECTION_KEY, value)
    else sessionStorage.removeItem(OPEN_SECTION_KEY)
  } catch { /* ignore */ }
}

const GROUP_COLORS = ['blue', 'purple', 'teal', 'mint', 'soft', 'amber', 'orange']

export default function More() {
  const { t, i18n } = useTranslation('nav')
  const { isAdmin, authEnabled, user, logout, hasFeature } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const branding = useBranding()
  const { operations } = useOperations()
  const [features, setFeatures] = useState({})
  const [version, setVersion] = useState('')
  const [query, setQuery] = useState('')
  const [openSection, setOpenSection] = useState(readOpenSection)
  // The details share a name, so opening one closes the other and both fire
  // toggle in either order; a close only clears the section it names.
  const sectionProps = key => ({
    open: openSection === key,
    onToggle: event => {
      const isOpen = event.currentTarget.open
      setOpenSection(previous => {
        const next = isOpen ? key : (previous === key ? null : previous)
        writeOpenSection(next)
        return next
      })
    },
  })

  useEffect(() => {
    fetch(apiUrl('/api/features')).then(r => r.json()).then(setFeatures).catch(() => {})
    systemApi.version().then(d => setVersion(typeof d === 'string' ? d : (d?.version || ''))).catch(() => {})
  }, [])

  const auth = { isAdmin, authEnabled, hasFeature, features }
  const needle = query.trim().toLocaleLowerCase(i18n.resolvedLanguage)
  const matches = label => !needle || (label || '').toLocaleLowerCase(i18n.resolvedLanguage).includes(needle)
  // Search covers every row on the screen, settings included. Typing a
  // section's name ("Operate", "About") keeps that whole section.
  const inSection = (headers, ...labels) => headers.some(matches) || labels.some(matches)
  const groups = consoles.flatMap(config => config.groups.map(group => {
    const headers = [t(config.titleKey), t(group.titleKey)]
    return {
      config,
      group,
      items: group.items.filter(item => isConsoleItemVisible(item, auth) && inSection(headers, t(item.labelKey))),
    }
  })).filter(({ items }) => items.length > 0)
  const showInstance = matches(branding.instanceName) || matches(window.location.host)
  const showUser = authEnabled && user && inSection([t('account')], user.name, user.email)
  const showLogout = authEnabled && user && inSection([t('account')], t('logout'))
  const showDark = inSection([t('more_page.preferences')], t('more_page.darkMode'))
  const showLanguage = inSection([t('more_page.preferences')], t('changeLanguage'), ...SUPPORTED_LANGUAGES.map(l => l.name))
  const showTalk = inSection([t('sections.create')], t('items.talk'))
  const showDocs = inSection([t('more_page.about')], t('footer.documentation'))
  const showGithub = inSection([t('more_page.about')], t('footer.github'))
  const showVersion = /\d/.test(version) && inSection([t('more_page.about')], t('more_page.version'), version)
  const anyResult = showInstance || showUser || showLogout || showDark || showLanguage || showTalk || showDocs || showGithub || showVersion || groups.length > 0
  const failedOps = operations.filter(op => op.error).length
  const language = SUPPORTED_LANGUAGES.find(l => l.code === i18n.resolvedLanguage) || SUPPORTED_LANGUAGES[0]
  const menu = consoles.map(config => ({
    config,
    groups: groups.filter(entry => entry.config.id === config.id),
  })).filter(entry => entry.groups.length > 0)

  const destination = (item, color) => (
    <ListRow
      key={item.path || item.href}
      to={item.path}
      href={item.href ? apiUrl(item.href) : undefined}
      external={item.external}
      leading={<IconTile icon={item.icon} color={color} />}
      title={t(item.labelKey)}
      trailing={item.badge === 'operations' && operations.length > 0 ? (
        <span className={`more-page__badge ${failedOps > 0 ? 'tw:bg-danger' : 'tw:bg-action'}`}>
          {failedOps > 0 ? failedOps : operations.length}
        </span>
      ) : undefined}
    />
  )

  const aboutRows = <>
    {showInstance && <ListRow leading={<IconTile icon="fas fa-server" color="gray" />} title={branding.instanceName} subtitle={window.location.host} chevron={false} />}
    {showDocs && <ListRow href="https://localai.io" external leading={<IconTile icon="fas fa-book" color="gray" />} title={t('footer.documentation')} />}
    {showGithub && <ListRow href="https://github.com/mudler/LocalAI" external leading={<IconTile icon="fab fa-github" color="gray" />} title={t('footer.github')} />}
    {showVersion && <ListRow leading={<IconTile icon="fas fa-circle-info" color="gray" />} title={t('more_page.version')} trailing={<RowValue>{version}</RowValue>} chevron={false} />}
  </>

  return (
    <div className="page more-page tw:flex tw:flex-col tw:gap-5 tw:pb-4">
      <h1 className="page-title tw:m-0 tw:px-4">{t('more')}</h1>

      <div className="more-page__search">
        <input
          type="search"
          className="input"
          aria-label={t('more_page.searchPages')}
          placeholder={t('more_page.searchPages')}
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
      </div>

      {(showUser || showLogout) && (
        <InsetGroup header={t('account')}>
          {showUser && <ListRow
            to="/app/account"
            leading={user.avatarUrl
              ? <img src={user.avatarUrl} alt="" className="tw:size-[30px] tw:shrink-0 tw:rounded-full" />
              : <IconTile icon="fas fa-user" color="gray" />}
            title={user.name || user.email}
            subtitle={user.name && user.email ? user.email : undefined}
          />}
          {showLogout && <ListRow onClick={logout} title={t('logout')} titleClassName="tw:text-danger" chevron={false}
            leading={<IconTile icon="fas fa-arrow-right-from-bracket" color="red" />} />}
        </InsetGroup>
      )}

      {(showDark || showLanguage) && <InsetGroup header={t('more_page.preferences')} className="more-page__preferences">
        {showDark && <ListRow
          leading={<IconTile icon="fas fa-moon" color="blue" />}
          title={t('more_page.darkMode')}
          titleClassName="more-page__preference-label"
          trailing={<Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} aria-label={t('more_page.darkMode')} />}
          chevron={false}
        />}
        {showLanguage && <label className="tw:block">
          <ListRow
            leading={<IconTile icon="fas fa-globe" color="soft" />}
            title={t('changeLanguage')}
            titleClassName="more-page__preference-label"
            chevron={false}
            trailing={(
              <span className="tw:relative tw:flex tw:min-h-11 tw:items-center tw:gap-1 tw:text-faint">
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
        </label>}
      </InsetGroup>}

      {needle && showTalk && <InsetGroup header={t('sections.create')}>
        <ListRow to="/app/talk" leading={<IconTile icon="fas fa-wave-square" color="mint" />} title={t('items.talk')} />
      </InsetGroup>}

      {needle ? groups.map(({ config, group, items }, index) => (
        <InsetGroup key={`${config.id}-${group.titleKey}`} header={`${t(config.titleKey)} · ${t(group.titleKey)}`}>
          {items.map(item => destination(item, GROUP_COLORS[index % GROUP_COLORS.length]))}
        </InsetGroup>
      )) : menu.length > 0 && (
        <InsetGroup header={t('more_page.tools')} data-testid="more-tools">
          {menu.map(({ config, groups: visibleGroups }) => (
            <details key={config.id} name="more-sections" className="more-page__section" data-console={config.id} {...sectionProps(config.id)}>
              <summary className="more-page__summary">
                <IconTile icon={config.icon} color={config.id === 'build' ? 'purple' : 'teal'} />
                <span className="more-page__summary-copy">
                  <span>{t(config.titleKey)}</span>
                  <span className="more-page__summary-hint">{visibleGroups.map(({ group }) => t(group.titleKey)).join(' · ')}</span>
                </span>
                {config.id === 'operate' && operations.length > 0 && (
                  <span className={`more-page__badge ${failedOps > 0 ? 'tw:bg-danger' : 'tw:bg-action'}`}>
                    {failedOps > 0 ? failedOps : operations.length}
                  </span>
                )}
                <ChevronRight aria-hidden="true" className="more-page__chevron" size={18} />
              </summary>
              <div className="more-page__destinations">
                {visibleGroups.map(({ group, items }, index) => (
                  <div key={group.titleKey}>
                    <h3 className="more-page__group-title">{t(group.titleKey)}</h3>
                    {items.map(item => destination(item, GROUP_COLORS[index % GROUP_COLORS.length]))}
                  </div>
                ))}
              </div>
            </details>
          ))}
        </InsetGroup>
      )}

      {!anyResult && (
        <p className="more-page__no-results" role="status">{t('more_page.noPages')}</p>
      )}

      {(showInstance || showDocs || showGithub || showVersion) && (
        <InsetGroup header={needle ? t('more_page.about') : undefined}>
          {needle ? aboutRows : (
            <details name="more-sections" className="more-page__section" data-section="about" {...sectionProps('about')}>
              <summary className="more-page__summary">
                <IconTile icon="fas fa-circle-info" color="gray" />
                <span className="more-page__summary-copy">{t('more_page.about')}</span>
                <ChevronRight aria-hidden="true" className="more-page__chevron" size={18} />
              </summary>
              <div className="more-page__destinations">{aboutRows}</div>
            </details>
          )}
        </InsetGroup>
      )}

      {!needle && <p className="tw:m-0 tw:px-8 tw:text-center tw:text-[13px] tw:text-faint">
        &copy; 2023-2026 <a href="https://mudler.pm" target="_blank" rel="noopener noreferrer" className="tw:text-faint">Ettore Di Giacinto</a>
      </p>}
    </div>
  )
}
