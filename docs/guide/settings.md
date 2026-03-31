# Settings

Open **Settings → Cortex** to configure:

| Setting | Default | Description |
|---|---|---|
| **Claude binary path** | *(auto-detect)* | Full path to the `claude` executable. Leave blank to auto-detect from PATH and common install locations. |
| **Context file path** | `_claude-context.md` | Vault-relative path to the context file injected at session start. |
| **Export folder** | `Cortex Exports` | Default folder for **Export session to vault**. Created automatically if it doesn't exist. Leave blank to save at vault root. |
| **Vault tree depth** | 3 levels | Levels of folder/file names injected at session start. `0` = off, `1`–`10` = N levels, `-1` = unlimited. Names only — no file contents. |
| **Send on Enter** | On | Press Enter to send. Shift+Enter always inserts a newline. |
| **Resume last session on startup** | On | Automatically resume the most recent session when the panel opens. |
| **Autonomous memory** | On | Claude updates the context file as it learns about your vault. Disable if you prefer manual control or if your vault is shared. |
| **Permission mode** | Standard | Controls what vault operations Claude can perform. See [Permissions](./permissions). |
| **Command Allowlist** | `switcher:open`, `daily-notes`, `editor:open-search` | Obsidian commands Claude can run via the UI Bridge. Found under **UI Bridge & Commands**. Allowlisted commands execute immediately. |
| **Prompt for unlisted commands** | On | When Claude tries a command not in the allowlist, show a confirmation modal. Allow + "Don't ask again" adds to allowlist. Deny + "Don't ask again" adds to denylist. |
| **Denied commands** | *(hidden until used)* | Shows count of permanently denied commands with a **Clear denylist** button. To re-enable a specific command, add it to the allowlist via the command browser. |
| **Enable debug log** | On | Write a debug log file. See [Troubleshooting](./troubleshooting#logging). |
| **Log file path** | `.obsidian/plugins/cortex/cortex-debug.log` | Vault-relative path for the log file. Defaults to the plugin folder so it stays out of your vault and git history. |
| **Log verbosity** | Normal | **Normal** logs session events and errors. **Verbose** adds raw stream data and token breakdowns. |
| **@-mention file types** | `md, fountain, txt` | Comma-separated file extensions included in the `@` autocomplete dropdown. |
| **Inject split-pane files** | On | When in split-pane view, include all visible file paths as active note context. |
