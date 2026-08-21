"""The impure boundary: request in, `EngineResult` out.

`ALK-V2-MODULE-DESIGN.md` §2 calls this `alk.assess` — the single entry point,
thin, and containing **no chemistry**. It does three things the domain may not:

1. reads the frozen reason-code catalogue, once, to stamp `owner` and
   `severity` on the codes the domain raised;
2. unpacks the harness's JSON request into the domain's three arguments;
3. answers the protocol's `describe` operation.

Everything else happens inside `engine.assess`, which is pure.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from . import catalogue as catalogue_mod
from . import engine as engine_mod

_CATALOGUE: Optional[catalogue_mod.Catalogue] = None


def _catalogue() -> catalogue_mod.Catalogue:
    global _CATALOGUE
    if _CATALOGUE is None:
        _CATALOGUE = catalogue_mod.load()
    return _CATALOGUE


def describe() -> Dict[str, Any]:
    """Canon §47/§64: a replay is stamped with the version that produced it."""
    return {
        "engineVersion": engine_mod.ENGINE_VERSION,
        "canonVersion": engine_mod.CANON_VERSION,
    }


def _configuration_history(request: Dict[str, Any]) -> List[Dict[str, Any]]:
    """The interface's second argument.

    The harness sends `configurationHistory` and, for convenience, a flattened
    `configuration`. The history is authoritative: canon §518 makes resolving
    the effective version the engine's job, so the engine reads the list and
    only falls back to the single snapshot when no list was sent.
    """
    history = request.get("configurationHistory")
    if isinstance(history, list) and history:
        return [h for h in history if isinstance(h, dict)]
    single = request.get("configuration")
    return [single] if isinstance(single, dict) else []


def assess(request: Dict[str, Any]) -> Dict[str, Any]:
    """Handle one protocol request."""
    if request.get("op") == "describe":
        return describe()

    result = engine_mod.assess(
        events=request.get("events") or [],
        configuration_history=_configuration_history(request),
        as_of_text=request.get("asOf"),
    )

    cat = _catalogue()
    stamped = []
    for rc in result.get("reasonCodes") or []:
        code = rc.get("code")
        stamped.append(
            {
                "code": code,
                "owner": cat.owner_of(code) or "UNKNOWN",
                "severity": cat.severity_of(code) or "INFO",
                "payload": rc.get("payload") or {},
            }
        )
    result["reasonCodes"] = stamped
    return result
