/**
 * App.jsx
 * ────────
 * Root application component with tabbed interface.
 *
 * Layout:
 *  ┌─────────────────────────────────────────────────────┐
 *  │ HealthBar  (sticky top nav)                         │
 *  ├─────────────────────────────────────────────────────┤
 *  │ Tab navigation                                      │
 *  ├─────────────────────────────────────────────────────┤
 *  │ main (Dynamic content based on active tab)          │
 *  │  ┌────────────────────────┐  ┌──────────────────┐  │
 *  │  │  Tab Content (flex-1)  │  │  ConfigPanel     │  │
 *  │  │                        │  │  (sidebar lg+)   │  │
 *  │  └────────────────────────┘  └──────────────────┘  │
 *  └─────────────────────────────────────────────────────┘
 *
 * ToastProvider wraps everything so any child component can fire toasts.
 */

import { useState } from 'react'
import { ToastProvider } from './components/Toast'
import HealthBar         from './components/HealthBar'
import ConfigPanel       from './components/ConfigPanel'
import Playground        from './components/Playground'
import BatchAnalyzer     from './components/BatchAnalyzer'
import { useHealth }     from './hooks/useGateway'

const TABS = [
  { id: 'playground', label: '🔍 Playground', icon: 'playground' },
  { id: 'batch', label: '📊 Batch Analyzer', icon: 'batch' },
]

// Inner layout — needs access to useHealth for injectionThreshold prop
function AppLayout() {
  const { health } = useHealth()
  const [activeTab, setActiveTab] = useState('playground')

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky top navigation with live health status */}
      <HealthBar />

      {/* Hero gradient background blob */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden -z-10"
      >
        <div
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}
        />
      </div>

      {/* Tab navigation */}
      <div className="border-b border-slate-700/50 bg-slate-900/40 px-4 sm:px-6 sticky top-16 z-30">
        <div className="mx-auto max-w-screen-xl">
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 mx-auto w-full max-w-screen-xl px-4 sm:px-6 py-6">

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Security{' '}
            <span className="text-gradient">
              {activeTab === 'playground' ? 'Playground' : 'Batch Analyzer'}
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {activeTab === 'playground'
              ? 'Test prompts through the injection detection, PII scanning, and policy engine pipeline.'
              : 'Analyze multiple prompts at once and export results as CSV.'}
          </p>
        </div>

        {/* Content row: active tab + config sidebar */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Content takes all remaining space */}
          <div className="flex-1 min-w-0 flex flex-col">
            {activeTab === 'playground' && (
              <Playground injectionThreshold={health?.injection_threshold} />
            )}
            {activeTab === 'batch' && (
              <div className="glass rounded-2xl border border-slate-700/50 h-[600px]">
                <BatchAnalyzer />
              </div>
            )}
          </div>

          {/* Config sidebar — hidden on mobile, shown at lg+ */}
          <ConfigPanel />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4">
        <p className="text-center text-[11px] text-slate-700 mono">
          LLM Security Gateway v1.0.0 · FastAPI ·{' '}
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-500 transition-colors"
          >
            API Docs ↗
          </a>
        </p>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppLayout />
    </ToastProvider>
  )
}
