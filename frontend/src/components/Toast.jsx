/**
 * components/Toast.jsx
 * ─────────────────────
 * Top-right slide-in toast notification system.
 *
 * Usage (via context):
 *   const { showToast } = useToast()
 *   showToast('Something went wrong', 'error')
 *
 * Supported variants: 'error' | 'warning' | 'success' | 'info'
 */

import { createContext, useContext, useState, useCallback } from 'react'
import { X, AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react'

// ── Context ───────────────────────────────────────────────────────────────────
const ToastContext = createContext(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

// ── Variant config ────────────────────────────────────────────────────────────
const VARIANTS = {
  error: {
    Icon: AlertCircle,
    bg: 'bg-rose-950/90',
    border: 'border-rose-500/50',
    icon: 'text-rose-400',
    title: 'Error',
  },
  warning: {
    Icon: AlertTriangle,
    bg: 'bg-amber-950/90',
    border: 'border-amber-500/50',
    icon: 'text-amber-400',
    title: 'Warning',
  },
  success: {
    Icon: CheckCircle,
    bg: 'bg-emerald-950/90',
    border: 'border-emerald-500/50',
    icon: 'text-emerald-400',
    title: 'Success',
  },
  info: {
    Icon: Info,
    bg: 'bg-sky-950/90',
    border: 'border-sky-500/50',
    icon: 'text-sky-400',
    title: 'Info',
  },
}

// ── Single Toast item ─────────────────────────────────────────────────────────
function ToastItem({ id, message, variant = 'error', onDismiss }) {
  const { Icon, bg, border, icon, title } = VARIANTS[variant] ?? VARIANTS.error

  return (
    <div
      className={`toast-enter flex items-start gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-xl max-w-sm w-full ${bg} ${border}`}
      role="alert"
    >
      <Icon size={18} className={`mt-0.5 shrink-0 ${icon}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-0.5">
          {title}
        </p>
        <p className="text-sm text-slate-200 leading-relaxed break-words">{message}</p>
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  )
}

// ── Provider ──────────────────────────────────────────────────────────────────
let _nextId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, variant = 'error', duration = 4500) => {
    const id = ++_nextId
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration)
  }, [])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Portal-like fixed container */}
      <div
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem {...t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
