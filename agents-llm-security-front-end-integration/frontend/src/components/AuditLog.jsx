/**
 * components/AuditLog.jsx
 * ───────────────────────
 * Displays recent analysis results in a scrollable log.
 * Shows decision, score, and timestamp for each request.
 */

import { useState, useRef, useEffect } from 'react'
import { Trash2, ChevronDown } from 'lucide-react'
import DecisionBadge from './DecisionBadge'

/**
 * @param {{
 *   entries: Array<{id: string, prompt: string, decision: string, injection_score: number, pii_detected: number, timestamp: string}>,
 *   onClear: () => void,
 * }} props
 */
export default function AuditLog({ entries = [], onClear }) {
  const [expandedId, setExpandedId] = useState(null)
  const containerRef = useRef(null)

  // Auto-scroll to latest entry
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [entries])

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-center">
        <p className="text-xs text-slate-500">No audit entries yet. Run an analysis to get started.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-800/30 shrink-0">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Audit Log ({entries.length})
        </span>
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-400 transition-colors"
          title="Clear all entries"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Log entries */}
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        <div className="divide-y divide-slate-700/30">
          {entries.map((entry) => (
            <div key={entry.id} className="border-l-2 border-slate-700/40 hover:bg-slate-800/20 transition-colors">
              <button
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                className="w-full text-left p-3 flex items-center gap-2 group"
              >
                <span
                  className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                    entry.decision === 'allow'
                      ? 'bg-emerald-400'
                      : entry.decision === 'mask'
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-slate-300 truncate">{entry.prompt.slice(0, 50)}…</p>
                  <p className="text-[10px] text-slate-500">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <span className={`text-[10px] font-bold mono shrink-0 ${
                  entry.decision === 'allow'
                    ? 'text-emerald-400'
                    : entry.decision === 'mask'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                }`}>
                  {entry.decision.toUpperCase()}
                </span>
                <ChevronDown
                  size={12}
                  className={`text-slate-500 transition-transform ${expandedId === entry.id ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Expanded details */}
              {expandedId === entry.id && (
                <div className="px-3 pb-3 border-t border-slate-700/30 bg-slate-800/40">
                  <div className="flex flex-col gap-2 text-[11px]">
                    <div>
                      <p className="text-slate-500 mb-1">Full Prompt</p>
                      <p className="text-slate-300 bg-slate-900/60 p-2 rounded mono break-words text-[10px] max-h-24 overflow-y-auto">
                        {entry.prompt}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-slate-500">Injection Score</p>
                        <p className="text-amber-400 font-mono font-semibold">{entry.injection_score.toFixed(3)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">PII Detected</p>
                        <p className="text-slate-300 font-mono">{entry.pii_detected}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
