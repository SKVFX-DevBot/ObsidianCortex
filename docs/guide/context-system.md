# Context System

ObsidiBot injects context at the start of each new session so Claude understands your vault before you ask your first question. Nothing extra is injected on subsequent turns — those use session resumption (`--resume`), which is far cheaper.

---

## 1. System Orientation

Automatically injected at every new session — no configuration needed. Tells Claude what ObsidiBot is, that it's operating inside Obsidian, what tools it has, and how to interact with the UI.

---

## 2. Vault Tree

A folder and file name overview of your vault. **Only names are listed — no file contents are read.** Hidden files and folders (starting with `.`) are skipped.

Configure depth in **Settings → ObsidiBot → Vault tree depth**:

| Setting              | What Claude sees                  |
| -------------------- | --------------------------------- |
| Off                  | No vault tree                     |
| 1 level              | Root-level folders and files only |
| 2 levels             | Root + one sublevel               |
| 3 levels *(default)* | Root + two sublevels              |
| Unlimited            | Full tree at any depth            |

Deeper trees give Claude better spatial awareness of large vaults but cost more tokens per session start. For most vaults, **3 levels** is a good balance.

---

## 3. Context File (Persistent Memory)

A markdown file injected at the start of every session. Default path: `_claude-context.md` at your vault root. This is Claude's **persistent memory** — it survives across sessions and syncs with your vault.

Seed it manually with your vault conventions:

```markdown
# My Vault Context

## Conventions
- Meeting notes go in 02_Calendar/YYYY-MM-DD format
- Projects live in 06_Spaces/Projects/
- Use #status/active and #status/done tags

## Current focus
Working on Q2 planning. Key notes: [[Q2 Goals]], [[Team Roster]]
```

The context file path is configurable in **Settings → ObsidiBot**.

---

## 4. Active Note

The path of the currently open note is prepended to every message — e.g. `[Active note: 06_Spaces/Projects/Alpha.md]`. Claude always knows which note you're looking at.

**Split-pane awareness:** When you have multiple notes open side by side, ObsidiBot injects all visible file paths instead — e.g. `[Open in split view: Notes/A.md | Projects/B.md]`. Toggle in **Settings → Inject split-pane files as context**.

---

## 5. Per-note Frontmatter Context

Add ObsidiBot properties to any note's frontmatter to control how Claude treats it.

| Property                 | Value      | Effect                                                     |
| ------------------------ | ---------- | ---------------------------------------------------------- |
| `obsidibot-context`      | `always`   | Full note content injected at every session start          |
| `obsidibot-instructions` | any string | Instruction injected telling Claude how to treat this file |

**Pin a note to every session** (e.g. a project brief or style guide):

```yaml
---
obsidibot-context: always
---
```

**Give Claude standing instructions for a file:**

```yaml
---
obsidibot-instructions: "Always write in present tense and keep bullets under 10 words."
---
```

**Both together:**

```yaml
---
obsidibot-context: always
obsidibot-instructions: "This is the team writing guide — apply its rules to any note you edit."
---
```

::: warning Partial file protection
You can use `obsidibot-instructions` to tell Claude not to modify a file — e.g. `"Read for reference only. Do not edit."` This works well in practice but is convention, not enforcement. For truly critical files, keep a backup or use git history.
:::

---

## 6. Autonomous Memory

When **Autonomous memory** is on (default), Claude is instructed to actively maintain the context file as it learns about your vault — naming conventions, ongoing projects, your preferences. Claude updates the file directly using its file-editing tools; you can inspect and edit it at any time.

Disable in **Settings → ObsidiBot → Autonomous memory** if you prefer to manage it manually, or if your vault is shared.

### Two kinds of memory

|                   | Session memory (`--resume`)                    | Autonomous memory (context file)     |
| ----------------- | ---------------------------------------------- | ------------------------------------ |
| **What**          | Full conversation history                      | Key facts Claude chose to remember   |
| **How long**      | Until the Claude Code session expires          | Permanent (until you edit or delete) |
| **Cross-machine** | No — stored in `~/.claude/` locally            | Yes — travels with vault sync        |
| **Size**          | 10KB–several MB per session (plain JSON lines) | As small as you keep it              |
| **Inspectable**   | No                                             | Yes — it's a markdown file           |

::: tip Cross-machine sessions
Session files are keyed to the vault's absolute path. Resuming a session from another machine requires the same absolute path AND the session file present on that machine — generally not practical. Use the context file for cross-machine continuity.
:::
