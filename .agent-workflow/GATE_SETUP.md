# Project gate setup

Analyze the current repository and configure relevant objective gates in `.dev-loop/config.json`. Treat repository evidence as authoritative; do not guess commands from the technology name alone.

## 1. Establish scope and instructions

1. Work from the repository root that contains `.dev-loop/config.json`.
2. Read the repository's applicable agent instructions before inspecting or changing files.
3. Read the existing config and `.agent-workflow/schemas/config.schema.json`.
4. Preserve every config field except `gates` and `test_integrity.paths`. Preserve `test_integrity.allow_existing_test_changes` unless the user explicitly asks to change it.

If the kit is not installed, stop and tell the user to install it first. Do not create a partial configuration.

## 2. Discover commands from evidence

Inspect the smallest useful set of project files, including:

- package/build manifests and lockfiles;
- script declarations such as `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, solution/project files, `Makefile`, and `Taskfile`;
- CI workflows and pipeline definitions;
- test, lint, typecheck, and build tool configuration;
- workspace or monorepo definitions; and
- test directories and naming conventions.

Prefer commands already run by CI, then documented project commands, then manifest scripts. Use the repository's detected package manager and workspace entry point. In a monorepo, prefer a root command that covers the affected workspaces; use separate gates only when the repository has no trustworthy aggregate command.

Choose a concise set that covers the project's real quality controls. Typical categories are tests, typecheck, lint, and build, but include only categories supported by repository evidence. Never select interactive, watch, development-server, deployment, publishing, database-migration, destructive, auto-fix, or snapshot-update commands as gates.

Use stable, unique lowercase gate names such as `tests`, `lint`, `typecheck`, and `build`. Set a realistic positive `timeout_seconds`, using CI timing or project size when available and otherwise a conservative estimate.

## 3. Determine test-integrity paths

Add repository-relative paths containing tests, fixtures that encode expected behavior, or shared test helpers. Derive them from test runner configuration and actual tracked files. Prefer directories over broad globs. Do not include generated output, dependency caches, coverage output, snapshots generated as build artifacts, or the entire repository when narrower paths exist.

If the project has no tests, use an empty path list and state that test-integrity protection could not be configured. Do not invent a test directory.

## 4. Verify candidates

Before writing config:

1. Check that each command resolves to a declared script, tool, or repository task.
2. Run each candidate from the same directory in which the dev loop will run, with its proposed timeout.
3. Do not install dependencies, update lockfiles or snapshots, apply auto-fixes, start services, or change external state without explicit user approval.
4. After running candidates, inspect the working tree. If a command changed tracked files, restore nothing automatically; report the paths and exclude that command until the user decides how to proceed.

A nonzero result caused by existing test, lint, type, or build failures does not make the command irrelevant. It may still be configured when repository evidence proves it is the intended check; report the failing baseline clearly. Exclude commands that are missing, interactive, destructive, or cannot be tied to repository evidence.

If no trustworthy gate remains, do not replace the existing gates with an empty list. Leave the config unchanged and ask for the missing project-specific command or required dependency setup.

## 5. Update and validate config

Show the evidence-backed gate selection briefly, then update `gates` and `test_integrity.paths` while preserving the rest of the JSON structure and user-owned settings. Keep `$schema` when present and write valid formatted JSON with a final newline.

Parse the resulting JSON and confirm:

- `gates` is non-empty;
- every gate has a unique non-empty name and command;
- every timeout is a positive integer;
- every test-integrity path is repository-relative and exists; and
- the config still satisfies `.agent-workflow/schemas/config.schema.json`.

Finish with the configured gates, verification outcome for each command, protected test paths, any baseline failures, and any checks deliberately excluded.
