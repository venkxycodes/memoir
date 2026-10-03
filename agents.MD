# Agent Instructions

## General
- Use skills available in this repository wherever applicable.
- Read the relevant skill instructions before starting implementation.
- Prefer existing project patterns, utilities, and conventions over introducing new ones.
- Keep changes scoped to the requested task. Avoid unrelated refactors.

## Subagents
- Start subagents when the task can be parallelized effectively.
- Use subagents when a task requires substantial context across independent areas, for example frontend, backend, database, testing, or research.
- Give each subagent a clear, non-overlapping responsibility.
- Review and integrate subagent output before committing.

## Implementation
- Inspect the existing codebase before modifying files.
- Reuse existing components, abstractions, and helpers where reasonable.
- Keep code modular; avoid concentrating unrelated logic in large files.
- Add or update tests when behavior changes.
- Run the relevant checks, tests, linters, or builds before considering the task complete.

## Git
Use commit messages in this format:

`<verb>: <message>`

Examples:
- `feat: app boilerplate`
- `fix: journal entry validation`
- `docs: update setup instructions`
- `chore: upgrade dependencies`

Common verbs include:
- `feat` — new functionality
- `fix` — bug fix
- `hotfix` — urgent production fix
- `docs` — documentation changes
- `chore` — maintenance or tooling changes
- `ci` — CI/CD changes
- `refactor` — internal restructuring without behavior changes
- `test` — test-only changes
- `perf` — performance improvements

Keep commit messages short, specific, and imperative.
