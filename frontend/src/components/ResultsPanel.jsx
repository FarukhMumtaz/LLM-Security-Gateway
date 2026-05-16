/**
 * components/ResultsPanel.jsx
 * ────────────────────────────
 * Right-side panel of the split-screen playground.
 *
 * States:
 *  1. Idle     — soft placeholder with instructions
 *  2. Loading  — shimmer skeleton
 *  3. Error    — inline error callout (toast is also fired from Playground)
 *  4. Result   — full analysis output with badge, gauge, entities, sanitized text
 */

import { useState } from 'react'
import { Copy, Check, AlertCircle, Fingerprint, ChevronDown, ChevronUp } from 'lucide-react'
import DecisionBadge from './DecisionBadge'
import ScoreGauge    from './ScoreGauge'
import EntityTag     from './EntityTag'
import LatencyCard   from './LatencyCard'

// ── Skeleton ──────────────────────────────────────────────────────────────────
function ResultsSkeleton() {
  return (
    <div className="flex flex-col gap-5 p-6 animate-pulse">
      {/* Badge placeholder */}
      <div className="flex justify-center">
        <div className="skeleton w-48 h-36 rounded-2xl" />
      </div>
      {/* Score gauge placeholder */}
      <div className="skeleton h-14 rounded-xl" />
      {/* Tags placeholder */}
      <div className="flex gap-2">
        <div className="skeleton h-6 w-24 rounded-full" />
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
      {/* Output text placeholder */}
      <div className="skeleton h-28 rounded-xl" />
      {/* Latency placeholder */}
      <div className="skeleton h-24 rounded-xl" />
    </div>
  )
}

// ── Idle placeholder ──────────────────────────────────────────────────────────
function IdlePlaceholder() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/40">
          <Fingerprint size={28} className="text-slate-600" />
        </div>
        <p className="text-sm font-medium text-slate-500">
          Results will appear here
        </p>
        <p className="text-xs text-slate-600 max-w-[200px]">
          Enter a prompt on the left and click <strong className="text-slate-500">Analyze</strong> to run it through the security pipeline.
        </p>
      </div>
    </div>
  )
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* silent — clipboard may be unavailable in some iframes */
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-lg border border-slate-600/50 bg-slate-700/40 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all duration-150"
      title="Copy sanitized output"
    >
      {copied ? (
        <><Check size={12} className="text-emerald-400" /> Copied!</>
      ) : (
        <><Copy size={12} /> Copy</>
      )}
    </button>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────
/**
 * @param {{
 *   result:  Object|null,
 *   loading: boolean,
 *   error:   string|null,
 *   injectionThreshold?: number,
 *   animKey: number,
 * }} props
 */
export default function ResultsPanel({ result, loading, error, injectionThreshold, animKey }) {
  const [entitiesExpanded, setEntitiesExpanded] = useState(true)

  if (loading) return <ResultsSkeleton />
  if (!result && !error) return <IdlePlaceholder />

  if (error) {
    return (
      <div className="flex flex-1 items-start p-6">
        <div className="flex gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 w-full">
          <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-rose-300">Analysis Failed</p>
            <p className="text-xs text-rose-400/80 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const { decision, injection_score, pii_detected, entities, sanitized, timestamp, latency } = result

  return (
    <div className="flex flex-col gap-5 p-6 fade-up">

      {/* ── Decision badge ─────────────────────────────────────────────── */}
      <div className="flex justify-center">
        <DecisionBadge key={animKey} decision={decision} />
      </div>

      {/* ── Injection score gauge ──────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
        <ScoreGauge score={injection_score} threshold={injectionThreshold} />
      </div>

      {/* ── PII entities ───────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
        <button
          className="flex w-full items-center justify-between text-left"
          onClick={() => setEntitiesExpanded((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <Fingerprint size={14} className="text-slate-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              PII Detected
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold mono ${
                pii_detected > 0
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-slate-700/60 text-slate-500'
              }`}
            >
              {pii_detected}
            </span>
          </div>
          {entitiesExpanded
            ? <ChevronUp size={14} className="text-slate-500" />
            : <ChevronDown size={14} className="text-slate-500" />
          }
        </button>

        {entitiesExpanded && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {entities?.length > 0 ? (
              entities.map((ent, i) => <EntityTag key={i} entity={ent} />)
            ) : (
              <span className="text-xs text-slate-600">No entities detected</span>
            )}
          </div>
        )}
      </div>

      {/* ── Sanitized output ───────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50 bg-slate-800/30">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Sanitized Output
          </span>
          <CopyButton text={sanitized} />
        </div>
        <pre className="mono text-xs text-slate-300 p-4 leading-relaxed whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
          {sanitized || <span className="text-slate-600 italic">— empty —</span>}
        </pre>
      </div>

      {/* ── Latency breakdown ──────────────────────────────────────────── */}
      <LatencyCard latency={latency} />

      {/* ── Timestamp ─────────────────────────────────────────────────── */}
      <p className="text-center text-[10px] mono text-slate-600">
        Analyzed at {new Date(timestamp).toLocaleTimeString()}
      </p>
    </div>
  )
}
