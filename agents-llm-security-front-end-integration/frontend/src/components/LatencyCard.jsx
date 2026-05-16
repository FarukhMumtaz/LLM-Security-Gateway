/**
 * components/LatencyCard.jsx
 * ───────────────────────────
 * Displays the per-stage latency breakdown returned from POST /analyze.
 * Total latency is shown prominently; individual stage timings in a table.
 */

import { Zap } from 'lucide-react'

/**
 * @param {{ latency: { total_ms: number, injection_ms: number, presidio_ms: number, policy_ms: number } }} props
 */
export default function LatencyCard({ latency }) {
  const { total_ms, injection_ms, presidio_ms, policy_ms } = latency

  const stages = [
    { label: 'Injection Detection', ms: injection_ms, color: 'bg-violet-500' },
    { label: 'Presidio PII Scan',   ms: presidio_ms,  color: 'bg-sky-500'    },
    { label: 'Policy Engine',       ms: policy_ms,    color: 'bg-teal-500'   },
  ]

  // Width of each stage bar is proportional to total
  const barWidth = (ms) =>
    total_ms > 0 ? `${Math.max((ms / total_ms) * 100, 4)}%` : '4%'

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 flex flex-col gap-3">
      {/* Total — hero display */}
      <div className="flex items-center gap-2">
        <Zap size={16} className="text-yellow-400" />
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Latency
        </span>
        <span className="ml-auto mono text-sm font-bold text-yellow-300">
          ⚡ {total_ms.toFixed(1)} ms
        </span>
      </div>

      {/* Stage breakdown */}
      <div className="flex flex-col gap-2">
        {stages.map(({ label, ms, color }) => (
          <div key={label} className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">{label}</span>
              <span className="mono text-slate-300">{ms.toFixed(2)} ms</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-700/60 overflow-hidden">
              <div
                className={`gauge-bar h-full rounded-full ${color} opacity-80`}
                style={{ width: barWidth(ms) }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
