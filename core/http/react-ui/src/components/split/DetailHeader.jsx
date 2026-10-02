import { useState } from 'react'
import { useTranslation } from 'react-i18next'

// A character-capped excerpt cut mid-word reads as broken ("0.6B and 1.7B m").
// Back off to the last word boundary and mark the cut.
function excerpt(text) {
  const cut = text.replace(/\s+\S*$/, '').replace(/[\s,.;:–—-]+$/, '')
  return `${cut || text}…`
}

// DetailHeader is the top of the pane once something is selected: the way back
// out, what you are looking at, and what you can do to it.
//
// The back control is the piece the expand-row never had. Selection lives in
// the URL on all three surfaces, so leaving the detail is a real navigation
// rather than a second click on the thing you just opened.
export default function DetailHeader({
  icon, name, lede, ledeTitle, actions, onBack, backLabel, warning,
  testId = 'detail',
}) {
  const { t } = useTranslation('common')
  const [expanded, setExpanded] = useState(false)
  // Callers pass a capped lede plus the whole text as ledeTitle. The title is
  // a hover tooltip, which a touch screen never shows, so when the lede is a
  // cut-down version offer a real toggle to read the rest.
  const truncated = !!(lede && ledeTitle && ledeTitle.length > lede.length)
  const shown = truncated ? (expanded ? ledeTitle : excerpt(lede)) : lede
  return (
    <>
      {onBack && (
        <button type="button" className="detail-pane__back" onClick={onBack} data-testid={`${testId}-back`}>
          <i className="fas fa-arrow-left" aria-hidden="true" /> {backLabel}
        </button>
      )}

      <div className="detail-pane__head">
        {icon && <i className={`fas ${icon} detail-pane__icon`} aria-hidden="true" />}
        <div className="detail-pane__title">
          <h2 className="detail-pane__name">{name}</h2>
          {lede && (
            // Capped, with the whole of it on the title so nothing is lost to
            // the truncation, and a toggle where the title cannot be hovered.
            <p className="detail-pane__lede" title={ledeTitle || undefined}>{shown}</p>
          )}
          {truncated && (
            <button
              type="button"
              className="detail-pane__more"
              aria-expanded={expanded}
              onClick={() => setExpanded(v => !v)}
            >
              {expanded ? t('actions.showLess') : t('actions.showMore')}
            </button>
          )}
        </div>
        {actions && <div className="detail-pane__actions">{actions}</div>}
      </div>

      {warning && (
        <p className="detail-pane__warning">
          <i className="fas fa-circle-exclamation" aria-hidden="true" /> {warning}
        </p>
      )}
    </>
  )
}
