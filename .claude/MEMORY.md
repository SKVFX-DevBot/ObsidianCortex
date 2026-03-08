# MEMORY.md — Cortex Project

Persistent cross-session notes for Claude Code. Keep concise.

---

## Project Identity

- **Name:** Cortex
- **What:** Obsidian plugin — brings Claude Code agentic file management into Obsidian vaults
- **Plugin ID:** `cortex` (manifest.json id)
- **Repo path:** `d:/1/GitRepos/ScottKirvan/Vaults/sk/07_GitRepos/Cortex`
- **GitHub:** ScottKirvan/Cortex (release-please + conventional commits)

## Current Status (as of 2026-03-08)

- **Phase:** Active development. Scaffold complete, build passes, test vault symlink set up.
- **Source files in place:** `main.ts`, `src/ClaudeView.ts`, `src/ClaudeProcess.ts`, `src/settings.ts`, stubs for session/context/guard/utils
- **Blocker in progress:** Claude Code not yet installed natively in Windows — needed for plugin to find the binary

## Known Gotchas

- **Claude Code must be installed natively in Windows (PowerShell), not just in WSL.** The plugin spawns `claude` as a Windows child process — a WSL-only install is invisible to it. Install: `winget install Anthropic.ClaudeCode` or `irm https://claude.ai/install.ps1 | iex`. Verify: `claude --version` works in a plain PowerShell window.

## Key Architecture Decisions (Locked)

- Uses Claude Code **CLI binary as subprocess** — NOT the API, NOT the Agent SDK
- No API key needed — rides user's Pro/Max subscription
- `child_process.spawn('claude', ['--output-format', 'stream-json', '--print', ...])`
- Vault root = `cwd` for all claude spawns
- Sessions stored in `.obsidian/claude/sessions/` (gitignored by default)
- Context system replaces `CLAUDE.md`; uses `_claude-context.md` by default
- Per-note frontmatter under `claude:` key controls access/behavior
- **Desktop only** — `isDesktopOnly: true`

## Scott's Preferences

- Conventional commits + release-please (he handles commits, I write the code)
- Scott moves between machines — notes must be self-contained enough to resume cold
- Not yet fluent in TypeScript — I do most of the implementation writing
- Does not want me to auto-commit or push
- Project and plugin both called "Cortex" (not "obsidian-claude" or any other name)

## Key Files

| File | Purpose |
|------|---------|
| `Claude.md` | Project instructions (in repo) |
| `.claude/MEMORY.md` | This file — cross-session notes (in repo, git-tracked) |
| `notes/obsidian-claude-plugin-design.md` | Full architecture + feature spec |
| `notes/obsidian-claude-plugin-bootstrap.md` | Day-one dev setup |
| `notes/obsidian-claude-plugin-frontmatter-schema.md` | Frontmatter schema |
| `notes/obsidian-claude-plugin-questions.md` | Open design decisions |

## Implementation Order

- [x] Scaffold (manifest, package.json, tsconfig, esbuild, main.ts, src/)
- [x] npm install + npm run build passes
- [x] Test vault symlink created
- [ ] Claude Code installed natively in Windows + plugin loads in Obsidian
- [ ] Verify streaming output works end-to-end in ClaudeView
- [ ] Session persistence (ClaudeSession.ts + sessionStorage.ts)
- [ ] Context injection (ContextManager.ts)
- [ ] Frontmatter enforcement (FrontmatterGuard.ts)

## Open Design Questions (unresolved)

See `notes/obsidian-claude-plugin-questions.md` for full detail. Key ones:
- Q1: Context injection — once at session start vs. every turn (leaning: setting, default once)
- Q2: Compaction notification UX (leaning: inline chat notice)
- Q3: Concurrent sessions — out of scope for v1
- Q6: Permission prompts — inline in chat with Allow/Deny buttons
