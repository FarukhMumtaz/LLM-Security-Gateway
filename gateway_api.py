"""
gateway_api.py
--------------
FastAPI gateway entry point. Use this file when running the backend API.
Run with: uvicorn gateway_api:app --reload
"""

import time
import yaml
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import injection_detector
import presidio_module
import policy

# ── Load config ───────────────────────────────────────────────────────────────
_cfg_path = Path(__file__).parent / "config.yaml"
with open(_cfg_path, encoding="utf-8") as f:
    _cfg = yaml.safe_load(f)

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="LLM Security Gateway",
    description=(
        "A modular security gateway that detects prompt injection, "
        "jailbreak attempts, and PII before forwarding to an LLM backend."
    ),
    version="1.0.0",
)

# NOTE: allow_origins=["*"] is fine for local dev/testing.
# In production, replace "*" with your actual frontend origin(s), e.g.:
#   allow_origins=["https://yourdomain.com"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request / Response models ─────────────────────────────────────────────────
class PromptRequest(BaseModel):
    prompt: str = Field(
        ...,
        min_length=1,
        max_length=8000,
        description="The user prompt to analyze",
        example="What is the capital of France?",
    )


class LatencyBreakdown(BaseModel):
    injection_ms: float
    presidio_ms:  float
    policy_ms:    float
    total_ms:     float


class AnalyzeResponse(BaseModel):
    decision:        str
    injection_score: float
    pii_detected:    int
    entities:        list
    sanitized:       str
    timestamp:       str
    latency:         LatencyBreakdown


# ── Main endpoint ─────────────────────────────────────────────────────────────
@app.post("/analyze", response_model=AnalyzeResponse, tags=["Gateway"])
async def analyze(req: PromptRequest):
    prompt = req.prompt.strip()

    t0 = time.perf_counter()
    inj_score = injection_detector.score(prompt)
    t1 = time.perf_counter()

    presidio_result = presidio_module.analyze_and_anonymize(prompt)
    pii_entities = presidio_result["raw_entities"]
    anonymized = presidio_result["anonymized"]
    t2 = time.perf_counter()

    decision, forwarded = policy.decide(
        injection_score=inj_score,
        pii_entities=pii_entities,
        original_prompt=prompt,
        anonymized_prompt=anonymized,
    )
    t3 = time.perf_counter()

    summary = policy.get_summary(
        decision=decision,
        injection_score=inj_score,
        pii_entities=pii_entities,
        original_prompt=prompt,
        anonymized_prompt=forwarded,
    )

    latency = LatencyBreakdown(
        injection_ms=round((t1 - t0) * 1000, 2),
        presidio_ms= round((t2 - t1) * 1000, 2),
        policy_ms=   round((t3 - t2) * 1000, 2),
        total_ms=    round((t3 - t0) * 1000, 2),
    )

    return AnalyzeResponse(
        decision=        summary["decision"],
        injection_score= summary["injection_score"],
        pii_detected=    summary["pii_detected"],
        entities=        summary["entities"],
        sanitized=       summary["sanitized"],
        timestamp=       summary["timestamp"],
        latency=         latency,
    )


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health():
    return {
        "status": "ok",
        "injection_threshold": _cfg["injection"]["threshold"],
        "presidio_score_threshold": _cfg["presidio"]["score_threshold"],
    }


# ── Config endpoint (read-only) ─────────────────────────────────────────────────
@app.get("/config", tags=["System"])
async def get_config():
    return {
        "injection_threshold":      _cfg["injection"]["threshold"],
        "injection_weights":        _cfg["injection"]["weights"],
        "presidio_score_threshold": _cfg["presidio"]["score_threshold"],
        "mask_entities":            _cfg["policy"]["mask_entities"],
    }


# ── Run directly ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("gateway_api:app", host="0.0.0.0", port=8000, reload=True)
