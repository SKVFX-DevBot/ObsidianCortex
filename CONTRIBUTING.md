# Contributing to Cortex

Thank you for considering contributing to Cortex! This document covers how to report bugs, suggest features, and submit code changes.

## Code of Conduct

This project is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold it.

---

## Reporting Bugs

Before filing a bug report, check [existing issues](https://github.com/ScottKirvan/Cortex/issues) to avoid duplicates.

**Include in your bug report:**
- Steps to reproduce
- What you expected vs. what happened
- Obsidian version, OS, and Cortex version
- Any relevant error messages from the developer console (Ctrl/Cmd+Shift+I in Obsidian)

---

## Suggesting Features

Use the [feature request template](https://github.com/ScottKirvan/Cortex/issues/new?template=feature_request.md). Describe the use case clearly — what problem it solves and how you'd expect it to work.

---

## Development Setup

### Prerequisites

- Node.js 18+
- npm
- Claude Code CLI installed **and logged in** natively in PowerShell (not just in WSL on Windows)
  - Install: `winget install Anthropic.ClaudeCode`
  - Log in: `claude login` (opens browser for OAuth — required even if logged in via WSL)
- Obsidian desktop
- A throwaway test vault (do not develop against your real vault)

### Clone and Build

```bash
git clone https://github.com/ScottKirvan/Cortex.git
cd Cortex
npm install
npm run build      # one-shot build → main.js
npm run dev        # watch mode (rebuilds on save)
```

### Test Vault Setup

Link the plugin into a throwaway Obsidian vault for live testing.

**Mac/Linux:**
```bash
ln -s /path/to/Cortex /path/to/test-vault/.obsidian/plugins/cortex
```

**Windows (PowerShell, run as admin):**
```powershell
New-Item -ItemType Directory -Force -Path "D:\test-vault\.obsidian\plugins"
New-Item -ItemType SymbolicLink `
  -Path "D:\test-vault\.obsidian\plugins\cortex" `
  -Target "D:\path\to\Cortex"
```

In Obsidian:
1. Open the test vault
2. Settings → Community Plugins → disable Safe Mode
3. Enable **Cortex** in the installed plugins list

### Fast Iteration

Install the [Hot Reload](https://github.com/pjeby/hot-reload) community plugin in your test vault. With `npm run dev` running, saving any source file rebuilds and reloads the plugin automatically — no manual restart needed.

Without Hot Reload: use Ctrl/Cmd+P → "Reload app without saving" after each build.

### Project Structure

```
Cortex/
  main.ts                 ← plugin entry point
  manifest.json           ← plugin metadata (id, name, version)
  package.json
  tsconfig.json
  esbuild.config.mjs
  src/
    ClaudeView.ts         ← chat panel UI (ItemView subclass)
    ClaudeSession.ts      ← session load/save/resume
    ClaudeProcess.ts      ← binary detection, spawn, stream-json parsing
    ContextManager.ts     ← context file, pinned notes, frontmatter scanning
    FrontmatterGuard.ts   ← intercept writes, enforce readonly/protect
    settings.ts           ← settings schema and settings tab UI
    utils/
      shellEnv.ts         ← shell environment resolution
      fileTree.ts         ← vault folder tree builder
      sessionStorage.ts   ← read/write .obsidian/claude/sessions/
  notes/                  ← design docs and specs
  .claude/                ← Claude Code project memory (git-tracked)
```

---

## Commit Message Convention

Cortex uses [Conventional Commits](https://www.conventionalcommits.org/) — these drive automated versioning via [release-please](https://github.com/googleapis/release-please).

| Prefix | Effect | Use for |
|--------|--------|---------|
| `feat:` | bumps MINOR | new user-facing feature |
| `fix:` | bumps PATCH | bug fix |
| `feat!:` / `fix!:` | bumps MAJOR | breaking change |
| `docs:` | no version bump | documentation only |
| `refactor:` | no version bump | code change, no behavior change |
| `chore:` | no version bump | maintenance, deps, tooling |
| `test:` | no version bump | adding or updating tests |

**Examples:**
```
feat: add session resume on panel open
fix: correct binary detection on Windows
docs: add frontmatter schema to user guide
chore: update esbuild to 0.21
feat!: change context file default path to _claude-context.md
```

---

## Pull Request Process

1. Fork the repo and create a branch from `main`
2. Make your changes — keep PRs focused on a single concern
3. Ensure `npm run build` passes with no TypeScript errors
4. Update documentation (`notes/USER_README.md`, `README.md`) if your change affects user-facing behavior
5. Submit the PR — describe what changed and why

CHANGELOG is generated automatically by release-please from commit messages; you don't need to edit it manually.

---

## Questions?

Open an issue, or reach out via:
- [LinkedIn](https://www.linkedin.com/in/scottkirvan/)
- [Discord](https://discord.gg/TSKHvVFYxB) — cptvideo
