// Session load/save/resume logic
// Sessions are stored at: <vault>/.obsidian/plugins/obsidibot/.claude/sessions/<id>.json
// This keeps all ObsidiBot data within the plugin's own folder, travels with the vault.

export interface Session {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  claudeSessionId?: string;  // the --resume ID from the claude CLI
}

// TODO: implement session persistence
