"""The Alk V2 domain engine.

`engine.assess(events, configurationHistory, asOf)` is the pure pipeline;
`adapter.assess(request)` is the impure boundary that speaks the conformance
harness's JSON protocol. Nothing under this package imports a framework, a
database, a network client or a clock.
"""
