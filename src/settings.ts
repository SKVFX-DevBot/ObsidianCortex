import { App, PluginSettingTab, Setting } from 'obsidian';
import type CortexPlugin from '../main';

export interface CortexSettings {
  binaryPath: string;
  contextFilePath: string;
  sendOnEnter: boolean;
  resumeLastSession: boolean;
  autonomousMemory: boolean;
  /** Vault tree depth injected at session start. 0=off, 1=root only, N=N levels, -1=unlimited. */
  vaultTreeDepth: number;
}

export const DEFAULT_SETTINGS: CortexSettings = {
  binaryPath: '',
  contextFilePath: '_claude-context.md',
  sendOnEnter: true,
  resumeLastSession: true,
  autonomousMemory: true,
  vaultTreeDepth: 3,
};

export class CortexSettingsTab extends PluginSettingTab {
  plugin: CortexPlugin;

  constructor(app: App, plugin: CortexPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Claude binary path')
      .setDesc('Path to the claude CLI binary. Leave blank to auto-detect.')
      .addText((text) =>
        text
          .setPlaceholder('/usr/local/bin/claude')
          .setValue(this.plugin.settings.binaryPath)
          .onChange(async (value) => {
            this.plugin.settings.binaryPath = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Context file path')
      .setDesc('Vault-relative path to the context file injected at session start.')
      .addText((text) =>
        text
          .setPlaceholder('_claude-context.md')
          .setValue(this.plugin.settings.contextFilePath)
          .onChange(async (value) => {
            this.plugin.settings.contextFilePath = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Vault tree depth')
      .setDesc(
        'How many levels of your vault folder/file tree to include at the start of each session. ' +
        'This gives Claude a map of your vault structure (names only — no file contents are read). ' +
        'Deeper trees cost more tokens on the first message of each session. ' +
        '"Off" disables the tree entirely.'
      )
      .addDropdown((drop) =>
        drop
          .addOption('0', 'Off')
          .addOption('1', '1 level (root only)')
          .addOption('2', '2 levels')
          .addOption('3', '3 levels (default)')
          .addOption('4', '4 levels')
          .addOption('5', '5 levels')
          .addOption('6', '6 levels')
          .addOption('7', '7 levels')
          .addOption('8', '8 levels')
          .addOption('9', '9 levels')
          .addOption('10', '10 levels')
          .addOption('-1', 'Unlimited')
          .setValue(String(this.plugin.settings.vaultTreeDepth))
          .onChange(async (value) => {
            this.plugin.settings.vaultTreeDepth = parseInt(value, 10);
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Send on Enter')
      .setDesc('Press Enter to send. Shift+Enter always inserts a newline.')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.sendOnEnter)
          .onChange(async (value) => {
            this.plugin.settings.sendOnEnter = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Resume last session on startup')
      .setDesc('Automatically resume the most recent session when the panel opens.')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.resumeLastSession)
          .onChange(async (value) => {
            this.plugin.settings.resumeLastSession = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Autonomous memory')
      .setDesc(`Claude will autonomously update the context file (${this.plugin.settings.contextFilePath}) as it learns about your vault. Disable if you prefer to manage the context file manually, or if your vault is shared/public.`)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autonomousMemory)
          .onChange(async (value) => {
            this.plugin.settings.autonomousMemory = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
