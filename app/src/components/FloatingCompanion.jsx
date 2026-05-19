import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { MemoryCard, mapItemToMemory } from './MoraUI'
import { buildMemoryContext } from '../utils/buildMemoryContext'
import { buildCompanionIntelligence } from '../utils/buildCompanionIntelligence'
import { buildMemoryReview } from '../utils/buildMemoryReview'
import { buildMonthlyMemoryReview } from '../utils/buildMonthlyMemoryReview'
import { buildMemoryEvolution } from '../utils/buildMemoryEvolution'
import { buildResurfacingSignals } from '../utils/buildResurfacingSignals'
import { buildMemoryGraph } from '../utils/buildMemoryGraph'
import { buildMemoryRecall } from '../utils/buildMemoryRecall'
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

  function goToReflections() {
    navigate('/archive')
    onClose()
  }

  const memoryReview = useMemo(() => buildMemoryReview(items), [items])
  const monthlyReview = useMemo(() => buildMonthlyMemoryReview(items), [items])
  const memoryEvolution = useMemo(() => buildMemoryEvolution(items), [items])
  const resurfacingSignals = useMemo(() => buildResurfacingSignals(items), [items])
  const memoryGraph = useMemo(() => buildMemoryGraph(items), [items])

  const resolvedQuery = useMemo(() => resolveQuery(debouncedQuery), [debouncedQuery, resolveQuery])
  const queryContext = useMemo(
    () => (resolvedQuery ? buildMemoryContext(resolvedQuery, items) : null),
    [resolvedQuery, items]
  )
  const companionInsight = useMemo(
    () => resolvedQuery && queryContext
      ? buildCompanionIntelligence(resolvedQuery, queryContext, memoryReview, monthlyReview, memoryEvolution, resurfacingSignals)
      : null,
    [resolvedQuery, queryContext, memoryReview, monthlyReview, memoryEvolution, resurfacingSignals]
  )
  const memoryRecall = useMemo(
    () => resolvedQuery && queryContext
      ? buildMemoryRecall(resolvedQuery, queryContext, memoryGraph, memoryEvolution)
      : null,
    [resolvedQuery, queryContext, memoryGraph, memoryEvolution]
  )
  const queryMemories = useMemo(() => {
    const source = memoryRecall?.recalledItems?.length
      ? memoryRecall.recalledItems
      : (queryContext?.relevantMemories || [])
    return source.slice(0, 3).map(item => mapItemToMemory(item))
  }, [queryContext, memoryRecall])

  useEffect(() => {
    if (debouncedQuery && queryContext && !isReference(debouncedQuery)) {
      commitQuery(debouncedQuery, queryContext)
    }
  }, [debouncedQuery, queryContext, isReference, commitQuery])

  const hasResults = debouncedQuery && companionInsight

  return (
    <>
      {/* Header */}
      <div className="m-companion-head">
        <div className="m-companion-head-left">
          <span className="m-eyebrow m-companion-eyebrow-sm">
            <span className="m-eyebrow-dot" style={{ background: 'var(--mora-ochre)' }} />
            Memory companion
          </span>
          <span className="m-companion-title">Mora</span>
        </div>
        <button className="m-iconbtn m-companion-close-btn" onClick={onClose} aria-label="Close companion">
          <i className="ph ph-x" />
        </button>
      </div>

      {/* Body */}
      <div className="m-companion-body">

        {/* Idle: seed prompts */}
        {!queryInput && (
          <div className="m-companion-idle">
            <div className="m-companion-prompts">
              {PROMPTS.map(p => (
                <button key={p} className="m-companion-prompt" onClick={() => applyPrompt(p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="m-companion-input-wrap">
          <i className="ph ph-magnifying-glass m-companion-input-icon" />
          <input
            ref={inputRef}
            type="text"
            value={queryInput}
            onChange={handleQueryChange}
            className="m-companion-input"
            placeholder="Ask your reflections..."
          />
          {queryInput && (
            <button
              className="m-companion-input-clear"
              onClick={() => { setQueryInput(''); setDebouncedQuery(''); inputRef.current?.focus() }}
              aria-label="Clear"
            >
              <i className="ph ph-x-circle" />
            </button>
          )}
        </div>

        {/* Results */}
        {hasResults && (
          <div className="m-companion-results">
            {/* Mora Noticed */}
            {companionInsight.response && (
              <div className="m-companion-noticed">
                <span className="m-eyebrow m-companion-eyebrow-sm">
                  <span className="m-eyebrow-dot" style={{ background: 'var(--mora-ochre)' }} />
                  Mora noticed
                </span>
                <p className="m-companion-insight">{companionInsight.response}</p>
              </div>
            )}

            {/* Related memories */}
            {queryMemories.length > 0 && (
              <div className="m-companion-memories">
                <div className="m-companion-memories-rule">
                  <span className="m-rule-line" />
                </div>
                <div className="m-companion-cards">
                  {queryMemories.map(memory => (
                    <MemoryCard key={memory.id} memory={memory} onOpen={openItem} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer: path to archive */}
        <div className="m-companion-foot">
          <button className="m-companion-archive-link" onClick={goToReflections}>
            All reflections
            <i className="ph ph-arrow-right" />
          </button>
        </div>
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
        <div className="m-companion-overlay" onClick={close} aria-hidden="true" />
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
