import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { MemoryCard, mapItemToMemory } from './MoraUI'
import { buildMemoryContext } from '../utils/buildMemoryContext'
import { buildCompanionInsight } from '../utils/buildCompanionInsight'
import { useCompanionSession } from '../hooks/useCompanionSession'

const PROMPTS = [
  'What have I been thinking about lately?',
  'Show startup memories',
  'What else related to that?',
]

function CompanionPanel({ onClose, resolveQuery, commitQuery, isReference }) {
  const { items } = useApp()
  const navigate = useNavigate()
  const [queryInput, setQueryInput] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const debounceTimer = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleQueryChange(e) {
    const val = e.target.value
    setQueryInput(val)
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setDebouncedQuery(val.trim()), 250)
  }

  function applyPrompt(p) {
    setQueryInput(p)
    clearTimeout(debounceTimer.current)
    setDebouncedQuery(p)
    inputRef.current?.focus()
  }

  function openItem(id) {
    navigate(`/item/${id}`)
    onClose()
  }

  const resolvedQuery = useMemo(() => resolveQuery(debouncedQuery), [debouncedQuery, resolveQuery])
  const queryContext = useMemo(
    () => (resolvedQuery ? buildMemoryContext(resolvedQuery, items) : null),
    [resolvedQuery, items]
  )
  const companionInsight = useMemo(
    () => (resolvedQuery && queryContext ? buildCompanionInsight(resolvedQuery, queryContext) : null),
    [resolvedQuery, queryContext]
  )
  const queryMemories = useMemo(
    () => (queryContext ? queryContext.relevantMemories.slice(0, 4).map(item => mapItemToMemory(item)) : []),
    [queryContext]
  )

  useEffect(() => {
    if (debouncedQuery && queryContext && !isReference(debouncedQuery)) {
      commitQuery(debouncedQuery, queryContext)
    }
  }, [debouncedQuery, queryContext, isReference, commitQuery])

  return (
    <>
      <div className="m-companion-head">
        <span className="m-companion-title">Mora</span>
        <button className="m-iconbtn" onClick={onClose} aria-label="Close companion">
          <i className="ph ph-x" />
        </button>
      </div>

      <div className="m-companion-body">
        {!debouncedQuery && (
          <div className="m-companion-prompts">
            {PROMPTS.map(p => (
              <button key={p} className="m-companion-prompt" onClick={() => applyPrompt(p)}>
                {p}
              </button>
            ))}
          </div>
        )}

        <div className="m-search m-companion-search">
          <i className="ph ph-magnifying-glass" />
          <input
            ref={inputRef}
            type="text"
            value={queryInput}
            onChange={handleQueryChange}
            placeholder="Ask your reflections..."
          />
        </div>

        {debouncedQuery && companionInsight && (
          <div className="m-companion-results">
            <span className="m-eyebrow m-companion-eyebrow">
              <span className="m-eyebrow-dot" style={{ background: 'var(--mora-ochre)' }} />
              Mora Noticed
            </span>
            {companionInsight.summary && (
              <p className="m-companion-insight">{companionInsight.summary}</p>
            )}
            {queryMemories.length > 0 && (
              <>
                <span className="m-eyebrow m-companion-eyebrow" style={{ marginTop: 20 }}>
                  <span className="m-eyebrow-dot" style={{ background: 'var(--mora-ochre)' }} />
                  Related Memories
                </span>
                <div className="m-companion-cards">
                  {queryMemories.map(memory => (
                    <MemoryCard key={memory.id} memory={memory} onOpen={openItem} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default function FloatingCompanion() {
  const [isOpen, setIsOpen] = useState(false)
  const { resolveQuery, commitQuery, isReference } = useCompanionSession()

  function open() { setIsOpen(true) }
  function close() { setIsOpen(false) }

  useEffect(() => {
    if (!isOpen) return
    function onKey(e) { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen])

  return (
    <>
      <button
        className={`m-companion-trigger${isOpen ? ' is-open' : ''}`}
        onClick={isOpen ? close : open}
        aria-label="Open Mora companion"
        aria-expanded={isOpen}
      >
        <span className="m-companion-trigger-dot" />
        <span>Mora</span>
      </button>

      {isOpen && (
        <div
          className="m-companion-overlay"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {isOpen && (
        <div
          className="m-companion-sheet"
          role="dialog"
          aria-label="Mora companion"
          aria-modal="true"
        >
          <CompanionPanel
            onClose={close}
            resolveQuery={resolveQuery}
            commitQuery={commitQuery}
            isReference={isReference}
          />
        </div>
      )}
    </>
  )
}
