import { useTranslation } from 'react-i18next'
import { InsetGroup, ListRow, IconTile } from '../ui/list'
import { Button } from '../ui/button'
import { preloadRoute } from '../../router'

// Studio and Models own their tool and lifecycle menus. Home keeps the
// conversation entry points and live model controls without repeating them.

export default function PhoneHome({ title, statusText, live, isAdmin, assistantAvailable, onOpenAssistant, loadedModels, onStop, onStopAll, loading }) {
  const { t } = useTranslation('home')
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
    </div>
  )
}
