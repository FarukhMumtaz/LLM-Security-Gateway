/**
 * components/ConfigPanel.jsx
 * ───────────────────────────
 * Sidebar card that displays the live gateway configuration fetched from
 * GET /config — injection weights, thresholds, and masked entity list.
 *
 * Security analysts can see the exact ruleset governing the gateway
 * without needing to read config.yaml directly.
 */

import { Settings, ChevronRight } from 'lucide-react'
import { useConfig } from '../hooks/useGateway'

// ── Skeleton placeholder ──────────────────────────────────────────────────────
function ConfigSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      {[80, 60, 70, 55, 65].map((w, i) => (
        <div key={i} className="skeleton h-4 rounded" style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}

// ── Weight row ────────────────────────────────────────────────────────────────
function WeightRow({ label, value }) {
  const pct = Math.round(value * 100)
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-slate-500 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
        <div
          className="gauge-bar h-full rounded-full bg-indigo-500/70"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="mono text-[11px] text-slate-400 w-8 text-right">{value}</span>
    </div>
  )
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionHeading({ children }) {
  return (
    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1 mb-2">
      {children}
    </h3>
  )
}

export default function ConfigPanel() {
  const { config, configLoading, configError } = useConfig()

  return (
    <aside className="w-full lg:w-72 shrink-0">
      <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50 bg-slate-800/30">
          <Settings size={14} className="text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Gateway Config
          </span>
        </div>

        {/* Body */}
        {configLoading ? (
          <ConfigSkeleton />
        ) : configError ? (
          <p className="text-xs text-rose-400 p-4">{configError}</p>
        ) : config ? (
          <div className="p-4 flex flex-col gap-4">

            {/* ── Thresholds ──────────────────────────────────────────── */}
            <div>
              <SectionHeading>Thresholds</SectionHeading>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Injection block</span>
                  <span className="mono text-xs font-semibold text-amber-400">
                    ≥ {config.injection_threshold}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Presidio confidence</span>
                  <span className="mono text-xs font-semibold text-sky-400">
                    ≥ {config.presidio_score_threshold}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Injection weights ────────────────────────────────────── */}
            {config.injection_weights && (
              <div>
                <SectionHeading>Injection Weights</SectionHeading>
                <div className="flex flex-col gap-2">
                  {Object.entries(config.injection_weights).map(([key, val]) => (
                    <WeightRow key={key} label={key} value={val} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Masked entities ──────────────────────────────────────── */}
            {config.mask_entities?.length > 0 && (
              <div>
                <SectionHeading>Masked Entity Types</SectionHeading>
                <ul className="flex flex-col gap-1">
                  {config.mask_entities.map((e) => (
                    <li
                      key={e}
                      className="flex items-center gap-1.5 text-[11px] mono text-slate-400"
                    >

                      <ChevronRight size={10} className="text-slate-600" />
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </aside>
  )
}
