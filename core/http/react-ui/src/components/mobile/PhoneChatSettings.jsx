// SPDX-License-Identifier: MIT
import { useTranslation } from 'react-i18next'
import { InsetGroup, ListRow, RowValue } from '../ui/list'
import { Sheet } from '../ui/sheet'
import { Switch } from '../ui/switch'

export default function PhoneChatSettings({ open, onOpenChange, chat, onUpdate, isAdmin, modelInfo, contextPercent, tokensPerSecond, maxTokensPerSecond, onClear, onEditConfig, onCloseAutoFocus }) {
  const { t } = useTranslation('chat')
  const update = values => onUpdate(chat.id, values)
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t('settings.title')} doneLabel={t('header.close')} onCloseAutoFocus={onCloseAutoFocus} className="phone-chat-settings">
      {isAdmin && <InsetGroup footer={t('settings.manageModeDesc')}>
        <ListRow title={t('settings.manageMode')} trailing={<Switch checked={!!chat.localaiAssistant} onCheckedChange={value => update({ localaiAssistant: value })} aria-label={t('settings.manageMode')} />} chevron={false} />
      </InsetGroup>}
      <InsetGroup header={t('settings.systemPrompt')}>
        <label className="phone-chat-field">
          <span className="tw:sr-only">{t('settings.systemPrompt')}</span>
          <textarea className="textarea" rows={4} value={chat.systemPrompt || ''} onChange={event => update({ systemPrompt: event.target.value })} placeholder={t('settings.systemPromptPlaceholder')} />
        </label>
      </InsetGroup>
      <InsetGroup header={t('header.modelInfo')}>
        <ListRow title={chat.model || t('empty.selectModelText')} subtitle={modelInfo?.backend} chevron={false} titleClassName="phone-chat-wrap" />
        {/* The same facts as the desktop model-info panel, which phones do not show. */}
        {modelInfo?.parameters?.model && <ListRow title={t('modelInfo.modelFile')} subtitle={modelInfo.parameters.model} chevron={false} subtitleClassName="phone-chat-wrap" />}
        {modelInfo?.context_size > 0 && <ListRow title={t('modelInfo.contextSize')} trailing={<RowValue>{modelInfo.context_size}</RowValue>} chevron={false} />}
        {modelInfo?.gpu_layers > 0 && <ListRow title={t('modelInfo.gpuLayers')} trailing={<RowValue>{modelInfo.gpu_layers}</RowValue>} chevron={false} />}
        {modelInfo?.threads > 0 && <ListRow title={t('modelInfo.threads')} trailing={<RowValue>{modelInfo.threads}</RowValue>} chevron={false} />}
        {modelInfo?.template?.chat_message && <ListRow title={t('modelInfo.chatTemplate')} trailing={<RowValue>{t('modelInfo.yes')}</RowValue>} chevron={false} />}
        {(modelInfo?.mcp?.remote || modelInfo?.mcp?.stdio) && <ListRow title={t('modelInfo.mcp')} trailing={<RowValue>{t('modelInfo.configured')}</RowValue>} chevron={false} />}
        {contextPercent !== null && <ListRow title={t('phone.contextUsage')} trailing={<RowValue>{Math.round(contextPercent)}%</RowValue>} chevron={false} />}
        {tokensPerSecond != null && <ListRow title={t('phone.speed')} trailing={<RowValue>{t('tokens.perSec', { count: tokensPerSecond })}</RowValue>} chevron={false} />}
        {maxTokensPerSecond != null && <ListRow title={t('phone.peakSpeed')} trailing={<RowValue>{t('tokens.perSec', { count: maxTokensPerSecond })}</RowValue>} chevron={false} />}
        {chat.tokenUsage?.total > 0 && <p className="phone-chat-footnote">{t('tokens.usage', { prompt: chat.tokenUsage.prompt, completion: chat.tokenUsage.completion, total: chat.tokenUsage.total })}</p>}
        {isAdmin && chat.model && <ListRow title={t('header.editConfig')} onClick={() => { onOpenChange(false); onEditConfig() }} chevron />}
      </InsetGroup>
      <InsetGroup>
        <details className="phone-chat-advanced">
          <summary>{t('phone.generationSettings')}</summary>
          <div className="phone-chat-sampling">
            {[['temperature', 0, 2, 0.1, 0.7], ['topP', 0, 1, 0.05, 0.9], ['topK', 1, 100, 1, 40]].map(([key, min, max, step, fallback]) => (
              <label key={key} className="phone-chat-slider">
                <span>{t(`settings.${key}`)} <output>{chat[key] ?? fallback}</output></span>
                <input type="range" aria-label={t(`settings.${key}`)} min={min} max={max} step={step} value={chat[key] ?? fallback} onChange={event => update({ [key]: Number(event.target.value) })} />
              </label>
            ))}
            <label className="phone-chat-number">
              <span>{t('settings.contextSize')}</span>
              <input type="number" className="input" min={1} value={chat.contextSize || ''} onChange={event => update({ contextSize: parseInt(event.target.value) || null })} placeholder={t('settings.contextSizePlaceholder')} />
            </label>
          </div>
        </details>
      </InsetGroup>
      {chat.history.length > 0 && <InsetGroup>
        <ListRow title={t('settings.clearHistory')} titleClassName="tw:text-danger" onClick={onClear} />
      </InsetGroup>}
    </Sheet>
  )
}
