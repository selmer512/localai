// SPDX-License-Identifier: MIT
import { ChevronLeft, SlidersHorizontal, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ModelSelector from '../ModelSelector'
import { CAP_CHAT } from '../../utils/capabilities'

export default function PhoneChatHeader({ chat, onBack, onModelChange, onSettings, settingsOpen, settingsTriggerRef, children }) {
  const { t } = useTranslation('chat')
  return (
    <header className="chat-header phone-chat-header">
      <button type="button" className="chat-header-back phone-chat-icon" onClick={onBack} aria-label={t('header.back')}>
        <ChevronLeft aria-hidden="true" size={26} />
      </button>
      <div className="phone-chat-heading">
        <h1 className="phone-chat-title" title={chat.name}>
          {chat.localaiAssistant && <span className="phone-chat-manage" role="img" aria-label={t('settings.manageMode')} title={t('header.manageModeTooltip')}><ShieldCheck size={15} aria-hidden="true" /></span>}
          {chat.name}
        </h1>
        <ModelSelector value={chat.model} onChange={onModelChange} capability={CAP_CHAT} className="chat-header-model" />
      </div>
      {children}
      <button ref={settingsTriggerRef} type="button" className="phone-chat-icon" onClick={onSettings} aria-label={t('header.chatSettings')} aria-haspopup="dialog" aria-expanded={settingsOpen}>
        <SlidersHorizontal aria-hidden="true" size={21} />
      </button>
    </header>
  )
}
