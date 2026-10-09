// SPDX-License-Identifier: MIT
import { useRef, useState } from 'react'
import { Copy, Ellipsis, Pencil, RotateCcw, GitBranch } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Sheet } from '../ui/sheet'
import { InsetGroup, ListRow } from '../ui/list'

export default function PhoneMessageActions({ onCopy, onEdit, onRegenerate, onBranch }) {
  const { t } = useTranslation('chat')
  const [open, setOpen] = useState(false)
  const trigger = useRef(null)
  const run = action => { setOpen(false); action() }
  return (
    <div className="phone-message-actions">
      <button type="button" className="phone-chat-icon" onClick={onCopy} aria-label={t('actions.copy')}><Copy size={17} aria-hidden="true" /></button>
      {onEdit && !onRegenerate && !onBranch ? (
        <button type="button" className="phone-chat-icon" onClick={onEdit} aria-label={t('actions.edit')}><Pencil size={17} aria-hidden="true" /></button>
      ) : (onEdit || onRegenerate || onBranch) && (
        <button ref={trigger} type="button" className="phone-chat-icon" onClick={() => setOpen(true)} aria-label={t('phone.messageActions')} aria-haspopup="dialog" aria-expanded={open}><Ellipsis size={20} aria-hidden="true" /></button>
      )}
      <Sheet open={open} onOpenChange={setOpen} title={t('phone.messageActions')} cancelLabel={t('actions.cancel')} onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus() }}>
        <InsetGroup>
          {onEdit && <ListRow leading={<Pencil size={19} />} title={t('actions.edit')} onClick={() => run(onEdit)} />}
          {onRegenerate && <ListRow leading={<RotateCcw size={19} />} title={t('actions.regenerate')} onClick={() => run(onRegenerate)} />}
          {onBranch && <ListRow leading={<GitBranch size={19} />} title={t('actions.branch')} onClick={() => run(onBranch)} />}
        </InsetGroup>
      </Sheet>
    </div>
  )
}
