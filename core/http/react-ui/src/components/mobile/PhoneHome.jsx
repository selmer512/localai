import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Image, Volume2, Music, Clapperboard } from 'lucide-react'
import { InsetGroup, ListRow, IconTile } from '../ui/list'
import { Button } from '../ui/button'
import { preloadRoute } from '../../router'

// Home on a phone (see the "v2 · iPhone app" design): status under the large
// title, the places you return to as an inset list, creation as tiles, and
// what is running now with Stop on each row. Data and actions come from
// Home.jsx so desktop and phone stay one page with two layouts.

const CREATE = [
  { path: '/app/image', Icon: Image, key: 'image', color: 'tw:bg-tile-purple' },
  { path: '/app/tts', Icon: Volume2, key: 'speech', color: 'tw:bg-tile-soft' },
  { path: '/app/sound', Icon: Music, key: 'sound', color: 'tw:bg-tile-orange' },
  { path: '/app/video', Icon: Clapperboard, key: 'video', color: 'tw:bg-tile-teal' },
]

export default function PhoneHome({ title, statusText, live, isAdmin, assistantAvailable, onOpenAssistant, loadedModels, onStop, onStopAll, loading }) {
  const { t } = useTranslation('home')
  const navigate = useNavigate()
  const sorted = [...loadedModels].sort((a, b) => a.id.localeCompare(b.id))

  return (
    <div className="phone-home tw:-mx-4 tw:flex tw:flex-col tw:gap-7">
      <div className="tw:flex tw:flex-col tw:gap-1 tw:px-4">
        <h1 className="tw:m-0">{title}</h1>
        <p className="tw:m-0 tw:flex tw:items-center tw:gap-2 tw:text-[15px] tw:text-muted" data-testid="phone-home-status">
          <span aria-hidden="true" className={`tw:size-2 tw:rounded-full ${live ? 'tw:bg-live' : 'tw:bg-faint'}`} />
          {statusText}
        </p>
      </div>

      <InsetGroup>
        <ListRow to="/app/chat" onTouchStart={() => preloadRoute('/app/chat')} leading={<IconTile icon="fas fa-comment" color="blue" />} title={t('phone.chat')} subtitle={t('phone.chatHint')} />
        <ListRow to="/app/talk" leading={<IconTile icon="fas fa-wave-square" color="mint" />} title={t('phone.talk')} subtitle={t('phone.talkHint')} />
        {isAdmin && assistantAvailable && (
          <ListRow onClick={onOpenAssistant} leading={<IconTile icon="fas fa-user-shield" color="purple" />} title={t('quickLinks.manageByChat')} subtitle={t('assistant.description')} chevron />
        )}
      </InsetGroup>

      <section className="tw:flex tw:flex-col tw:px-4" data-testid="phone-home-create">
        <h2 className="tw:m-0 tw:px-4 tw:pb-[7px] tw:text-[13px] tw:font-medium tw:uppercase tw:tracking-[0.02em] tw:text-faint">{t('jump.create')}</h2>
        <div className="tw:grid tw:grid-cols-2 tw:gap-2.5">
          {CREATE.map(({ path, Icon, key, color }) => (
            <button
              key={key}
              type="button"
              onClick={() => navigate(path)}
              onTouchStart={() => preloadRoute(path)}
              className="tw:flex tw:min-h-[104px] tw:flex-col tw:items-start tw:gap-2.5 tw:rounded-[14px] tw:border-0 tw:bg-cell tw:p-3.5 tw:text-left tw:text-foreground tw:cursor-pointer tw:active:bg-well"
            >
              <span aria-hidden="true" className={`tw:flex tw:size-[34px] tw:items-center tw:justify-center tw:rounded-[9px] tw:text-on-action ${color}`}><Icon className="tw:size-5" strokeWidth={2} /></span>
              <span className="tw:flex tw:flex-col tw:gap-px">
                <span className="tw:text-[17px] tw:font-semibold">{t(`phone.create.${key}`)}</span>
                <span className="tw:text-[13px] tw:text-muted">{t(`phone.create.${key}Hint`)}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <InsetGroup header={t('loadedModels.heading')} footer={!loading && sorted.length === 0 ? t('statusLine.noModelsLoaded') : undefined} data-testid="phone-home-running">
        {sorted.map(m => (
          <ListRow
            key={m.id}
            leading={<IconTile icon="fas fa-microchip" color="blue" />}
            title={m.id}
            subtitle={m.backend || t('loadedModels.serving')}
            trailing={<Button variant="secondary" size="sm" onClick={() => onStop(m.id)} aria-label={`${t('loadedModels.stop')}: ${m.id}`}>{t('phone.stop')}</Button>}
            chevron={false}
          />
        ))}
        {sorted.length > 1 && (
          <ListRow onClick={onStopAll} title={t('loadedModels.stopAll')} titleClassName="tw:text-danger" chevron={false} />
        )}
      </InsetGroup>

      {isAdmin && (
        <InsetGroup header={t('jump.models')}>
          <ListRow to="/app/models" leading={<IconTile icon="fas fa-store" color="blue" />} title={t('quickLinks.browseGallery')} />
          <ListRow to="/app/models?view=installed" leading={<IconTile icon="fas fa-hard-drive" color="teal" />} title={t('quickLinks.installedModels')} />
          <ListRow to="/app/import-model" leading={<IconTile icon="fas fa-upload" color="soft" />} title={t('quickLinks.importModel')} />
        </InsetGroup>
      )}
    </div>
  )
}
