/**
 * components/EntityTag.jsx
 * ─────────────────────────
 * Small pill chip that displays a single detected PII entity type.
 * Each entity type gets a deterministic color from a fixed palette.
 */

const ENTITY_COLORS = {
  EMAIL_ADDRESS:   'bg-sky-500/20    text-sky-300    border-sky-500/40',
  PHONE_NUMBER:    'bg-violet-500/20 text-violet-300 border-violet-500/40',
  PERSON:          'bg-pink-500/20   text-pink-300   border-pink-500/40',
  LOCATION:        'bg-teal-500/20   text-teal-300   border-teal-500/40',
  DATE_TIME:       'bg-orange-500/20 text-orange-300 border-orange-500/40',
  US_SSN:          'bg-rose-500/20   text-rose-300   border-rose-500/40',
  CREDIT_CARD:     'bg-rose-500/20   text-rose-300   border-rose-500/40',
  API_KEY:         'bg-amber-500/20  text-amber-300  border-amber-500/40',
  IP_ADDRESS:      'bg-lime-500/20   text-lime-300   border-lime-500/40',
  IBAN_CODE:       'bg-cyan-500/20   text-cyan-300   border-cyan-500/40',
  EMPLOYEE_ID:     'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  NRP:             'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
  PII_COMPOSITE:   'bg-red-500/20    text-red-300    border-red-500/40',
}

const DEFAULT_COLOR = 'bg-slate-500/20 text-slate-300 border-slate-500/40'

/**
 * @param {{ entity: { entity_type: string, score?: number } }} props
 */
export default function EntityTag({ entity }) {
  const { entity_type, score } = entity
  const colorClass = ENTITY_COLORS[entity_type] ?? DEFAULT_COLOR

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium mono ${colorClass}`}
      title={score !== undefined ? `Confidence: ${(score * 100).toFixed(0)}%` : entity_type}
    >
      {entity_type}
      {score !== undefined && (
        <span className="opacity-60 text-[10px]">{(score * 100).toFixed(0)}%</span>
      )}
    </span>
  )
}
