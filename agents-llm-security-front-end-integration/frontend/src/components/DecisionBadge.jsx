/**
 * components/DecisionBadge.jsx
 * ─────────────────────────────
 * Large animated status badge for the three gateway decisions:
 *   • allow  → Emerald (green)
 *   • mask   → Amber   (yellow-orange)
 *   • block  → Rose    (red)
 *
 * Re-mounts with a key to re-trigger the pop animation on every new result.
 */

import { ShieldCheck, ShieldAlert, ShieldOff } from 'lucide-react'

const DECISION_CONFIG = {
  allow: {
    label: 'ALLOWED',
    Icon: ShieldCheck,
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
    glow: 'glow-emerald',
    iconColor: '#10b981',
    description: 'Prompt is safe to forward to the LLM.',
  },
  mask: {
    label: 'MASKED',
    Icon: ShieldAlert,
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    glow: 'glow-amber',
    iconColor: '#f59e0b',
    description: 'PII detected and anonymized before forwarding.',
  },
  block: {
    label: 'BLOCKED',
    Icon: ShieldOff,
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/40',
    text: 'text-rose-400',
    glow: 'glow-rose',
    iconColor: '#f43f5e',
    description: 'Prompt injection or jailbreak attempt detected.',
  },
}

/**
 * @param {{ decision: 'allow'|'mask'|'block' }} props
 */
export default function DecisionBadge({ decision }) {
  const cfg = DECISION_CONFIG[decision] ?? DECISION_CONFIG.allow
  const { label, Icon, bg, border, text, glow, iconColor, description } = cfg

  return (
    <div
      className={`badge-pop flex flex-col items-center gap-3 rounded-2xl border px-8 py-6 ${bg} ${border} ${glow}`}
    >
      {/* Icon */}
      <Icon size={52} color={iconColor} strokeWidth={1.5} />

      {/* Decision label */}
      <span className={`text-3xl font-extrabold tracking-widest ${text}`}>
        {label}
      </span>

      {/* Human-readable description */}
      <p className="text-center text-sm text-slate-400 max-w-[220px] leading-relaxed">
        {description}
      </p>
    </div>
  )
}
