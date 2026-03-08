// Session load/save/resume logic
// Sessions are stored in .obsidian/claude/sessions/<id>.json

export interface Session {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  claudeSessionId?: string;  // the --resume ID from the claude CLI
}

// TODO: implement session persistence
