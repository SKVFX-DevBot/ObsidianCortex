# Obsidian Claude Plugin — Open Questions

**Status:** Pre-development working doc. Resolve these before or during implementation.  
**Process:** When a decision is made, move it from "Unresolved" to "Decided" with rationale.

---

## Unresolved

---

### Q1: Context injection strategy — once at session start vs. every turn?

**The question:** Pinned context notes (including the vault context file) can be injected once when the claude process starts, or re-injected on every conversation turn.

**Tradeoffs:**

| Once at start | Every turn |
|---|---|
| Fewer tokens per turn | More reliable — survives compaction |
| More efficient | Guaranteed present throughout session |
| Can get compacted away over long sessions | Token cost adds up for large pinned sets |

**Current thinking:** Make it a setting. Default to "once at start" for most users, with a toggle for power users who hit compaction issues on long sessions. The vault context file specifically might warrant always re-injecting since it's compact and critical.

**Decision needed by:** Before implementing `ContextManager.ts`

---

### Q2: Compaction notification UX

**The question:** When Claude's context window fills and auto-compaction occurs, the plugin receives a signal in the stream. What should it do?

**Options:**
- Silent (do nothing, trust Claude)
- Inline notice in the chat panel ("Context compacted — early instructions may be summarized")
- Toast notification
- Offer user a chance to re-inject context manually

**Current thinking:** Inline notice in the chat thread is least disruptive and most informative. The notice should remind the user that CLAUDE.md / vault context file is the right place for anything that must survive compaction.

**Decision needed by:** Before implementing stream parser UI

---

### Q3: Concurrent sessions

**The question:** Should the plugin support multiple active sessions open simultaneously in different panels?

**Considerations:**
- Multiple `claude` processes running concurrently is fine at the OS level
- Obsidian allows multiple leaves/splits
- Session file writes could conflict if not handled carefully
- Adds significant complexity to session management

**Current thinking:** Explicitly out of scope for v1. Single active session, single panel. Document this as a known limitation. Revisit post-v1 if there's demand.

**Decision needed by:** Before implementing session management (to ensure architecture doesn't accidentally foreclose this later)

---

### Q4: Vault context file — auto-generation on first launch?

**The question:** If no vault context file exists when the plugin first loads, what happens?

**Options:**
1. Silent no-op — plugin works without it, user creates it manually when ready
2. Prompt the user — "No context file found. Create one now?" with a brief explanation
3. Auto-create a blank template
4. Run an onboarding conversation — "Tell me about your vault and I'll create your context file"

**Current thinking:** Option 4 is the ideal UX and aligns with Scott's established workflow (brief Claude, let it generate the file). For v1, option 1 or 2 is more realistic. Leaning toward option 2: a dismissible notice with a "Create context file" button that opens a new note at the configured path.

**Decision needed by:** Onboarding/first-run UX design phase

---

### Q5: Session storage location — `.obsidian/` vs. configurable

**The question:** Sessions are currently designed to live in `.obsidian/claude/sessions/`. This directory is typically gitignored, so sessions don't pollute version-controlled vaults. But some users may want session history under version control.

**Options:**
- Fixed to `.obsidian/claude/sessions/` (simple, conventional)
- Configurable path in settings (flexible, but adds surface area)
- Configurable with a "include in vault / exclude in .obsidian" toggle

**Current thinking:** Start with `.obsidian/claude/sessions/` as the default and only option in v1. Add configurability post-v1 if users request it. Document that users who want version-controlled sessions can configure `.gitignore` to exclude the default and set a custom path.

**Decision needed by:** Before implementing `sessionStorage.ts`

---

### Q6: Permission prompts — UX pattern

**The question:** Claude Code sometimes pauses mid-task to ask permission before performing an action (e.g., running a bash command, writing a file). In a terminal this is an interactive prompt. In the plugin, how is this surfaced?

**Options:**
- Inline in the chat thread — Claude's permission request appears as a message, user responds with "yes" / "no" / types a response
- Modal dialog — interrupts the chat with an explicit approval UI
- Auto-approve with logging — always approve and show what was approved in the thread
- Settings whitelist — user pre-approves certain tool types, unknown ones prompt

**Current thinking:** Inline in chat thread is the most natural for the conversational interface. The permission request appears as a Claude message, with "Allow" / "Deny" buttons rendered below it. User's choice is sent back as a message. This mirrors how Claude Code in VS Code handles it.

**Decision needed by:** Before implementing stream parser and message rendering

---

### Q7: `context: never` enforcement — hard block or soft warning?

**The question:** A note marked `claude.context: never` in frontmatter should not be readable by Claude. But what if the user explicitly asks Claude to read it?

**Scenarios:**
- Claude tries to read it autonomously → block silently, tell Claude the file is restricted
- User types "read my passwords.md" → plugin intercepts before Claude even requests it?
- Claude is mid-task and determines it needs to read a restricted file → blocked, Claude explains it can't

**Tricky part:** The plugin can intercept tool calls Claude makes, but can't intercept what the user types. If the user asks Claude to read a restricted file, Claude will attempt a read tool call, which the plugin then blocks.

**Current thinking:** Enforce at the tool call level, not at the prompt level. If Claude attempts to read a `context: never` file, the plugin blocks the tool call and returns a message to Claude: "This file is marked as restricted by the vault owner. Do not attempt to read it." Claude will relay this to the user. This is honest and consistent behavior.

**Decision needed by:** Before implementing `FrontmatterGuard.ts`

---

### Q8: Vault tree depth — per-folder or global?

**The question:** The initial folder tree injection collapses at a configurable depth (default 3). Should this be a single global setting, or should individual folders be able to override it via their own metadata?

**Example use case:** A vault with a flat top-level but deeply nested `Archive/` folder — user wants to see full depth for `Projects/` but collapse `Archive/` entirely.

**Current thinking:** Global setting for v1. This is an optimization problem that shouldn't block launch. Could revisit as a `_claude-context.md` convention ("expand /Projects to full depth") rather than frontmatter, since it applies to folders not notes.

**Decision needed by:** Before implementing `fileTree.ts`

---

### Q9: Session title auto-generation — when and how?

**The question:** Sessions need titles for the session picker. Options for auto-generation:

- First user prompt, truncated to ~60 chars (simple, immediate)
- Ask Claude to generate a 5-word title after the first exchange (better titles, adds latency and a token round-trip)
- User always names sessions manually (friction-heavy, bad UX)

**Current thinking:** Use first user prompt truncated as the immediate title, with an option to rename. Optionally add a "Generate title" button that fires a separate small Claude call to produce a better one. This gives good UX without blocking the session start.

**Decision needed by:** Before implementing session UI

---

## Decided

*(Empty — decisions will be moved here as they're made, with rationale and date)*

---

## Notes

- When resolving a question, document not just the decision but why alternatives were rejected. Future-you will want to know.
- Some of these can be resolved by looking at how Cline handles the same problem. Check `cline/cline` source before reinventing.
