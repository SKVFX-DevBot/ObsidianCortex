# Permissions

ObsidiBot runs Claude Code as a subprocess and controls what it's allowed to do via Claude Code's permission flags. The permission mode is set **per session** before any message is sent — it cannot change mid-response.

## Modes

| Mode                         | What Claude can do                                                       |
| ---------------------------- | ------------------------------------------------------------------------ |
| **Standard** *(recommended)* | Read and write files, use web search/fetch — Bash/shell commands blocked |
| **Read only**                | Read files, search, fetch web — no writes or shell commands              |
| **Full access**              | Everything, including shell commands (Bash, git, etc.)                   |

Configure in **Settings → ObsidiBot → Permission mode**.

---

## Permission Denials

When Claude attempts a blocked operation, a **denial card** appears in the chat after the response completes, listing what was blocked.

You can click **Allow full access for this session** to upgrade to Full access and automatically retry the last message.

::: warning
Permission granularity is at the **tool level**, not the command level. "Allow full access" unlocks all shell commands for the rest of the session — there is no way to approve `git status` while still blocking `rm`. This is a constraint of how Claude Code works in streaming mode.

If you need Bash access regularly, set Permission mode to **Full access** in settings rather than upgrading per-session each time.
:::

The session override is cleared when you start a new session.
