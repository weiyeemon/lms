---
name: dev-loop
description: Run the canonical source-attributed coder/reviewer loop for non-trivial implementation tasks from the current context, GitHub issues, or Jira issues, including detailed specification building, objective gates, fresh adversarial reviews, fix iterations, and auditable session state.
---

# Development loop adapter for Claude

Read `.agent-workflow/DEV_LOOP.md` completely and follow it as the source of truth. Read `.agent-workflow/CODER.md` and `.agent-workflow/REVIEWER.md` before dispatching their respective agents.

Use the `dev-loop-coder` agent for implementation and the `dev-loop-reviewer` agent for review. Spawn the coder once, then use `SendMessage` to continue that same coder on every fix or gate-retry iteration in this Claude session. Spawn a new reviewer each review round.

Do not copy or reinterpret the canonical workflow into this adapter. Store shared plan and audit state exactly where the canonical workflow specifies so Codex can resume later from repository artifacts.
