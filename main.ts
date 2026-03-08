import { Plugin, Notice, WorkspaceLeaf } from 'obsidian';
import { ClaudeView, VIEW_TYPE_CLAUDE } from './src/ClaudeView';
import { CortexSettings, DEFAULT_SETTINGS, CortexSettingsTab } from './src/settings';
import { findClaudeBinary } from './src/ClaudeProcess';
import { resolveShellEnv } from './src/utils/shellEnv';

export default class CortexPlugin extends Plugin {
  settings: CortexSettings;
  shellEnv: Record<string, string> = {};
  claudeBinaryPath: string | null = null;

  async onload() {
    await this.loadSettings();

    this.shellEnv = resolveShellEnv();
    this.claudeBinaryPath = findClaudeBinary(this.settings.binaryPath);

    if (!this.claudeBinaryPath) {
      new Notice('Cortex: claude binary not found. Check plugin settings.');
    }

    this.registerView(VIEW_TYPE_CLAUDE, (leaf) => new ClaudeView(leaf, this));

    this.addRibbonIcon('message-square', 'Cortex', () => {
      this.activateView();
    });

    this.addSettingTab(new CortexSettingsTab(this.app, this));
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_CLAUDE);
  }

  async activateView() {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(VIEW_TYPE_CLAUDE);

    if (existing.length) {
      workspace.revealLeaf(existing[0]);
      return;
    }

    const leaf = workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({ type: VIEW_TYPE_CLAUDE, active: true });
      workspace.revealLeaf(leaf);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
