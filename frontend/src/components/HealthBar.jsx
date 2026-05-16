/**
 * components/HealthBar.jsx
 * ─────────────────────────
 * Sticky top navigation bar that shows:
 *  - Product branding
 *  - Live gateway status (pulsing dot + ONLINE/OFFLINE label)
 *  - Active injection threshold from /health
 *  - Links to the FastAPI /docs page
 */

import { Shield, ExternalLink, Activity } from 'lucide-react'
import { useHealth } from '../hooks/useGateway'

export default function HealthBar() {
  const { health, isOnline, checking } = useHealth()

  return (
    <header className="sticky top-0 z-40 glass border-b border-slate-700/50 shadow-lg">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 py-3 flex items-center gap-4">

        {/* ── Brand ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30">
            <Shield size={16} className="text-indigo-400" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold text-slate-100 tracking-tight">
              LLM Security Gateway
            </span>
            <span className="text-[10px] text-slate-500 tracking-widest uppercase">
              Prompt Firewall
            </span>
          </div>
        </div>

        {/* ── Spacer ─────────────────────────────────────────────────────── */}
        <div className="flex-1" />

        {/* ── Threshold pill ─────────────────────────────────────────────── */}
        {health && (
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
            <Activity size={12} className="text-slate-500" />
            <span>Inj. threshold:</span>
            <span className="mono font-semibold text-amber-400">
              {health.injection_threshold}
            </span>
            <span className="mx-1 text-slate-600">|</span>
            <span>Presidio:</span>
            <span className="mono font-semibold text-sky-400">
              {health.presidio_score_threshold}
            </span>
          </div>
        )}

        {/* ── Status badge ───────────────────────────────────────────────── */}
        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
            checking
              ? 'border-slate-600/50 bg-slate-700/30 text-slate-400'
              : isOnline
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
          }`}
        >
          {/* Pulsing dot */}
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              checking
                ? 'bg-slate-500'
                : isOnline
                  ? 'bg-emerald-400 animate-pulse-dot'
                  : 'bg-rose-400 animate-pulse-dot-red'
            }`}
          />
          <span>
            {checking ? 'Checking…' : isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        {/* ── Docs link ──────────────────────────────────────────────────── */}
        <a
          href="http://127.0.0.1:8000/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all duration-200"
          title="Open FastAPI Swagger UI"
        >
          API Docs
          <ExternalLink size={11} />
        </a>
      </div>
    </header>
  )
}
