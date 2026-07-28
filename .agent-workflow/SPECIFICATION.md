# Detailed specification workflow

Build the implementation contract before dispatching the coder. Preserve source attribution and never turn an unsupported guess into a requirement.

## 1. Collect sources

Use relevant sources in this order:

1. **Current context**: the user's latest request, prior planning, specifications, decisions, corrections, and constraints in the current conversation.
2. **GitHub issues**: issue title/body, acceptance criteria, labels, linked issues or pull requests, and comments that contain explicit decisions. Use a connected GitHub tool when available, then `gh`, then a user-provided copy. Do not infer inaccessible content from an issue number or title.
3. **Jira issues**: summary, description, acceptance criteria, fields, linked work, and comments that contain explicit decisions. Use a connected Jira tool or configured CLI/API when available; otherwise ask the user to provide the issue content.
4. **Repository evidence**: applicable instructions, current implementation, tests, public interfaces, schemas, configuration, and documentation. Use this to describe current behavior and compatibility constraints, not to override explicit product requirements.

Explicit user decisions in the current context are authoritative. Do not silently resolve material conflicts between the conversation, GitHub, Jira, or repository behavior. Record the conflict as an open question and ask the user.

For every source, store a stable reference and only the facts used by the specification. Mark derived statements as assumptions rather than source facts.

## 2. Draft the specification

Create `<session-dir>/specification.json` from `SPECIFICATION.template.json` with:

- a concise title and summary;
- source references and extracted facts;
- current observable behavior;
- desired observable behavior;
- numbered acceptance criteria with an objective verification for each;
- technical or product constraints explicitly supported by a source;
- non-goals that bound the implementation;
- assumptions that are safe, reversible, and do not materially change scope; and
- open questions for unresolved decisions.

Do not prescribe implementation choices unless a source requires them or repository compatibility makes them unavoidable. Include relevant success paths, error paths, boundaries, state transitions, permissions, compatibility, and data-shape behavior.

Mirror the criterion behavior strings into `plan.json.acceptance_criteria` for backward compatibility. Treat `specification.json` as the complete contract.

## 3. Decide whether clarification is required

Proceed without questions only when every material behavior is source-backed and any remaining assumption is low-risk and reversible.

Launch the specification-building workflow when requirements are missing, conflicting, or materially ambiguous:

1. Inspect the smallest relevant repository surface needed to explain the decision.
2. Present a compact draft containing known facts, proposed scope, non-goals, and assumptions.
3. Ask focused questions that describe the concrete behavioral choice and its impact. Prefer one to three questions at a time.
4. Incorporate the answers as `clarification` sources; do not rewrite history or erase earlier conflicting facts.
5. Repeat until no material open questions remain.
6. Show the final acceptance criteria, constraints, assumptions, and non-goals. Ask for approval when the workflow introduced material inferred behavior or changed scope beyond the literal request.

Do not dispatch a coder while material open questions remain or required external issue content is inaccessible.

## 4. Validate and freeze

Run:

```text
node .agent-workflow/scripts/validate-specification.mjs <session-dir>/specification.json --final
```

Before dispatch, require `open_questions` to be empty. Store the specification path in `plan.json`, include the complete specification in the `plan` event, and send the same frozen content verbatim to coder and reviewer. Later user changes require a new attributed clarification, an updated specification, validation, and an audit event before implementation continues.
