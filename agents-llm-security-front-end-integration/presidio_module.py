"""
presidio_module.py
------------------
Presidio-based PII detection with customizations:
  1. Custom recognizer — API keys and Employee IDs
  2. Context-aware scoring — phone patterns + keyword context
  3. Composite entity detection — PERSON + EMAIL => PII_COMPOSITE
  4. Confidence calibration — mild score shaping for policy thresholds
"""

import yaml
from pathlib import Path
from typing import List, Optional

from presidio_analyzer import (
    AnalyzerEngine,
    RecognizerRegistry,
    PatternRecognizer,
    Pattern,
    RecognizerResult,
)
from presidio_analyzer.nlp_engine import NlpEngineProvider
from presidio_anonymizer import AnonymizerEngine
from presidio_anonymizer.entities import OperatorConfig

# ── Load config ───────────────────────────────────────────────────────────────
_cfg_path = Path(__file__).parent / "config.yaml"
with open(_cfg_path, encoding="utf-8") as f:
    _cfg = yaml.safe_load(f)

_LANG            = _cfg["presidio"]["language"]
_SCORE_THRESHOLD = _cfg["presidio"]["score_threshold"]
_PHONE_BOOST     = _cfg["presidio"]["phone_context_boost"]
_CALIB_API       = float(_cfg["presidio"].get("calibrate_api_key", 1.0))
_CALIB_CUSTOM    = float(_cfg["presidio"].get("calibrate_custom_entities", 1.0))

# ── 1. Custom Recognizer — API Keys ───────────────────────────────────────────
api_key_recognizer = PatternRecognizer(
    supported_entity="API_KEY",
    name="ApiKeyRecognizer",
    supported_language="en",
    patterns=[
        Pattern(
            name="openai_style_key",
            regex=r"\bsk-[a-zA-Z0-9]{20,}\b",
            score=0.95,
        ),
        Pattern(
            name="generic_api_key",
            regex=r"\b(api[_-]?key|apikey|access[_-]?token)\s*[:=]\s*['\"]?[a-zA-Z0-9\-_]{16,}['\"]?",
            score=0.85,
        ),
        Pattern(
            name="bearer_token",
            regex=r"\bBearer\s+[a-zA-Z0-9\-_\.]{20,}\b",
            score=0.90,
        ),
    ],
    context=["key", "token", "secret", "api", "bearer", "authorization"],
)

# ── 1. Custom Recognizer — Employee IDs ──────────────────────────────────────
employee_id_recognizer = PatternRecognizer(
    supported_entity="EMPLOYEE_ID",
    name="EmployeeIdRecognizer",
    supported_language="en",
    patterns=[
        Pattern(
            name="emp_id_standard",
            regex=r"\bEMP-\d{5}\b",
            score=0.90,
        ),
        Pattern(
            name="emp_id_variant",
            regex=r"\b(EMP|STAFF|HR)-[0-9]{4,6}\b",
            score=0.85,
        ),
    ],
    context=["employee", "staff", "worker", "id", "code", "number", "personnel"],
)

# ── 2. Context-Aware Phone Recognizer ────────────────────────────────────────
context_phone_recognizer = PatternRecognizer(
    supported_entity="PHONE_NUMBER",
    name="ContextPhoneRecognizer",
    supported_language="en",
    patterns=[
        Pattern(
            name="pk_phone",
            regex=r"\b((\+92|0092|0)?3[0-9]{2}[-\s]?[0-9]{7})\b",
            score=0.75,
        ),
        Pattern(
            name="intl_phone",
            regex=r"\+?[0-9]{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}",
            score=0.65,
        ),
        Pattern(
            name="local_phone",
            regex=r"\b0[0-9]{2,3}[-\s][0-9]{6,7}\b",
            score=0.60,
        ),
    ],
    context=["phone", "call", "mobile", "cell", "contact", "number",
             "reach", "dial", "whatsapp", "tel", "telephone"],
)


# ── 3. Composite Entity Detection ────────────────────────────────────────────
# Defined BEFORE analyze() — no NameError
def _calibrate_scores(results: List[RecognizerResult]) -> List[RecognizerResult]:
    """Slight confidence shaping for custom / high-risk entity types (reportable)."""
    out: List[RecognizerResult] = []
    for r in results:
        s = r.score
        if r.entity_type == "API_KEY":
            s = min(1.0, s * _CALIB_API)
        elif r.entity_type in ("EMPLOYEE_ID", "PHONE_NUMBER"):
            s = min(1.0, s * _CALIB_CUSTOM)
        out.append(
            RecognizerResult(
                entity_type=r.entity_type,
                start=r.start,
                end=r.end,
                score=s,
            )
        )
    return out


def _detect_composite(text: str, results: List[RecognizerResult]) -> List[RecognizerResult]:
    """
    If both PERSON and EMAIL_ADDRESS appear together, flag as PII_COMPOSITE.
    The composite is kept only as a metadata flag — it is NOT passed to the
    anonymizer so it never replaces the whole text.
    """
    entity_types = {r.entity_type for r in results}
    if "PERSON" in entity_types and "EMAIL_ADDRESS" in entity_types:
        composite = RecognizerResult(
            entity_type="PII_COMPOSITE",
            start=0,
            end=len(text),
            score=0.95,
        )
        results = list(results) + [composite]
    return results


# ── Build Analyzer Engine ─────────────────────────────────────────────────────
def _build_analyzer() -> AnalyzerEngine:
    # BUG FIX: en_core_web_lg is hardcoded — if it's not installed the whole
    # gateway crashes at import time with a cryptic OSError. Now we try lg first
    # and fall back to sm, with a clear error message if neither is present.
    _PRIMARY_MODEL   = "en_core_web_lg"
    _FALLBACK_MODEL  = "en_core_web_sm"
    import spacy
    if spacy.util.is_package(_PRIMARY_MODEL):
        model_name = _PRIMARY_MODEL
    elif spacy.util.is_package(_FALLBACK_MODEL):
        import warnings
        warnings.warn(
            f"{_PRIMARY_MODEL} not found — falling back to {_FALLBACK_MODEL}. "
            "NER accuracy may be lower. Install the large model with:\n"
            f"  python -m spacy download {_PRIMARY_MODEL}",
            RuntimeWarning,
            stacklevel=2,
        )
        model_name = _FALLBACK_MODEL
    else:
        raise OSError(
            f"No spaCy English model found. Install one with:\n"
            f"  python -m spacy download {_PRIMARY_MODEL}"
        )

    configuration = {
        "nlp_engine_name": "spacy",
        "models": [{"lang_code": "en", "model_name": model_name}],
    }
    provider = NlpEngineProvider(nlp_configuration=configuration)
    nlp_engine = provider.create_engine()

    registry = RecognizerRegistry()
    registry.load_predefined_recognizers(nlp_engine=nlp_engine)

    try:
        registry.remove_recognizer("PhoneRecognizer")
    except Exception:
        pass

    registry.add_recognizer(api_key_recognizer)
    registry.add_recognizer(employee_id_recognizer)
    registry.add_recognizer(context_phone_recognizer)

    return AnalyzerEngine(
        registry=registry,
        nlp_engine=nlp_engine,
        supported_languages=[_LANG],
    )


# ── Initialize engines once at import time ───────────────────────────────────
_analyzer   = _build_analyzer()
_anonymizer = AnonymizerEngine()


# ── Public API ────────────────────────────────────────────────────────────────
def analyze(text: str) -> List[RecognizerResult]:
    """Detect PII entities. Returns results including composite flag."""
    results = _analyzer.analyze(
        text=text,
        language=_LANG,
        score_threshold=_SCORE_THRESHOLD,
    )
    results = _calibrate_scores(results)
    results = _detect_composite(text, results)
    return results


def anonymize(text: str, entities: Optional[List[RecognizerResult]] = None) -> str:
    """
    Anonymize detected PII. Replaces each real entity with <ENTITY_TYPE>.
    PII_COMPOSITE is excluded — it is a flag only, not a text span to replace.
    """
    if entities is None:
        entities = analyze(text)

    # KEY FIX: exclude PII_COMPOSITE from anonymization
    # It spans the whole text so it would wipe everything if included
    entities_to_mask = [e for e in entities if e.entity_type != "PII_COMPOSITE"]

    if not entities_to_mask:
        return text

    operators = {}
    for r in entities_to_mask:
        if r.entity_type not in operators:
            operators[r.entity_type] = OperatorConfig(
                "replace",
                {"new_value": f"<{r.entity_type}>"},
            )

    result = _anonymizer.anonymize(
        text=text,
        analyzer_results=entities_to_mask,
        operators=operators,
    )
    return result.text


def analyze_and_anonymize(text: str) -> dict:
    """Returns entity list, composite flag, properly anonymized text,
    and raw RecognizerResult objects for the policy engine.
    Returns 'raw_entities' to avoid a second analyze() call from callers.
    """
    entities   = analyze(text)
    anonymized = anonymize(text, entities)

    return {
        "entities": [
            {
                "type":  r.entity_type,
                "start": r.start,
                "end":   r.end,
                "score": round(r.score, 3),
                "text":  text[r.start:r.end],
            }
            for r in entities
            if r.entity_type != "PII_COMPOSITE"
        ],
        "raw_entities":  entities,          # RecognizerResult list — reuse in policy engine
        "has_composite": any(r.entity_type == "PII_COMPOSITE" for r in entities),
        "anonymized":    anonymized,
    }


if __name__ == "__main__":
    tests = [
        "Hello, my name is Ahmed Khan and my email is ahmed@example.com",
        "Call me at 0300-1234567",
        "My API key is sk-aBcDefGhIjKlMnOpQrStUvWxYz1234567890AB",
        "Employee EMP-10234 submitted a leave request",
        "What is the capital of France?",
    ]
    for t in tests:
        result = analyze_and_anonymize(t)
        print(f"\nInput:     {t}")
        print(f"Entities:  {[e['type'] for e in result['entities']]}")
        print(f"Composite: {result['has_composite']}")
        print(f"Anonymized:{result['anonymized']}")
