---
name: setup-gates
description: Analyze a project's manifests, CI configuration, scripts, and test layout, then configure evidence-backed dev-loop gates and test-integrity paths. Use when Claude is asked to set up, discover, refresh, or repair `.dev-loop/config.json` gates for an installed dev-loop-kit project.
---

# Set up project gates

Read `.agent-workflow/GATE_SETUP.md` completely and follow it as the source of truth.

Use Claude's repository inspection and shell tools to gather evidence and verify candidate commands. Edit only the target project's `.dev-loop/config.json`; keep shared policy in the canonical workflow file.
