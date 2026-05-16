/**
 * api/gateway.js
 * ──────────────
 * Axios service layer for the LLM Security Gateway backend.
 *
 * All requests hit the Vite dev-proxy at `/api/*` which is rewritten
 * to `http://127.0.0.1:8000/*` — keeping requests same-origin in dev.
 * In production, set VITE_API_BASE_URL to your deployed backend URL.
 */

import axios from 'axios'

// ── Axios instance ────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const gatewayClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Response interceptor: normalize errors ────────────────────────────────────
gatewayClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Attach a human-readable message to every rejected promise
    const message =
      error.response?.data?.detail ??
      error.response?.data?.message ??
      (error.code === 'ECONNABORTED'
        ? 'Request timed out — is the gateway running?'
        : error.message ?? 'Unknown network error')

    return Promise.reject({ ...error, friendlyMessage: message })
  },
)

// ── API helpers ───────────────────────────────────────────────────────────────

/**
 * POST /analyze
 * Sends a raw user prompt through the full security pipeline.
 *
 * @param {string} prompt - The user prompt text (1–8000 chars).
 * @returns {Promise<AnalyzeResponse>}
 *
 * @typedef {Object} AnalyzeResponse
 * @property {string}          decision        - "allow" | "mask" | "block"
 * @property {number}          injection_score - 0.0–1.0
 * @property {number}          pii_detected    - count of PII entities found
 * @property {Array<Object>}   entities        - raw Presidio entity objects
 * @property {string}          sanitized       - cleaned / anonymized prompt
 * @property {string}          timestamp       - ISO 8601 string
 * @property {LatencyBreakdown} latency
 *
 * @typedef {Object} LatencyBreakdown
 * @property {number} injection_ms
 * @property {number} presidio_ms
 * @property {number} policy_ms
 * @property {number} total_ms
 */
export async function analyzePrompt(prompt) {
  const { data } = await gatewayClient.post('/analyze', { prompt })
  return data
}

/**
 * GET /health
 * Returns gateway status and current threshold configuration.
 *
 * @returns {Promise<{status: string, injection_threshold: number, presidio_score_threshold: number}>}
 */
export async function getHealth() {
  const { data } = await gatewayClient.get('/health')
  return data
}

/**
 * GET /config
 * Returns the full gateway configuration (thresholds, weights, mask entities).
 *
 * @returns {Promise<ConfigResponse>}
 *
 * @typedef {Object} ConfigResponse
 * @property {number}         injection_threshold
 * @property {Object}         injection_weights       - { keyword, pattern, sysextract, encoding }
 * @property {number}         presidio_score_threshold
 * @property {Array<string>}  mask_entities
 */
export async function getConfig() {
  const { data } = await gatewayClient.get('/config')
  return data
}
