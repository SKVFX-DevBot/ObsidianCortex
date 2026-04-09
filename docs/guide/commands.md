# Commands

Press **Ctrl+P** (Windows/Linux) or **Cmd+P** (Mac) to open the Command Palette and search for any of the following:

## Panel & Navigation

| Command                               | ID                               | Description                                                                           |
| ------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------- |
| **ObsidiBot: Open agent panel**       | `open-obsidibot-agent`           | Opens or focuses the chat panel. Also available via the wave icon in the left ribbon. |
| **ObsidiBot: Toggle ObsidiBot panel** | `toggle-obsidibot-panel`         | Quickly hide or show the chat panel without closing it.                               |
| **ObsidiBot: Show session history**   | `show-obsidibot-session-history` | Show all saved sessions and resume a previous conversation.                           |

## Session Management

| Command                              | ID                        | Description                                                                              |
| ------------------------------------ | ------------------------- | ---------------------------------------------------------------------------------------- |
| **ObsidiBot: New session**           | `new-obsidibot-session`   | Start a fresh conversation. The current session is saved automatically.                  |
| **ObsidiBot: Clear current session** | `clear-obsidibot-session` | Clear all messages from the current session. Context is re-injected on the next message. |

## Communication & Settings

| Command                                  | ID                              | Description                                                                                                                     |
| ---------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **ObsidiBot: Export conversation**       | `export-obsidibot-conversation` | Copy the current conversation as markdown to the clipboard.                                                                     |
| **ObsidiBot: Export session to vault**   | `export-obsidibot-to-vault`     | Save the current conversation as a vault note. Prompts for a path (defaults to configured Export folder).                       |
| **ObsidiBot: Copy last response**        | `copy-obsidibot-last-response`  | Copy Claude's last response to the clipboard.                                                                                   |
| **ObsidiBot: Open settings**             | `open-obsidibot-settings`       | Jump directly to the ObsidiBot settings panel.                                                                                  |
| **ObsidiBot: Send selection as context** | `send-selection-to-obsidibot`   | Highlight text in any note, then run this command to attach it as context.                                                      |
| **ObsidiBot: Focus chat input**          | `focus-obsidibot-input`         | Open the ObsidiBot panel and place the cursor in the chat input. Good for hotkey binding.                                       |
| **ObsidiBot: Open context file**         | `open-obsidibot-context-file`   | Open `_claude-context.md` (or your configured path) for editing.                                                                |
| **ObsidiBot: Refresh session context**   | `refresh-obsidibot-context`     | Re-inject the context file, command allowlist, and frontmatter into the active session. Queued and sent with your next message. |
| **ObsidiBot: About ObsidiBot**           | `show-obsidibot-about`          | Show version info and links.                                                                                                    |
