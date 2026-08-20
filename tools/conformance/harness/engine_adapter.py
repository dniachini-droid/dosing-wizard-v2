"""How the harness talks to an engine.

There is no V2 engine yet, and no stack has been chosen -- stack selection is
an owner decision recorded in `DECISIONS.md` (`AGENT-ROSTER.md`,
`architecture-reviewer`: *never selects the stack*). So the harness must not
require the engine to be written in the harness's own language.

The boundary is therefore a **process boundary with a JSON line protocol**,
and a Python in-process adapter is offered only as a convenience for the
mutation harness, which needs to sabotage an implementation cheaply.

Protocol (one JSON object per line, both directions):

    -> {"protocol": "alk-v2-conformance/1",
        "op": "assess",
        "fixtureId": "WG-ALK-001",
        "asOf": "2026-09-05T09:00:00+10:00",
        "events": [ ... ],
        "configuration": { ... },
        "configurationHistory": [ ... ]}

    <- {"ok": true,  "engineResult": { ... }}
    <- {"ok": false, "error": "...", "reasonCodes": ["..."]}

`op` may also be `"describe"`, answered with
`{"ok": true, "engineVersion": "...", "canonVersion": "..."}`.

With no engine configured the harness uses `AbsentEngine`, which answers every
request with `ENGINE_ABSENT`. That is a designed state, not a crash: the run
completes, every executable fixture reports FAIL/ENGINE_ABSENT, the mechanical
document checks still run and still pass or fail on their own merits, and the
exit code is non-zero because the corpus did not pass.
"""

from __future__ import annotations

import json
import subprocess
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

ENGINE_ABSENT = "ENGINE_ABSENT"
PROTOCOL = "alk-v2-conformance/1"


@dataclass
class EngineReply:
    ok: bool
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

    @property
    def absent(self) -> bool:
        return self.error == ENGINE_ABSENT


class Engine:
    name = "engine"

    def describe(self) -> Dict[str, Any]:
        return {}

    def assess(self, request: Dict[str, Any]) -> EngineReply:  # pragma: no cover
        raise NotImplementedError

    def close(self) -> None:
        pass


class AbsentEngine(Engine):
    """The no-engine case. Answers cleanly rather than failing to exist."""

    name = "none (no engine supplied)"

    def assess(self, request: Dict[str, Any]) -> EngineReply:
        return EngineReply(ok=False, error=ENGINE_ABSENT)


class SubprocessEngine(Engine):
    """An engine in any language, spoken to over stdin/stdout as JSON lines."""

    def __init__(self, command: List[str]):
        self.name = " ".join(command)
        self._command = command
        self._proc = subprocess.Popen(
            command,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
        )

    def assess(self, request: Dict[str, Any]) -> EngineReply:
        payload = dict(request)
        payload["protocol"] = PROTOCOL
        payload.setdefault("op", "assess")
        try:
            assert self._proc.stdin and self._proc.stdout
            self._proc.stdin.write(json.dumps(payload) + "\n")
            self._proc.stdin.flush()
            line = self._proc.stdout.readline()
        except Exception as exc:  # noqa: BLE001
            return EngineReply(ok=False, error=f"transport failure: {exc}")
        if not line:
            return EngineReply(ok=False, error="engine closed its output stream")
        try:
            reply = json.loads(line)
        except json.JSONDecodeError as exc:
            return EngineReply(ok=False, error=f"engine reply is not JSON: {exc}")
        if not isinstance(reply, dict):
            return EngineReply(ok=False, error="engine reply is not an object")
        if reply.get("ok"):
            res = reply.get("engineResult")
            if not isinstance(res, dict):
                return EngineReply(ok=False, error="ok reply carried no engineResult object")
            return EngineReply(ok=True, result=res)
        return EngineReply(ok=False, error=str(reply.get("error", "unspecified engine error")))

    def close(self) -> None:
        try:
            if self._proc.stdin:
                self._proc.stdin.close()
            self._proc.wait(timeout=5)
        except Exception:  # noqa: BLE001
            self._proc.kill()


class CallableEngine(Engine):
    """In-process adapter: `module:attribute` resolving to `f(request) -> dict`.

    Used by the mutation harness so that a sabotage can be applied and measured
    without process startup cost. A real engine is expected to use the
    subprocess protocol.
    """

    def __init__(self, spec: str):
        import importlib

        if ":" not in spec:
            raise ValueError("callable engine spec must be 'module:attribute'")
        mod_name, attr = spec.split(":", 1)
        mod = importlib.import_module(mod_name)
        self._fn = getattr(mod, attr)
        self.name = spec

    def assess(self, request: Dict[str, Any]) -> EngineReply:
        try:
            out = self._fn(dict(request))
        except Exception as exc:  # noqa: BLE001
            return EngineReply(ok=False, error=f"{type(exc).__name__}: {exc}")
        if out is None:
            return EngineReply(ok=False, error="engine returned nothing")
        if not isinstance(out, dict):
            return EngineReply(ok=False, error="engine returned a non-object")
        return EngineReply(ok=True, result=out)


def build(engine_command: Optional[str], engine_callable: Optional[str]) -> Engine:
    if engine_callable:
        return CallableEngine(engine_callable)
    if engine_command:
        import shlex

        return SubprocessEngine(shlex.split(engine_command))
    return AbsentEngine()
