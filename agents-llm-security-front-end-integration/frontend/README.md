# LLM Security Gateway Frontend

A modern React + Vite frontend for the LLM Security Gateway prompt firewall. Provides real-time analysis of user prompts for injection detection, PII scanning, and policy enforcement.

## Features

### 🔍 Interactive Playground
- Real-time prompt analysis through a split-screen interface
- Live injection score gauge with visual indicators
- PII entity detection and anonymization preview
- Per-stage latency breakdown (injection detection, Presidio scan, policy engine)
- Quick sample prompts for common test cases
- Ctrl+Enter keyboard shortcut for quick submission

### 📊 Batch Analyzer
- Test multiple prompts simultaneously
- Export results as CSV for reporting
- Quick access to sample payloads
- Real-time status tracking

### 📋 Configuration Display
- Live gateway configuration viewer
- Injection detection weights breakdown
- Presidio confidence thresholds
- Entity type masking rules

### 🎨 Design
- Dark mode optimized for security context
- Responsive design (mobile, tablet, desktop)
- Smooth animations and transitions
- Accessible components (WCAG compliant)
- Real-time gateway health status

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- LLM Security Gateway backend running (default: `http://127.0.0.1:8000`)

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173` with hot-reload enabled.

**Note:** API requests are proxied through Vite (see `vite.config.js`), so the backend should be running at `http://127.0.0.1:8000`.

### Build

```bash
npm run build
```

Optimized production build in `dist/` folder.

### Preview

```bash
npm run preview
```

Locally preview the production build.

### Lint

```bash
npm run lint
```

## Project Structure

```
src/
├── App.jsx                 # Main app with tab navigation
├── index.css              # Tailwind + custom animations
├── main.jsx               # React entry point
├── api/
│   └── gateway.js         # Axios client for backend API
├── components/
│   ├── App.jsx            # Main layout
│   ├── Playground.jsx     # Split-screen prompt tester
│   ├── ResultsPanel.jsx   # Analysis results display
│   ├── BatchAnalyzer.jsx  # Multi-prompt testing
│   ├── DecisionBadge.jsx  # Allow/Mask/Block badge
│   ├── ScoreGauge.jsx     # Injection score visualizer
│   ├── EntityTag.jsx      # PII entity chips
│   ├── LatencyCard.jsx    # Performance metrics
│   ├── HealthBar.jsx      # Top nav with gateway status
│   ├── ConfigPanel.jsx    # Configuration sidebar
│   ├── AuditLog.jsx       # Request history
│   └── Toast.jsx          # Notification system
└── hooks/
    ├── useGateway.js      # useAnalyze, useHealth, useConfig
    └── useLocalStorage.js # localStorage integration
```

## Key Components

### Playground
The main interactive interface. Accepts a prompt, sends it to the backend, and displays:
- **Decision** — Allow, Mask, or Block
- **Injection Score** — 0.0–1.0 (colored gauge)
- **PII Entities** — Detected entity types with confidence scores
- **Sanitized Output** — Anonymized prompt
- **Latency Breakdown** — Per-stage timing

### Batch Analyzer
Test multiple prompts in parallel. Export results as CSV for security audits or testing reports.

### ConfigPanel
Displays live gateway configuration:
- Injection detection thresholds and weights
- Presidio PII scoring thresholds
- Entity masking rules

## API Integration

All API calls go through `src/api/gateway.js` which exports:

```javascript
analyzePrompt(prompt)   // POST /analyze
getHealth()             // GET /health
getConfig()             // GET /config
```

**Development:** Requests hit `http://localhost:5173/api/*` which Vite proxies to `http://127.0.0.1:8000/*`

**Production:** Set `VITE_API_BASE_URL` environment variable to your deployed backend.

## Environment Variables

Create a `.env` file (see `.env.example`):

```bash
VITE_API_BASE_URL=http://my-gateway-api.com  # Production backend URL
```

## Styling

Uses **Tailwind CSS v4** with Vite integration (no PostCSS needed). Custom utilities:

- `.glass` — Frosted glass morphism effect
- `.text-gradient` — Animated gradient text
- `.glow-*` — Color-matched glow effects
- `.mono` — Monospace font stack

## Animations

Smooth keyframe animations for:
- Badge pop-in on results
- Gauge fill on score display
- Skeleton shimmer while loading
- Toast slide-in/out notifications
- Pulse dot for health status

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Performance

- Lazy component rendering
- Memoized API client
- Efficient re-renders with React hooks
- CSS containment for animations
- ~150KB gzipped bundle size

## Accessibility

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader friendly
- Color contrast WCAG AA compliant

## Error Handling

Network errors are caught and displayed as toast notifications with user-friendly messages:
- Connection timeouts
- API errors
- Validation failures

Backend errors are extracted from response and shown to users.

## Security

- No credentials stored in localStorage (config only)
- CORS handled by backend
- Input sanitization before display
- CSP-compatible (no inline scripts)

## Development Tips

### Hot Reload
Edit any `.jsx` or `.css` file and changes appear instantly in the browser.

### Debug Mode
Open browser DevTools to inspect:
- Network requests in Network tab
- Component tree in React DevTools
- Console for error logs

### Testing
Use sample prompts to test different scenarios:
- ✅ Safe: Normal user questions
- 🏷️ PII: Personal data in prompts
- 💉 Injection: Prompt injection attempts
- 🔑 API Key: Credential leak attempts

## Deployment

### Static Hosting (Vercel, Netlify, GitHub Pages)

```bash
npm run build
# Deploy dist/ folder
```

### Docker

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

### Environment for Production

Set `VITE_API_BASE_URL` to your deployed backend URL during build or at runtime:

```bash
VITE_API_BASE_URL=https://api.mygateway.com npm run build
```

## Troubleshooting

**Q: "Cannot find module 'axios'"**  
A: Run `npm install` to install dependencies.

**Q: Backend returns 404 for /health**  
A: Ensure the FastAPI backend is running at `http://127.0.0.1:8000`.

**Q: CORS errors in console**  
A: The backend's CORS middleware must allow your frontend origin. Check `main.py`.

**Q: Vite proxy not working**  
A: Restart the dev server with `npm run dev`.

**Q: Tailwind styles not appearing**  
A: Check `index.css` is imported in `main.jsx` and Vite is running.

## Future Enhancements

- [ ] Audit log persistence (localStorage or backend)
- [ ] User authentication and session tracking
- [ ] Advanced filtering and search in batch results
- [ ] Prompt templates library
- [ ] Dark/light theme toggle
- [ ] Keyboard shortcuts guide overlay
- [ ] Export to JSON, Markdown, PDF
- [ ] Real-time gateway metrics dashboard
- [ ] Customizable alert thresholds
- [ ] Prompt injection pattern editor

## Contributing

1. Keep components small and focused
2. Use consistent naming (PascalCase for components)
3. Add JSDoc comments for props
4. Test responsiveness on mobile
5. Follow Tailwind utility-first approach

## License

See root LICENSE file.

