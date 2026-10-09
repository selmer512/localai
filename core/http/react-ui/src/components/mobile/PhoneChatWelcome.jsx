// SPDX-License-Identifier: MIT
import { Code2, FileText, Lightbulb, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { InsetGroup, ListRow, IconTile } from '../ui/list'
import { relativeTime } from '../../utils/format'

const IDEAS = [Sparkles, Code2, FileText, Lightbulb]
const COLORS = ['purple', 'blue', 'teal', 'amber']

export default function PhoneChatWelcome({ chat, recentChats, onPrompt, onSelect }) {
  const { t } = useTranslation('chat')
  const prompts = t(chat.localaiAssistant ? 'empty.suggestionsManage' : 'empty.suggestionsChat', { returnObjects: true })
  return (
    <div className="phone-chat-welcome">
      <div className="phone-chat-intro">
        <h2>{t(chat.localaiAssistant ? 'empty.manageTitle' : 'empty.startTitle')}</h2>
        <p>{t(chat.localaiAssistant ? 'empty.manageText' : chat.model ? 'phone.welcomeHint' : 'empty.selectModelText')}</p>
      </div>
      <InsetGroup header={t('phone.ideas')}>
        {prompts.map((prompt, index) => {
          const Icon = IDEAS[index % IDEAS.length]
          return <ListRow key={prompt} onClick={() => onPrompt(prompt)} leading={<IconTile icon={<Icon size={17} />} color={COLORS[index % COLORS.length]} />} title={prompt} chevron />
        })}
      </InsetGroup>
      {recentChats.length > 0 && <InsetGroup header={t('empty.recent')}>
        {recentChats.slice(0, 3).map(recent => (
          <ListRow key={recent.id} onClick={() => onSelect(recent.id)} title={recent.name} subtitle={relativeTime(recent.updatedAt)} chevron />
        ))}
      </InsetGroup>}
    </div>
  )
}
