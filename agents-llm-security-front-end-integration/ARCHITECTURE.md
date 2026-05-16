# Frontend Architecture & Components Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER BROWSER                            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                   React Application                      ││
│  │                    (Vite Dev Server)                     ││
│  │  ┌──────────────────────────────────────────────────┐   ││
│  │  │              App Component                       │   ││
│  │  │  ┌────────────────────────────────────────────┐ │   ││
│  │  │  │  Tab Navigation                           │ │   ││
│  │  │  │  ✓ Playground   ✓ Batch Analyzer        │ │   ││
│  │  │  └────────────────────────────────────────────┘ │   ││
│  │  │                    ↓                            │   ││
│  │  │  ┌────────────────────────────────────────────┐ │   ││
│  │  │  │  PLAYGROUND TAB          CONFIG SIDEBAR   │ │   ││
│  │  │  │  ┌──────────────────┐  ┌──────────────┐  │ │   ││
│  │  │  │  │ Raw Prompt       │  │ Thresholds   │  │ │   ││
│  │  │  │  │ ┌──────────────┐ │  │ Weights      │  │ │   ││
│  │  │  │  │ │              │ │  │ Entity Types │  │ │   ││
│  │  │  │  │ │ [textarea]   │ │  │              │  │ │   ││
│  │  │  │  │ │              │ │  └──────────────┘  │ │   ││
│  │  │  │  │ └──────────────┘ │                    │ │   ││
│  │  │  │  │ Analyze Prompt   │                    │ │   ││
│  │  │  │  │ [Ctrl+Enter]     │                    │ │   ││
│  │  │  │  │ Samples: ✓✓✓✓   │                    │ │   ││
│  │  │  │  └──────────────────┘                    │ │   ││
│  │  │  │         ↓ API Call ↓                     │ │   ││
│  │  │  │  ┌──────────────────┐                    │ │   ││
│  │  │  │  │ Analysis Results │                    │ │   ││
│  │  │  │  │ ✅ ALLOWED       │                    │ │   ││
│  │  │  │  │ Score: 0.001     │                    │ │   ││
│  │  │  │  │ Latency: 59.8ms  │                    │ │   ││
│  │  │  │  │ Sanitized: [...]  │                    │ │   ││
│  │  │  │  └──────────────────┘                    │ │   ││
│  │  │  └────────────────────────────────────────────┘ │   ││
│  │  │                    OR                           │   ││
│  │  │  ┌────────────────────────────────────────────┐ │   ││
│  │  │  │  BATCH ANALYZER TAB                        │ │   ││
│  │  │  │  ┌──────────────────────────────────────┐ │ │   ││
│  │  │  │  │ [Prompt 1] → Run → ✓ ALLOW          │ │ │   ││
│  │  │  │  │ [Prompt 2] → Run → 🛑 BLOCK         │ │ │   ││
│  │  │  │  │ [Prompt 3] → Run → 🏷️ MASK          │ │ │   ││
│  │  │  │  │ ...                                 │ │ │   ││
│  │  │  │  │ [Analyze All] [Export CSV]          │ │ │   ││
│  │  │  │  └──────────────────────────────────────┘ │ │   ││
│  │  │  └────────────────────────────────────────────┘ │   ││
│  │  └──────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  HTTP Requests (Axios)                              │   │
│  │  POST /analyze    GET /health    GET /config        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
          ↓ Vite Dev Proxy ↓
┌─────────────────────────────────────────────────────────────┐
│                 FastAPI Backend                              │
│           (http://127.0.0.1:8000)                            │
│                                                              │
│  POST /analyze                 GET /health                  │
│  ├─ Injection Detection        ├─ Status: "ok"             │
│  ├─ Presidio PII Scanner       ├─ Injection threshold      │
│  ├─ Policy Engine              └─ Presidio threshold       │
│  └─ Return results                                          │
│                                 GET /config                 │
│                                 ├─ Thresholds              │
│                                 ├─ Weights                 │
│                                 └─ Entity types            │
└─────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
<ToastProvider>
  └─ <App>
     ├─ <HealthBar />
     │  └─ useHealth() → polls /health every 15s
     │
     ├─ Tab Navigation
     │  ├─ Playground Tab
     │  │  ├─ <Playground />
     │  │  │  ├─ useAnalyze()
     │  │  │  ├─ useState(prompt)
     │  │  │  ├─ <ResultsPanel />
     │  │  │  │  ├─ <DecisionBadge decision={result.decision} />
     │  │  │  │  ├─ <ScoreGauge score={result.injection_score} />
     │  │  │  │  ├─ <EntityTag entity={entity} /> (map)
     │  │  │  │  └─ <LatencyCard latency={result.latency} />
     │  │  │  └─ Sample buttons
     │  │  │
     │  │  └─ <ConfigPanel />
     │  │     └─ useConfig() → fetches /config once
     │  │
     │  └─ Batch Analyzer Tab
     │     ├─ <BatchAnalyzer />
     │     │  ├─ useState(prompts[])
     │     │  ├─ useAnalyze() (per prompt)
     │     │  ├─ Prompt list
     │     │  ├─ Analyze All button
     │     │  └─ Export CSV button
     │     │
     │     └─ <ConfigPanel /> (shared)
     │
     └─ <Toast /> (portal)
        └─ Toast notifications
```

## Data Flow

### Playground Analysis Flow

```
User Types Prompt
        ↓
[onChange] → setPrompt()
        ↓
Display in textarea
        ↓
User Clicks "Analyze Prompt" or Ctrl+Enter
        ↓
handleAnalyze() → useAnalyze()
        ↓
analyze(prompt) → axiox POST /api/analyze
        ↓
Backend Processing:
  1. Injection Detection (~10-30ms)
  2. Presidio PII Scan (~40-150ms)
  3. Policy Decision (~1-5ms)
        ↓
Response: {
  decision: "allow"|"mask"|"block",
  injection_score: 0.0-1.0,
  pii_detected: number,
  entities: [{entity_type, score}],
  sanitized: string,
  timestamp: ISO-8601,
  latency: {...}
}
        ↓
setResult(data) → state updated
        ↓
<ResultsPanel /> re-renders:
  - DecisionBadge animation
  - ScoreGauge animation
  - EntityTag list
  - LatencyCard display
        ↓
Display to user
```

### Health Polling Flow

```
App Mount
    ↓
useHealth() → getHealth()
    ↓
Set up interval (15 seconds)
    ↓
Every 15s:
  axios GET /health
    ↓
  Response: {
    status: "ok",
    injection_threshold: 0.48,
    presidio_score_threshold: 0.4
  }
    ↓
  setHealth(data)
  setIsOnline(true/false)
    ↓
  <HealthBar /> renders:
    - Status badge (Online/Offline)
    - Pulsing dot
    - Thresholds in header
    ↓
On cleanup: clearInterval()
```

## Component Details

### Playground Component
**Props**: `{ injectionThreshold: number }`
**State**:
- `prompt: string` - User input
- `animKey: number` - Re-trigger animation
**Hooks**:
- `useAnalyze()` - Manage analysis
- `useToast()` - Show errors
**Features**:
- Textarea with char counter
- Sample prompt buttons
- Analyze button (disabled if empty)
- Clear button
- Ctrl+Enter shortcut

### ResultsPanel Component
**Props**: 
- `result: AnalyzeResponse | null`
- `loading: boolean`
- `error: string | null`
- `injectionThreshold: number`
- `animKey: number`
**States**: idle → loading → result/error
**Sub-components**:
- DecisionBadge
- ScoreGauge
- EntityTag (map)
- LatencyCard
- Copy button

### BatchAnalyzer Component
**Props**: `{ initialBatch?: string }`
**State**:
- `prompts: string[]` - List of prompts
- `results: object` - Results by index
- `loading: object` - Loading state by index
**Features**:
- Add prompt input
- Analyze button per prompt
- Analyze All button
- Export CSV button
- Remove prompt button
- Clear all button

### HealthBar Component
**Props**: None
**Hooks**: `useHealth()`
**Display**:
- Logo and branding
- Status badge (Online/Offline)
- Thresholds
- API docs link
- Auto-updates every 15s

### ConfigPanel Component
**Props**: None
**Hooks**: `useConfig()`
**Sections**:
- Thresholds display
- Injection weights breakdown
- Masked entity types list
- Loading skeleton state

## API Request/Response Examples

### POST /analyze

**Request**:
```javascript
{
  "prompt": "What is Python?"
}
```

**Response (ALLOW)**:
```javascript
{
  "decision": "allow",
  "injection_score": 0.001,
  "pii_detected": 0,
  "entities": [],
  "sanitized": "What is Python?",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "latency": {
    "injection_ms": 12.5,
    "presidio_ms": 45.2,
    "policy_ms": 2.1,
    "total_ms": 59.8
  }
}
```

**Response (MASK)**:
```javascript
{
  "decision": "mask",
  "injection_score": 0.001,
  "pii_detected": 2,
  "entities": [
    { "entity_type": "PERSON", "score": 0.95 },
    { "entity_type": "EMAIL_ADDRESS", "score": 0.98 }
  ],
  "sanitized": "My name is [PERSON] and email is [EMAIL_ADDRESS]",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "latency": { ... }
}
```

**Response (BLOCK)**:
```javascript
{
  "decision": "block",
  "injection_score": 0.92,
  "pii_detected": 0,
  "entities": [],
  "sanitized": "[Request blocked]",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "latency": { ... }
}
```

## File Organization

```
src/
├── App.jsx                              # Main app with tabs
│
├── components/
│   ├── Playground.jsx                   # Prompt analyzer
│   ├── ResultsPanel.jsx                 # Results display
│   ├── AuditLog.jsx                     # Request history
│   ├── BatchAnalyzer.jsx                # Batch testing
│   │
│   ├── HealthBar.jsx                    # Top navigation
│   ├── ConfigPanel.jsx                  # Config display
│   │
│   ├── DecisionBadge.jsx                # Status badge
│   ├── ScoreGauge.jsx                   # Score visualization
│   ├── EntityTag.jsx                    # PII chips
│   ├── LatencyCard.jsx                  # Latency display
│   │
│   └── Toast.jsx                        # Notifications
│
├── hooks/
│   ├── useGateway.js                    # API hooks
│   │   ├── useAnalyze()
│   │   ├── useHealth()
│   │   └── useConfig()
│   │
│   └── useLocalStorage.js               # Storage hook
│
├── api/
│   └── gateway.js                       # Axios client
│       ├── analyzePrompt()
│       ├── getHealth()
│       └── getConfig()
│
├── index.css                            # Tailwind + animations
└── main.jsx                             # React entry point
```

## Styling Architecture

```
index.css
├── Google Fonts Import
│   ├── Inter (sans)
│   └── JetBrains Mono (mono)
│
├── Tailwind CSS v4
│   └── @import "tailwindcss"
│
├── Design Tokens
│   ├── Colors (allow, mask, block)
│   └── Gradients
│
├── Keyframe Animations
│   ├── pulse-dot (health status)
│   ├── shimmer (loading)
│   ├── slide-in-right (toast)
│   ├── gauge-fill (score animation)
│   ├── badge-pop (decision badge)
│   ├── fade-up (results)
│   └── spin (loading spinner)
│
└── Utility Classes
    ├── .glass (frosted glass)
    ├── .glow-* (color glows)
    ├── .text-gradient
    └── .mono (monospace)
```

## Error Handling Flow

```
User submits prompt
    ↓
try {
  axios POST /analyze
} catch (error) {
    ↓
    Extract friendlyMessage
    ├─ error.response?.data?.detail
    ├─ error.response?.data?.message
    ├─ Timeout → "Request timed out"
    └─ Other → "Unknown network error"
    ↓
    setError(friendlyMessage)
    ↓
    useEffect fires
    ↓
    showToast(error, 'error')
    ↓
    User sees toast notification
    ↓
    Auto-dismiss after 4.5s
}
```

## Responsive Design Breakpoints

```
Mobile (<640px)
├─ Single column layout
├─ Full-width components
├─ Touch-friendly buttons
└─ Stack sidebar below

Tablet (640px-1024px)
├─ Still responsive
├─ Larger text
└─ Optimized spacing

Desktop (1024px+)
├─ Split-screen playground
├─ Sidebar on right
└─ Full feature display

Extra Large (1920px+)
├─ Max-width container
└─ Centered layout
```

## Performance Optimizations

1. **Memoization**
   - useCallback for event handlers
   - useMemo for derived values

2. **Lazy Loading**
   - Components load on demand
   - API calls only when needed

3. **Bundling**
   - Vite tree-shaking
   - CSS purging with Tailwind
   - ~150KB gzipped total

4. **Network**
   - 30s request timeout
   - Error retry logic ready
   - Efficient response parsing

5. **Rendering**
   - Key props on lists
   - Controlled components
   - Proper dependency arrays

---

## Integration Status

✅ Frontend fully integrated with FastAPI backend
✅ All API endpoints operational
✅ Error handling in place
✅ Real-time health monitoring
✅ Production-ready architecture

**Ready for deployment!**
