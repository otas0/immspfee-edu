# Deferred: true L di/dt eddy / self-inductance sim

Product lock: do **not** stretch household / induction stage drawings into a fake L di/dt model.

## When product asks

Open a dedicated sim (new `js/sims/` group + `js/physics/` relation), not a retrofit of eddy/self-inductance title mounts that today teach qualitative flux / heating only.

Minimum teaching surface:

- Circuit: R–L series with switch, emf E, inductance L, resistance R.
- Equation: ε_L = −L di/dt, i(t) = (E/R)(1 − e^{−(R/L)t}) after close (ideal).
- Readouts from that relation only — no decorative traces.
- Separate lesson ids; do not overwrite existing eddy demos.

Until then: keep public teaching mounts as-is; this note is the stand-in ticket.
