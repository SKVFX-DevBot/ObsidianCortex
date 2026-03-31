# Commands

Press **Ctrl+P** (Windows/Linux) or **Cmd+P** (Mac) to open the Command Palette and search for any of the following:

## Panel & Navigation

| Command | ID | Description |
|---|---|---|
| **Cortex: Open agent panel** | `open-cortex-agent` | Opens or focuses the chat panel. Also available via the wave icon in the left ribbon. |
| **Cortex: Toggle Cortex panel** | `toggle-cortex-panel` | Quickly hide or show the chat panel without closing it. |
| **Cortex: Show session history** | `show-cortex-session-history` | Show all saved sessions and resume a previous conversation. |

## Session Management

| Command | ID | Description |
|---|---|---|
| **Cortex: New session** | `new-cortex-session` | Start a fresh conversation. The current session is saved automatically. |
| **Cortex: Clear current session** | `clear-cortex-session` | Clear all messages from the current session. Context is re-injected on the next message. |

## Communication & Settings

| Command | ID | Description |
|---|---|---|
| **Cortex: Export conversation** | `export-cortex-conversation` | Copy the current conversation as markdown to the clipboard. |
| **Cortex: Export session to vault** | `export-cortex-to-vault` | Save the current conversation as a vault note. Prompts for a path (defaults to configured Export folder). |
| **Cortex: Copy last response** | `copy-cortex-last-response` | Copy Claude's last response to the clipboard. |
| **Cortex: Open settings** | `open-cortex-settings` | Jump directly to the Cortex settings panel. |
| **Cortex: Send selection as context** | `send-selection-to-cortex` | Highlight text in any note, then run this command to attach it as context. |
| **Cortex: Focus chat input** | `focus-cortex-input` | Open the Cortex panel and place the cursor in the chat input. Good for hotkey binding. |
| **Cortex: Open context file** | `open-cortex-context-file` | Open `_claude-context.md` (or your configured path) for editing. |
| **Cortex: Refresh session context** | `refresh-cortex-context` | Re-inject the context file, command allowlist, and frontmatter into the active session. Queued and sent with your next message. |
| **Cortex: About Cortex** | `show-cortex-about` | Show version info and links. |
