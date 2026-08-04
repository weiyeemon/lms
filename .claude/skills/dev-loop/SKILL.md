---
name: dev-loop
description: Run the canonical source-attributed coder/reviewer dev-loop only when the user explicitly invokes /dev-loop, uses the managed dev-loop CLI, or unambiguously asks to run or use dev-loop by name. Do not activate for ordinary implementation, issue, planning, or review requests. Supports a resumable single-plan, single-approval flow, objective gates, fresh reviews, and auditable state.
---

# Development loop adapter for Claude

Read `.agent-workflow/DEV_LOOP.md` completely and follow it as the source of truth. Read `.agent-workflow/CODER.md` and `.agent-workflow/REVIEWER.md` before dispatching their respective agents.

Treat activation as explicit-only. Display the complete plan once and require one explicit approval. Amendments keep the session in the same approval state and replace the displayed plan; they do not introduce a separate final-proposal phase. Do not run gates, dispatch agents, or modify product code before approval.

Use the `dev-loop-coder` agent for implementation and the `dev-loop-reviewer` agent for review. Spawn the coder once, then use `SendMessage` to continue that same coder on every fix or gate-retry iteration in this Claude session. Spawn a new reviewer each review round.

Do not copy or reinterpret the canonical workflow into this adapter. Store shared plan and audit state exactly where the canonical workflow specifies so Codex can resume later from repository artifacts.
