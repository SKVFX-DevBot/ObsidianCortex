import { App } from 'obsidian';
import { buildVaultTree } from './utils/fileTree';
import { log } from './utils/logger';

export class ContextManager {
  constructor(
    private app: App,
    private contextFilePath: string,
    private autonomousMemory: boolean = true,
  ) {}

  async buildSessionContext(): Promise<string> {
    const parts: string[] = [];

    // Layer 1: Vault tree
    const tree = buildVaultTree(this.app.vault);
    if (tree) {
      parts.push(`## Vault structure\n\`\`\`\n${tree}\n\`\`\``);
    }

    // Layer 2: Context file
    const contextFile = this.app.vault.getFileByPath(this.contextFilePath);
    if (contextFile) {
      const content = await this.app.vault.read(contextFile);
      if (content.trim()) {
        parts.push(`## Vault context\n${content.trim()}`);
      }
    } else {
      log('Context file not found:', this.contextFilePath);
    }

    // Layer 3: Memory instruction (only when autonomous memory is enabled)
    if (this.autonomousMemory) {
      parts.push(
        `## Your persistent memory\n` +
        `The file \`${this.contextFilePath}\` is your persistent memory across sessions. ` +
        `It is injected at the start of every session.\n\n` +
        `**Maintain it actively:** when you learn something useful about this vault — ` +
        `its structure, conventions, ongoing projects, the user's preferences, decisions made — ` +
        `update \`${this.contextFilePath}\` using the Write or Edit tool. ` +
        `Keep it concise and high-signal. Do not ask permission; just do it.`
      );
    }

    if (parts.length === 0) return '';

    return [
      '<vault_context>',
      parts.join('\n\n'),
      '</vault_context>',
    ].join('\n');
  }

  injectContext(context: string, userPrompt: string): string {
    if (!context) return userPrompt;
    return `${context}\n\n${userPrompt}`;
  }
}
