import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// Searches the Hugging Face Hub directly from the browser and hands a picked
// repo to the importer, which already resolves a repo to a backend and files.
// The query goes to huggingface.co, not through LocalAI: the Hub API allows
// cross-origin reads, and keeping it client-side means a UI-only update ships
// it. The gallery stays the curated default; this is the escape hatch for
// whatever the gallery does not list yet.

const HF_API = 'https://huggingface.co/api/models'
const PAGE = 30
const MAX_RESULTS = 120

// Formats are Hub tags; tasks are Hub pipeline tags. Both are passed through
// as the Hub's own filters so the result count and ranking stay the Hub's.
const FORMATS = [
  { key: '', labelKey: 'hf.formats.any' },
  { key: 'gguf', labelKey: 'hf.formats.gguf' },
  { key: 'safetensors', labelKey: 'hf.formats.safetensors' },
  { key: 'onnx', labelKey: 'hf.formats.onnx' },
]
const TASKS = [
  { key: '', labelKey: 'hf.tasks.any', icon: 'fa-border-all' },
  { key: 'text-generation', labelKey: 'hf.tasks.chat', icon: 'fa-comments' },
  { key: 'image-text-to-text', labelKey: 'hf.tasks.vision', icon: 'fa-eye' },
  { key: 'automatic-speech-recognition', labelKey: 'hf.tasks.speechToText', icon: 'fa-microphone' },
  { key: 'text-to-speech', labelKey: 'hf.tasks.textToSpeech', icon: 'fa-volume-high' },
  { key: 'text-to-image', labelKey: 'hf.tasks.image', icon: 'fa-image' },
  { key: 'feature-extraction', labelKey: 'hf.tasks.embeddings', icon: 'fa-vector-square' },
]
// Hub pipeline tags are machine names ("automatic-speech-recognition"); show
// the chip's own label when there is one, else a readable version of the tag.
const TASK_LABELS = Object.fromEntries(TASKS.filter(x => x.key).map(x => [x.key, x.labelKey]))
function taskLabel(tag, t) {
  return TASK_LABELS[tag] ? t(TASK_LABELS[tag]) : tag.replace(/-/g, ' ')
}

const SORTS = [
  { key: 'downloads', labelKey: 'hf.sort.downloads' },
  { key: 'trendingScore', labelKey: 'hf.sort.trending' },
  { key: 'likes', labelKey: 'hf.sort.likes' },
  { key: 'createdAt', labelKey: 'hf.sort.newest' },
]

function hfSearchURL({ query, format, task, sort, limit }) {
  const p = new URLSearchParams()
  if (query.trim()) p.set('search', query.trim())
  if (format) p.set('filter', format)
  if (task) p.set('pipeline_tag', task)
  p.set('sort', sort)
  p.set('direction', '-1')
  p.set('limit', String(limit))
  return `${HF_API}?${p}`
}

function compact(n) {
  if (typeof n !== 'number') return '0'
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

export default function HuggingFaceSearch({ query, onQueryChange }) {
  const { t } = useTranslation('models')
  const navigate = useNavigate()
  const [format, setFormat] = useState('gguf')
  const [task, setTask] = useState('')
  const [sort, setSort] = useState('downloads')
  const [limit, setLimit] = useState(PAGE)
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [retry, setRetry] = useState(0)
  const debounceRef = useRef(null)

  // A new search starts from the first page again.
  useEffect(() => { setLimit(PAGE) }, [query, format, task, sort])

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(hfSearchURL({ query, format, task, sort, limit }), { signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setResults(Array.isArray(data) ? data : [])
        setStatus('ready')
      } catch (err) {
        if (err.name !== 'AbortError') setStatus('error')
      }
    }, 350)
    return () => { controller.abort(); clearTimeout(debounceRef.current) }
  }, [query, format, task, sort, limit, retry])

  const importRepo = (id) => navigate(`/app/import-model?uri=${encodeURIComponent(`huggingface://${id}`)}`)
  const loadingFirstPage = status === 'loading' && results.length === 0

  return (
    <div className="hf-search" data-testid="hf-search">
      <div className="filter-bar-group models-filters">
        <div className="filter-bar-group__row models-filters__query">
          <div className="search-bar filter-bar-group__search">
            <i className="fas fa-search search-icon" aria-hidden="true" />
            <input
              className="input"
              type="search"
              enterKeyHint="search"
              placeholder={t('hf.searchPlaceholder')}
              aria-label={t('hf.searchPlaceholder')}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
            />
          </div>
          <label className="hf-search__sort">
            <span className="sr-only">{t('hf.sortLabel')}</span>
            <select className="input" value={sort} onChange={(e) => setSort(e.target.value)} aria-label={t('hf.sortLabel')}>
              {SORTS.map(s => <option key={s.key} value={s.key}>{t(s.labelKey)}</option>)}
            </select>
          </label>
        </div>

        <div className="hf-search__chips" role="group" aria-label={t('hf.taskLabel')}>
          {TASKS.map(x => (
            <button key={x.key} type="button" className={`filter-btn ${task === x.key ? 'active' : ''}`} aria-pressed={task === x.key} onClick={() => setTask(x.key)}>
              <i className={`fas ${x.icon}`} aria-hidden="true" /> {t(x.labelKey)}
            </button>
          ))}
        </div>
        <div className="hf-search__chips" role="group" aria-label={t('hf.formatLabel')}>
          {FORMATS.map(x => (
            <button key={x.key} type="button" className={`filter-btn ${format === x.key ? 'active' : ''}`} aria-pressed={format === x.key} onClick={() => setFormat(x.key)}>
              {t(x.labelKey)}
            </button>
          ))}
        </div>
        <p className="hf-search__note">
          <i className="fas fa-circle-info" aria-hidden="true" /> {t('hf.note')}
        </p>
      </div>

      {status === 'error' && results.length === 0 ? (
        <div className="empty-state" data-testid="hf-error">
          <div className="empty-state-icon"><i className="fas fa-cloud-bolt" /></div>
          <h2 className="empty-state-title">{t('hf.errorTitle')}</h2>
          <p className="empty-state-text">{t('hf.errorText')}</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRetry(r => r + 1)}>
            <i className="fas fa-rotate-right" /> {t('hf.retry')}
          </button>
        </div>
      ) : loadingFirstPage ? (
        <div className="hf-search__loading" aria-live="polite">
          <i className="fas fa-spinner fa-spin" aria-hidden="true" /> {t('hf.loading')}
        </div>
      ) : status === 'ready' && results.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><i className="fas fa-search" /></div>
          <h2 className="empty-state-title">{t('hf.emptyTitle')}</h2>
          <p className="empty-state-text">{t('hf.emptyText')}</p>
        </div>
      ) : (
        <>
          <ul className="hf-results" aria-busy={status === 'loading'}>
            {results.map(m => {
              const [owner, ...rest] = (m.id || '').split('/')
              const name = rest.join('/') || owner
              return (
                <li key={m.id} className="hf-result" data-testid="hf-result">
                  <div className="hf-result__main">
                    <div className="hf-result__name">
                      <span className="hf-result__repo">{name}</span>
                      {rest.length > 0 && <span className="hf-result__owner">{owner}</span>}
                    </div>
                    <div className="hf-result__meta">
                      {m.pipeline_tag && <span className="hf-result__task">{taskLabel(m.pipeline_tag, t)}</span>}
                      {m.gated && <span className="badge badge-warning"><i className="fas fa-lock" /> {t('hf.gated')}</span>}
                      <span title={t('hf.downloads')}><i className="fas fa-download" aria-hidden="true" /> {compact(m.downloads)}</span>
                      <span title={t('hf.likes')}><i className="fas fa-heart" aria-hidden="true" /> {compact(m.likes)}</span>
                    </div>
                  </div>
                  <div className="hf-result__actions">
                    <a className="btn btn-secondary btn-sm" href={`https://huggingface.co/${m.id}`} target="_blank" rel="noopener noreferrer" aria-label={t('hf.viewOnHub', { name: m.id })}>
                      <i className="fas fa-arrow-up-right-from-square" aria-hidden="true" />
                    </a>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => importRepo(m.id)}>
                      <i className="fas fa-download" aria-hidden="true" /> {t('hf.importAction')}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
          {results.length >= limit && limit < MAX_RESULTS && (
            <div className="hf-search__more">
              <button type="button" className="btn btn-secondary" disabled={status === 'loading'} onClick={() => setLimit(l => l + PAGE)}>
                {status === 'loading' ? <i className="fas fa-spinner fa-spin" /> : null} {t('hf.loadMore')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
