# Canonical coder/reviewer development loop

This document is the source of truth for both Claude and Codex adapters. One product orchestrates a session at a time. The orchestrator does not write product code during this workflow: a coder implements, the orchestrator runs objective gates, and a fresh reviewer audits each review round.

## Constants and artifacts

- Project configuration: `.dev-loop/config.json`.
- The initial review-iteration limit, protected branches, gate commands, and test-integrity paths come from project configuration. Persist the active limit in `plan.json` so user-approved extensions survive resumption.
- Session directory: `.dev-loop/sessions/<UTC-yyyyMMdd-HHmmss>-<task-slug>/`.
- Shared plan: `<session-dir>/plan.json`, following `PLAN.template.json`.
- Frozen detailed specification: `<session-dir>/specification.json`, following `SPECIFICATION.template.json` and `SPECIFICATION.md`.
- Audit log: `<session-dir>/events.jsonl`.
- Pending event: `<session-dir>/event.json`.

Create the task slug from three to five lowercase hyphenated words. Keep `.dev-loop/` ignored and outside the reviewer diff.

Write events by first writing a valid JSON object to `event.json`, then running:

```text
node .agent-workflow/scripts/append-event.mjs <events.jsonl> <event.json>
```

The script validates, serializes, and appends the event, preventing invalid JSON escapes. Obtain every timestamp from the shell. Update `plan.json` after every state transition so another Claude or Codex session can resume from artifacts alone.

Every event contains `ts`, `event`, and `iteration` (`null` before and after the loop, otherwise a positive one-based integer). Add these payloads:

| Event | Required payload |
|---|---|
| `session_start` | user prompt, configuration, baseline commit, orchestrator product, and branch metadata |
| `plan` | exact source-attributed specification, baseline gate results, and planning notes |
| `coder_dispatch` | spawn/follow-up mode, agent ID, and whether spec, repository orientation, findings, or gate failures were sent |
| `coder_result` | changed files, claimed tests, disputes, and uncertainties |
| `gates` | command results and test-integrity audit |
| `reviewer_dispatch` | fresh agent ID and the artifact names supplied |
| `reviewer_verdict` | the valid reviewer verdict object without rewriting its content |
| `decision` | reasoning, action, forwarded blockers, evaluated disputes, user continuation choices, active iteration limit, and minor dispositions |
| `minor_fixes` | fixes applied and gate recheck |
| `session_end` | outcome, iteration count, start/end timestamps, uncommitted state, and summary |

## 1. Set up

1. Read and validate `.dev-loop/config.json`. Stop with a clear configuration error when its gate list is empty or required values are missing.
2. Get the current branch before other workflow actions. Do not run on any configured protected branch unless the user explicitly overrides the warning. Otherwise propose the configured feature branch template with `{task_slug}` replaced.
3. Verify the working tree is clean. If it is not, stop and ask how to handle the existing changes; never absorb them silently into the baseline.
4. Record `git rev-parse HEAD` as `baseline_commit`. Create the session directory, `plan.json`, and the `session_start` event.
5. Run every configured gate on the baseline. Abort and record `session_end` if any baseline gate fails.
6. Read `SPECIFICATION.md` and build the detailed specification from current planning/specification context, referenced GitHub issues, referenced Jira issues, and repository evidence. If those sources are insufficient, inaccessible, conflicting, or materially ambiguous, launch its interactive specification-building workflow and obtain the required user decisions before dispatch.
7. Write `<session-dir>/specification.json`, validate it with `validate-specification.mjs`, require no material open questions, mirror its criterion behavior strings into `plan.json.acceptance_criteria`, store its path in the plan, and include the complete frozen specification in the `plan` event. Do not send inferred implementation choices unless a source or compatibility constraint requires them.
8. Inspect the smallest task-relevant repository surface and compile concise, non-normative repository orientation for the initial coder. Include only verified navigation and implementation evidence that reduces rediscovery: the repository root and platform, branch and baseline, prioritized read-first paths, relevant current or legacy flows, likely extension points, reusable tests or fakes, applicable gates, compatibility traps, and explicit uncertainties. Do not restate the specification, prescribe unsupported implementation choices, or create a separate context artifact, schema, validation step, or lifecycle. The frozen specification remains authoritative when orientation is incomplete or conflicts with it.
9. Initialize the disputed-findings list as empty and set the plan `iteration_limit` to configured `max_review_iterations`.

If a session directory already represents unfinished work, verify its branch and baseline against Git, read the plan and log, and resume. Agent thread IDs are product-local hints only: never send a message to an ID created by another product or top-level session.

### Reopen a legacy maxed-out session

When the user asks to resume an existing session whose plan status is `max_iterations` and whose last event is `session_end`:

1. Treat it as terminal until the user explicitly confirms reopening. If they decline, change nothing.
2. Verify the saved branch and baseline against Git, confirm the session diff is still present and attributable to that baseline, and rerun configured gates. If state has diverged or gates cannot run safely, leave the old session closed and propose a new session instead.
3. Read the unresolved blocking findings and exact specification from the saved artifacts. Do not reconstruct them from memory.
4. Reset `iteration_limit` to `iteration + config.max_review_iterations`, giving the reopened session a fresh configured block of review iterations. This also migrates legacy plans that have no `iteration_limit`.
5. Set status to `in_progress`, update `next_action`, and append a `decision` event with action `reopen`, the user's authorization, previous terminal status, prior iteration, previous limit when present, new limit, gate results, and remaining blockers. The historical `session_end` remains in the append-only log.
6. Resume with the saved blockers. Reuse the coder only when its thread is valid in the current product and top-level session; otherwise spawn a replacement coder from repository artifacts.

After reopening, use the normal cap behavior. When the reset limit is reached, pause in `awaiting_user` and ask again whether to continue or stop.

## 2. Implement

On the first implementation round, spawn the configured coder with the complete frozen `specification.json` and the compiled repository orientation. Keep the orientation compact and label it non-normative. Store the coder's product and thread ID in `plan.json` as transient runtime metadata.

Within the same top-level session, keep the coder thread alive. For gate failures or review fixes, send a follow-up task to that same coder containing only:

- current blocking findings;
- raw gate failures; and
- the unchanged specification when needed for clarity.

Do not send reviewer reasoning, prior verdict prose, logs, or unrelated history. Spawn a replacement coder only if the existing coder is unavailable, belongs to another session/product, or repeatedly drifts from scope. Before dispatching a replacement, recompile the repository orientation from the current tree and send it with the unchanged specification plus current accepted blockers and raw gate failures. Log every dispatch and result.

The coder must follow `CODER.md` and return its structured report.

## 3. Run gates

The orchestrator runs every gate itself; never trust only the coder's claimed results. Record commands, exit codes, and compact output summaries.

Run `git diff <baseline_commit> -- <configured test-integrity paths>` and audit whether an existing test or assertion was deleted or weakened. Treat an unauthorized weakening as blocking unless project configuration explicitly allows existing test changes.

If a gate fails, log a `gate_retry` decision and send the raw failure to the same coder. Gate retries do not consume a review iteration.

## 4. Review

After green gates, spawn a new configured reviewer. Never reuse a reviewer from an earlier round. Give it exactly:

1. the complete frozen `specification.json` verbatim;
2. `git diff <baseline_commit>`;
3. gate output; and
4. accepted disputed findings with their justifications.

Do not give the reviewer coder messages, orchestrator reasoning, previous verdicts, or the audit log. The reviewer follows `REVIEWER.md` and returns only the specified JSON verdict. Save it to a temporary JSON file and run `node .agent-workflow/scripts/validate-verdict.mjs <verdict.json>`. If validation fails, ask that same reviewer once to correct its JSON before proceeding.

## 5. Decide and iterate

Write a `decision` event every round with real reasoning and one of: `iterate`, `approve`, `gate_retry`, `await_user`, `continue`, `reopen`, `stop`, `escalate`, or `abort`.

- If blocking findings remain below the active `iteration_limit`, send them to the same coder and increment the review iteration.
- Evaluate coder disputes directly against the code. Record whether each justification was accepted.
- Minor findings never trigger another iteration. Apply only unambiguous, tightly scoped minor fixes in one coder follow-up after approval, then rerun gates once.
- When blocking findings remain and `iteration` reaches the active `iteration_limit`, do not finish automatically. Set plan status to `awaiting_user`, set `next_action` to ask whether to continue or stop, and append an `await_user` decision containing the remaining blockers, gate state, current iteration, and active limit. Do not append `session_end` while waiting.
- Ask the user whether to continue or stop the loop. If the user continues without specifying a count, authorize one additional review iteration; if they specify a positive count, extend by that count. Record a `continue` decision, increase and persist `iteration_limit`, restore status to `in_progress`, then forward the current blockers to the coder. Ask again whenever the extended limit is reached.
- If the user stops, record a `stop` decision, set status to `max_iterations`, append `session_end`, and report the unresolved blockers. If the user has not answered, leave the session resumable in `awaiting_user`.
- Stop early for oscillation when the same finding returns in two non-consecutive rounds.
- Reject unrelated diff growth as scope creep.
- Treat a first-round approval of a non-trivial diff skeptically unless the test audit is substantive.

## 6. Finish

For a terminal outcome, set the plan status to `approved`, `max_iterations`, `escalated`, or `aborted`. `awaiting_user` is non-terminal and must not have `session_end`. For a terminal status, append `session_end`, then run:

```text
node .agent-workflow/scripts/validate-session.mjs <plan.json> <events.jsonl>
```

Report acceptance-criterion coverage, actual gate results, iterations and findings, accepted disputes, deferred minor suggestions, and the session directory. Work remains uncommitted unless the user asks for a commit.
