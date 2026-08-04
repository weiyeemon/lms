<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- dev-loop-kit:start -->
## Development loop

Use the `dev-loop` repository skill only when the user explicitly invokes `$dev-loop`, uses the managed `dev-loop` CLI, or asks to run or use dev-loop by name. Never auto-activate it for an ordinary implementation request. Read `.agent-workflow/DEV_LOOP.md` as the canonical procedure and `.dev-loop/config.json` for project-specific gates and paths.

Within one Codex task, spawn the coder once and send follow-up tasks to that same coder for gate failures and review fixes. Spawn a fresh reviewer for every review round. When resuming work started by Claude or another Codex task, create a new coder from the shared plan and repository state.
<!-- dev-loop-kit:end -->
