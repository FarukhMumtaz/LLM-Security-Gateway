/**
 * components/ScoreGauge.jsx
 * ──────────────────────────
 * Animated horizontal progress bar for displaying the injection score (0–1).
 *
 * Color interpolates:
 *   0.00–0.33 → Emerald (safe)
 *   0.33–0.66 → Amber   (suspicious)
 *   0.66–1.00 → Rose    (dangerous)
 */

/**
 * @param {{ score: number, threshold?: number }} props
 */
export default function ScoreGauge({ score, threshold }) {
  const pct = Math.min(Math.max(score * 100, 0), 100)

  // Determine bar color based on score magnitude
  const barColor =
    score < 0.33
      ? 'bg-emerald-500'
      : score < 0.66
        ? 'bg-amber-500'
        : 'bg-rose-500'

  const textColor =
    score < 0.33
      ? 'text-emerald-400'
      : score < 0.66
        ? 'text-amber-400'
        : 'text-rose-400'

  return (
    <div className="flex flex-col gap-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Injection Score
        </span>
        <span className={`text-sm font-bold mono ${textColor}`}>
          {score.toFixed(3)}
        </span>
      </div>

      {/* Track */}
      <div className="relative h-3 w-full rounded-full bg-slate-700/60 overflow-hidden">
        {/* Fill bar — uses CSS animation via .gauge-bar class */}
        <div
          className={`gauge-bar h-full rounded-full ${barColor}`}
          style={{ width: `${pct}%` }}
        />

        {/* Threshold marker */}
        {threshold !== undefined && (
          <div
            className="absolute top-0 h-full w-0.5 bg-white/30"
            style={{ left: `${threshold * 100}%` }}
            title={`Block threshold: ${threshold}`}
          />
        )}
      </div>

      {/* Scale labels */}
      <div className="flex justify-between text-[10px] text-slate-600 mono">
        <span>0.0</span>
        {threshold !== undefined && (
          <span
            className="text-slate-500"
            style={{ marginLeft: `${threshold * 100 - 3}%` }}
          >
            {threshold.toFixed(2)} ⚠
          </span>
        )}
        <span>1.0</span>
      </div>
    </div>
  )
}
