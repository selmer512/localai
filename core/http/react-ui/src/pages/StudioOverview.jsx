import { Link } from 'react-router-dom'
import { useIsPhone } from '../hooks/useIsPhone'
import { InsetGroup, ListRow, IconTile } from '../components/ui/list'
import { Button } from '../components/ui/button'
import { useTranslation } from 'react-i18next'
import PageHeader from '../components/PageHeader'
import { formatBytes } from '../utils/format'
import { staggerStyle } from '../hooks/useStagger'

// What this machine can actually make.
//
// Studio used to open on Images and say nothing about the other five
// modalities, so the only way to learn that video had no model was to pick the
// tab and find an empty select. This page answers that before the click.
//
// Two kinds of unavailable, and they must not read the same:
//   - switched off server-side  -> no tab, no lane, nothing (handled upstream
//     in Studio.jsx, which never puts a gated modality in the list)
//   - available, no model yet   -> a lane with a route to installing one
//
// Lanes, not a SplitView: six modalities each carrying one decision-relevant
// fact are read in sequence, not compared as candidates.

const TILE_COLORS = { images: 'purple', video: 'teal', threed: 'orange', tts: 'soft', sound: 'amber', transform: 'mint' }

// Phones: the iOS layout from the "v2 · iPhone app" design. One inset group
// per modality group, a row per generator with what serves it, and an
// install capsule where nothing does yet.
function PhoneStudioOverview({ modalities, recent, running, onPick, t }) {
  const groups = [...new Set(modalities.map(m => m.group))]
  return (
    <div data-testid="studio-overview" className="tw:flex tw:flex-col tw:gap-7 tw:pt-1">
      <div className="tw:flex tw:flex-col tw:gap-1 tw:px-4">
        <h1 className="page-title tw:m-0">{t('studio.overview.title')}</h1>
        <p className="tw:m-0 tw:text-[15px] tw:text-muted">{t('studio.overview.subtitle')}</p>
      </div>
      {groups.map(g => (
        <InsetGroup key={g} header={t(`studio.groups.${g}`)}>
          {modalities.filter(m => m.group === g).map(m => {
            const hasModel = m.installed.length > 0
            const served = hasModel ? m.installed[0] + (m.installed.length > 1 ? ` +${m.installed.length - 1}` : '') : null
            return (
              <ListRow
                key={m.key}
                data-testid="studio-modality"
                data-modality={m.key}
                onClick={hasModel ? () => onPick(m.key) : undefined}
                chevron={hasModel}
                leading={<IconTile icon={m.icon} color={TILE_COLORS[m.key]} />}
                title={t(`studio.tabs.${m.key}`)}
                subtitle={hasModel ? [served, m.typical].filter(Boolean).join(' · ') : t(`studio.overview.describe.${m.key}`)}
                trailing={!hasModel ? (
                  <Button asChild variant="secondary" size="sm">
                    <Link to={`/app/models?capability=${m.key}`} aria-label={`${t('studio.overview.install')}: ${t(`studio.tabs.${m.key}`)}`}>{t('studio.overview.get')}</Link>
                  </Button>
                ) : undefined}
              />
            )
          })}
        </InsetGroup>
      ))}
      {running.length > 0 && (
        <InsetGroup header={t('studio.overview.running')} data-testid="studio-running">
          {running.map(op => (
            <ListRow key={op.id || op.name} title={op.name || op.id} chevron={false}
              trailing={typeof op.progress === 'number' ? <span className="tw:text-[15px] tw:text-faint">{Math.round(op.progress)}%</span> : undefined} />
          ))}
        </InsetGroup>
      )}
      {recent.length > 0 && (
        <InsetGroup header={t('studio.overview.recent')} data-testid="studio-recent">
          {recent.map(entry => (
            <ListRow key={entry.id} onClick={() => onPick(entry.modality)}
              leading={<IconTile icon={(modalities.find(m => m.key === entry.modality) || {}).icon || 'fas fa-clock'} color="gray" />}
              title={entry.model || entry.modality} subtitle={describeEntry(entry, t)} />
          ))}
        </InsetGroup>
      )}
    </div>
  )
}

export default function StudioOverview({ modalities, recent, running, onPick }) {
  const { t } = useTranslation('media')
  const isPhone = useIsPhone()

  const ready = modalities.filter(m => m.installed.length > 0).length

  if (isPhone) return <PhoneStudioOverview modalities={modalities} recent={recent} running={running} onPick={onPick} t={t} />

  return (
    <div data-testid="studio-overview" className="page-pad">
      {/* The shared header, not a bespoke one: every other page in the app
          announces itself with .page-title, and the render-smoke gate looks
          for exactly that. */}
      <PageHeader
        title={t('studio.overview.title')}
        supporting={t('studio.overview.subtitle')}
      />

      <div className="lane-head">
        <h2>{t('studio.overview.canMake')}</h2>
        <span className="lane-head__meta">
          {t('studio.overview.eyebrow', { ready, total: modalities.length })}
        </span>
      </div>
      <ul className="lanes lanes--modality reveal-stagger">
        {modalities.map((m, i) => (
          <li key={m.key} data-testid="studio-modality" data-modality={m.key} style={staggerStyle(i)}>
            <ModalityLane modality={m} onPick={onPick} t={t} />
          </li>
        ))}
      </ul>

      {running.length > 0 && (
        <>
          <div className="lane-head"><h2>{t('studio.overview.running')}</h2></div>
          <ul className="lanes lanes--takes" data-testid="studio-running">
            {running.map(op => (
              <li key={op.id || op.name} className="lane">
                <span className="lane__name">{op.name || op.id}</span>
                {typeof op.progress === 'number' && (
                  <span className="studio-running__meter">
                    <i style={{ width: `${Math.max(0, Math.min(100, op.progress))}%` }} />
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Absent rather than empty. A shelf with nothing on it is furniture. */}
      {recent.length > 0 && (
        <>
          <div className="lane-head"><h2>{t('studio.overview.recent')}</h2></div>
          <ul className="lanes lanes--takes reveal-stagger" data-testid="studio-recent">
            {recent.map((entry, i) => (
              <li key={entry.id} style={staggerStyle(i)}>
                <button type="button" className="lane" onClick={() => onPick(entry.modality)}>
                  <span className="lane__name">{entry.model || entry.modality}</span>
                  <span className="lane__num">{describeEntry(entry, t)}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function ModalityLane({ modality, onPick, t }) {
  const { key, installed, typical } = modality
  const hasModel = installed.length > 0

  const body = (
    <>
      <span className="lane__tag">{t(`studio.groups.${modality.group}`)}</span>
      <span className="lane__main">
        <b className="lane__name">{t(`studio.tabs.${key}`)}</b>
        <span className="lane__desc">{t(`studio.overview.describe.${key}`)}</span>
      </span>
      <span className="lane__num">
        {hasModel
          ? installed[0] + (installed.length > 1 ? ` +${installed.length - 1}` : '')
          : t('studio.overview.noModel')}
      </span>
      {/* Dash, not a guess. Cost is measured from this machine's own history. */}
      <span className="lane__num">{typical || '—'}</span>
    </>
  )

  if (!hasModel) {
    return (
      <span className="lane studio-modality--empty">
        {body}
        <Link className="studio-modality__install" to={`/app/models?capability=${key}`}>
          {t('studio.overview.install')}
        </Link>
      </span>
    )
  }

  return (
    <button type="button" className="lane" onClick={() => onPick(key)}>
      {body}
      <span className="studio-modality__state">{t('studio.overview.ready')}</span>
    </button>
  )
}

function describeEntry(entry, t) {
  const bits = []
  if (entry.size) bits.push(entry.size)
  if (entry.bytes) bits.push(formatBytes(entry.bytes))
  if (entry.elapsedMs) bits.push(t('studio.overview.seconds', { seconds: (entry.elapsedMs / 1000).toFixed(1) }))
  return bits.join(' · ')
}
