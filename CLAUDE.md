@AGENTS.md

<!-- dev-loop-kit:start -->
## Development loop

Use `/dev-loop` only when the user explicitly invokes it, uses the managed `dev-loop` CLI, or asks to run or use dev-loop by name. Never auto-activate it for an ordinary implementation request. Read `.agent-workflow/DEV_LOOP.md` as the canonical procedure and `.dev-loop/config.json` for project-specific gates and paths.

Within one Claude session, spawn the coder once and use `SendMessage` for gate failures and review fixes. Spawn a fresh reviewer for every review round. When resuming work started by Codex or another Claude session, create a new coder from the shared plan and repository state.
<!-- dev-loop-kit:end -->
