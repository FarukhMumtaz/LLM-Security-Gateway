/**
 * hooks/useGateway.js
 * ───────────────────
 * Three custom React hooks that encapsulate all backend communication:
 *
 *  useAnalyze()  — one-shot POST /analyze with loading / error state
 *  useHealth()   — polls GET /health every POLL_INTERVAL ms
 *  useConfig()   — fetches GET /config once on mount
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { analyzePrompt, getHealth, getConfig } from '../api/gateway'

const HEALTH_POLL_INTERVAL = 15_000 // 15 seconds

// ── useAnalyze ────────────────────────────────────────────────────────────────
/**
 * Manages state for a single prompt-analysis request.
 *
 * @returns {{
 *   result:   Object|null,
 *   loading:  boolean,
 *   error:    string|null,
 *   analyze:  (prompt: string) => Promise<void>,
 *   reset:    () => void,
 * }}
 */
export function useAnalyze() {
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const analyze = useCallback(async (prompt) => {
    setLoading(true)
    setError(null)
    try {
      const data = await analyzePrompt(prompt)
      setResult(data)
    } catch (err) {
      setError(err.friendlyMessage ?? 'Analysis failed. Is the gateway running?')
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { result, loading, error, analyze, reset }
}

// ── useHealth ─────────────────────────────────────────────────────────────────
/**
 * Polls GET /health on mount and every HEALTH_POLL_INTERVAL ms.
 *
 * @returns {{
 *   health:   Object|null,
 *   isOnline: boolean,
 *   checking: boolean,
 * }}
 */
export function useHealth() {
  const [health, setHealth]     = useState(null)
  const [isOnline, setIsOnline] = useState(false)
  const [checking, setChecking] = useState(true)
  const intervalRef = useRef(null)

  const fetchHealth = useCallback(async () => {
    try {
      const data = await getHealth()
      setHealth(data)
      setIsOnline(data?.status === 'ok')
    } catch {
      setIsOnline(false)
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth()
    intervalRef.current = setInterval(fetchHealth, HEALTH_POLL_INTERVAL)
    return () => clearInterval(intervalRef.current)
  }, [fetchHealth])

  return { health, isOnline, checking }
}

// ── useConfig ─────────────────────────────────────────────────────────────────
/**
 * Fetches GET /config once on mount.
 *
 * @returns {{
 *   config:        Object|null,
 *   configLoading: boolean,
 *   configError:   string|null,
 * }}
 */
export function useConfig() {
  const [config, setConfig]                   = useState(null)
  const [configLoading, setConfigLoading]     = useState(true)
  const [configError, setConfigError]         = useState(null)

  useEffect(() => {
    getConfig()
      .then(setConfig)
      .catch((err) =>
        setConfigError(err.friendlyMessage ?? 'Could not load config')
      )
      .finally(() => setConfigLoading(false))
  }, [])

  return { config, configLoading, configError }
}
