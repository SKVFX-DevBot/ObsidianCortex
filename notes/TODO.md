TODO
----
### Bugs
*(none open)*

### Features — near term
- [ ] #7  Improve "thinking" feedback (better spinner/status while waiting)
- [X] #8  Up/down arrow to scroll through previous input messages
- [ ] #10 Inline content generation (generate text at cursor in active note)
- [ ] #13 Login management (detect login state, surface login prompt)
- [ ] #15 FrontmatterGuard: per-note readonly/protect/instructions/context controls (FrontmatterGuard.ts stubbed)
- [ ] #16 Pinned context: permanent and session-scoped note pinning (backburned)
- [ ] #17 Inline selection context: send highlighted editor text to Cortex as context
- [ ] #18 Native permission dialog to replace --dangerously-skip-permissions
- [ ] #19 Compaction detection and user notification
- [ ] #20 Configurable session storage location
- [X] #21 Vault context file auto-generation on first launch
- [ ] #22 Setting: re-inject context on every turn (not just session start)
- [ ] #29 Image/PDF support
- [ ] #30 Use Lucide icons for all app icons

### Features — low priority / post-v1
- [ ] #23 Dataview / metadata graph awareness
- [ ] #24 Template integration (Templater/core Templates)
- [ ] #25 Git integration: commit messages, branch summaries, change review
- [ ] #26 Multi-context profiles: saved pin sets for different workflow modes
- [ ] #27 Slash commands: custom Cortex commands from vault files
- [ ] #28 Canvas integration: read and generate Obsidian Canvas files

In Progress
-----------
- [ ] .

Done ✓
------
- [x] #4  Smart quote / special char bug breaks input stream ✅ 2026-03-17
- [x] #5  Renaming a session not seeing keyboard input ✅ 2026-03-09
- [x] #6  Copy/Export only copies text content, not full markdown ✅ 2026-03-17
- [x] #9  Replace "Ask Claude..." with "Ask Cortex..." in input box ✅ 2026-03-12
- [x] #12 Add Cortex Command: Open Settings ✅ 2026-03-17
- [x] #14 Ctrl+P command names out of date in USER_README.md ✅ 2026-03-17
- [x] session history: add ability to delete old sessions from the session list modal ✅ 2026-03-09
- [x] session history: remove History button and add search/filter to session list modal ✅ 2026-03-09
- [x] session history: add "New Session" button to create named sessions from the modal ✅ 2026-03-09
- [x] Option B session architecture: remove --resume from turn-to-turn, keep only for session load ✅ 2026-03-09
- [x] Add standard plugin commands (New session, Clear session, Toggle panel, Session history, Export conversation, Copy last response) ✅ 2026-03-09
- [x] Configurable vault tree depth (0=off, 1-10 levels, -1=unlimited) ✅ 2026-03-17
- [x] release-please: add package.json to extra-files so version is bumped on release ✅ 2026-03-17
- [X] Write design specs (notes/)
- [X] Write Claude.md and MEMORY.md project context
- [X] Scaffold plugin structure (manifest, package.json, tsconfig, esbuild, main.ts, src/)
- [X] npm install + npm run build passes
- [X] Test vault symlink created
- [X] Plugin loads in Obsidian — chat panel opens
- [X] Fix --no-update invalid flag
- [X] Add file logging (_cortex-debug.log)
- [X] Add spawn test fixture (test/spawn-test.mjs)
- [X] Fix --verbose required for stream-json + --print
- [X] Fix Windows/Electron spawn: use powershell.exe intermediary + stdin.end()
- [X] Fix stream-json message parser (assistant type, not content_block_delta)
- [X] End-to-end working: chat, read files, write files, tool use
- [X] Markdown rendering in assistant messages
- [X] Session persistence (--resume) + New session button + session indicator
- [X] Context injection — vault tree + context file on new session start
- [X] Send on Enter setting (toggle in Settings → Cortex)
- [X] Strip verbose env logging from ClaudeProcess.ts
- [X] Install Hot Reload plugin in test vault for faster iteration
- [x] Copy/paste not working in chat panel ✅ 2026-03-08
- [x] Show thinking indicator while waiting for response ✅ 2026-03-08
- [x] "send on enter" setting - make that default to true ✅ 2026-03-08
- [x] Add thin box around right-aligned user input text ✅ 2026-03-08
- [x] Bug: shift-enter multiline newlines stripped on redisplay ✅ 2026-03-08

Not Gonna Do
------------
- ctrl-enter to send — gobbled up by system-level user setting, skip it
