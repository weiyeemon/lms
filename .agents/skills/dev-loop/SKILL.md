---
name: dev-loop
description: Run the source-attributed coder/reviewer dev-loop only when the user explicitly invokes $dev-loop, uses the managed dev-loop CLI, or unambiguously asks to run or use dev-loop by name. Do not activate for ordinary implementation, issue, planning, or review requests. Supports a resumable single-plan, single-approval flow, objective gates, fresh reviews, and auditable state.
---

# Development loop adapter for Codex

Read `.agent-workflow/DEV_LOOP.md` completely and follow it as the source of truth. Read `.agent-workflow/CODER.md` and `.agent-workflow/REVIEWER.md` before dispatching their respective agents.

Treat activation as explicit-only. Display the complete plan once and require one explicit approval. Amendments keep the session in the same approval state and replace the displayed plan; they do not introduce a separate final-proposal phase. Do not run gates, dispatch agents, or modify product code before approval.

Use the project custom `dev_loop_coder` agent for implementation and `dev_loop_reviewer` for review. Spawn the coder once. For each fix or gate retry in the same Codex task, send a follow-up task to that existing coder agent; do not spawn another coder merely because its prior turn completed. Spawn a new reviewer for every review round.

When resuming a session created by Claude or another Codex task, discard any stored coder thread ID and spawn a new coder initialized only from the exact specification, current blocking findings, gate failures, and repository state.

Keep product-specific mechanics in this adapter and shared policy in `.agent-workflow/`.
