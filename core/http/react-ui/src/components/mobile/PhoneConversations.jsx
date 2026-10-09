// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Ellipsis, SquarePen, MessageSquare, Check, Pencil, Copy, Download, GitBranch, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Sheet } from '../ui/sheet'
import { InsetGroup, ListRow } from '../ui/list'
import { Button } from '../ui/button'
import { relativeTime } from '../../utils/format'

export default function PhoneConversations({ open, onOpenChange, chats, totalChats, activeChatId, streamingChatId, search, onSearch, onSelect, onNew, onDelete, onDeleteAll, onRename, onCopyChat, onExport, onDuplicate, onCloseAutoFocus }) {
  const { t } = useTranslation('chat')
  const [actionsId, setActionsId] = useState(null)
  const [renaming, setRenaming] = useState(null)
  const [name, setName] = useState('')
  const run = action => { setActionsId(null); action() }
  return (
    <Sheet open={open} onOpenChange={next => { onOpenChange(next); if (!next) { setActionsId(null); setRenaming(null) } }} title={t('menu.trigger')} cancelLabel={t('actions.cancel')} onCloseAutoFocus={onCloseAutoFocus} className="phone-conversations">
      <div className="phone-conversations-top">
        <Button onClick={onNew}><SquarePen size={18} aria-hidden="true" /> {t('menu.newChat')}</Button>
        <input type="search" className="input" aria-label={t('menu.search')} placeholder={t('menu.search')} value={search} onChange={event => onSearch(event.target.value)} />
      </div>
      {chats.length > 0 ? <InsetGroup>
        {chats.map(chat => (
          <div key={chat.id}>
            <div className={`phone-conversations-row${chat.id === activeChatId ? ' phone-conversations-row--active' : ''}`}>
              <ListRow onClick={() => onSelect(chat.id)} title={chat.name} subtitle={streamingChatId === chat.id ? t('activity.thinking') : relativeTime(chat.updatedAt)} leading={chat.id === activeChatId ? <Check size={18} aria-hidden="true" /> : <MessageSquare size={18} aria-hidden="true" />} />
              <button type="button" className="phone-chat-icon" aria-label={`${t('phone.conversationActions')}: ${chat.name}`} aria-expanded={actionsId === chat.id} onClick={() => setActionsId(actionsId === chat.id ? null : chat.id)}><Ellipsis size={20} aria-hidden="true" /></button>
            </div>
            {renaming === chat.id && <form className="phone-conversations-rename" onSubmit={event => { event.preventDefault(); if (name.trim()) onRename(chat.id, name.trim()); setRenaming(null) }}>
              <input autoFocus className="input" aria-label={t('menu.rename')} value={name} onChange={event => setName(event.target.value)} />
              <Button size="sm" type="submit" disabled={!name.trim()}>{t('actions.save')}</Button>
            </form>}
            {actionsId === chat.id && <div className="phone-conversations-actions">
              <ListRow leading={<Pencil size={18} />} title={t('menu.rename')} onClick={() => run(() => { setName(chat.name); setRenaming(chat.id) })} />
              {onDuplicate && <ListRow leading={<GitBranch size={18} />} title={t('menu.duplicate')} onClick={() => run(() => { onDuplicate(chat); onOpenChange(false) })} />}
              {chat.history?.length > 0 && onCopyChat && <ListRow leading={<Copy size={18} />} title={t('menu.copyChat')} onClick={() => run(() => onCopyChat(chat))} />}
              {chat.history?.length > 0 && onExport && <ListRow leading={<Download size={18} />} title={t('menu.exportMarkdown')} onClick={() => run(() => onExport(chat))} />}
              {totalChats > 1 && onDelete && <ListRow leading={<Trash2 size={18} />} title={t('menu.deleteChat')} titleClassName="tw:text-danger" onClick={() => run(() => onDelete(chat.id))} />}
            </div>}
          </div>
        ))}
      </InsetGroup> : <p className="phone-chat-footnote" role="status">{t(search ? 'menu.noMatch' : 'menu.noConversations')}</p>}
      {totalChats > 1 && <InsetGroup><ListRow title={t('menu.clearAll')} titleClassName="tw:text-danger" onClick={() => { onOpenChange(false); onDeleteAll() }} /></InsetGroup>}
    </Sheet>
  )
}
