---
name: dev-loop
description: Run a source-attributed coder/reviewer development loop for non-trivial implementation tasks. Use when Codex is asked to implement from the current context, a GitHub issue, or a Jira issue; needs detailed specification building, objective gates, and adversarial review; or resumes a Claude/Codex loop from `.dev-loop/sessions`.
---

# Development loop adapter for Codex

Read `.agent-workflow/DEV_LOOP.md` completely and follow it as the source of truth. Read `.agent-workflow/CODER.md` and `.agent-workflow/REVIEWER.md` before dispatching their respective agents.

Use the project custom `dev_loop_coder` agent for implementation and `dev_loop_reviewer` for review. Spawn the coder once. For each fix or gate retry in the same Codex task, send a follow-up task to that existing coder agent; do not spawn another coder merely because its prior turn completed. Spawn a new reviewer for every review round.

When resuming a session created by Claude or another Codex task, discard any stored coder thread ID and spawn a new coder initialized only from the exact specification, current blocking findings, gate failures, and repository state.

Keep product-specific mechanics in this adapter and shared policy in `.agent-workflow/`.
