import { ItemView, WorkspaceLeaf, MarkdownRenderer, Modal, App } from 'obsidian';
import type CortexPlugin from '../main';
import { spawnClaude, parseStreamOutput } from './ClaudeProcess';
import { ContextManager } from './ContextManager';
import { log } from './utils/logger';
import {
  StoredSession,
  saveSession,
  loadAllSessions,
  titleFromPrompt,
  canResumeLocally,
  loadSessionMessages,
} from './utils/sessionStorage';

export const VIEW_TYPE_CLAUDE = 'cortex-chat';

// ---------------------------------------------------------------------------
// Session history modal
// ---------------------------------------------------------------------------

class SessionListModal extends Modal {
  sessions: StoredSession[];
  vaultRoot: string;
  onSelect: (session: StoredSession) => void;

  constructor(app: App, vaultRoot: string, sessions: StoredSession[], onSelect: (s: StoredSession) => void) {
    super(app);
    this.vaultRoot = vaultRoot;
    this.sessions = sessions;
    this.onSelect = onSelect;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: 'Session history' });

    if (this.sessions.length === 0) {
      contentEl.createEl('p', { text: 'No saved sessions yet.', cls: 'cortex-modal-empty' });
      return;
    }

    const list = contentEl.createEl('ul', { cls: 'cortex-session-list' });
    for (const session of this.sessions) {
      this.renderSessionItem(list, session);
    }
  }

  private renderSessionItem(list: HTMLElement, session: StoredSession) {
    const resumable = canResumeLocally(session.claudeSessionId);
    const item = list.createEl('li', {
      cls: resumable ? 'cortex-session-item' : 'cortex-session-item cortex-session-remote',
    });
    const titleEl = item.createEl('span', { text: session.title, cls: 'cortex-session-title' });
    item.createEl('span', {
      text: new Date(session.updatedAt).toLocaleString(),
      cls: 'cortex-session-date',
    });
    if (!resumable) {
      item.createEl('span', { text: 'remote', cls: 'cortex-session-remote-badge' });
    }
    const renameBtn = item.createEl('button', { text: '✏', cls: 'cortex-rename-btn' });
    renameBtn.title = 'Rename session';

    // Load session on row click (but not rename button)
    item.addEventListener('click', (e) => {
      if (e.target === renameBtn) return;
      this.onSelect(session);
      this.close();
    });

    // Inline rename
    renameBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const input = item.createEl('input', {
        cls: 'cortex-rename-input',
        attr: { value: session.title, type: 'text' },
      });
      titleEl.hide();
      renameBtn.hide();
      input.focus();
      input.select();

      const commit = () => {
        const newTitle = input.value.trim();
        if (newTitle && newTitle !== session.title) {
          session.title = newTitle;
          saveSession(this.vaultRoot, session);
          titleEl.setText(newTitle);
        }
        input.remove();
        titleEl.show();
        renameBtn.show();
      };

      input.addEventListener('keydown', (ke) => {
        if (ke.key === 'Enter') { ke.preventDefault(); commit(); }
        if (ke.key === 'Escape') { input.remove(); titleEl.show(); renameBtn.show(); }
      });
      input.addEventListener('blur', commit);
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}

// ---------------------------------------------------------------------------
// Chat view
// ---------------------------------------------------------------------------

export class ClaudeView extends ItemView {
  plugin: CortexPlugin;
  private inputEl: HTMLTextAreaElement;
  private messagesEl: HTMLElement;
  private sendBtn: HTMLButtonElement;
  private sessionStatusEl: HTMLElement;
  private currentSessionId: string | undefined;
  private currentSessionTitle: string | undefined;
  private currentSessionCreatedAt: string | undefined;

  constructor(leaf: WorkspaceLeaf, plugin: CortexPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string { return VIEW_TYPE_CLAUDE; }
  getDisplayText(): string { return 'Cortex'; }
  getIcon(): string { return 'message-square'; }

  async onOpen() {
    const root = this.containerEl.children[1] as HTMLElement;
    root.empty();
    root.addClass('cortex-view');

    // Session toolbar
    const toolbar = root.createDiv({ cls: 'cortex-toolbar' });
    this.sessionStatusEl = toolbar.createSpan({ cls: 'cortex-session-status', text: 'New session' });
    const historyBtn = toolbar.createEl('button', { text: 'History', cls: 'cortex-history-btn' });
    historyBtn.addEventListener('click', () => this.showSessionHistory());
    const newSessionBtn = toolbar.createEl('button', { text: 'New', cls: 'cortex-new-session' });
    newSessionBtn.addEventListener('click', () => this.startNewSession());

    this.messagesEl = root.createDiv({ cls: 'cortex-messages' });

    const inputRow = root.createDiv({ cls: 'cortex-input-row' });
    this.inputEl = inputRow.createEl('textarea', {
      cls: 'cortex-input',
      attr: { placeholder: 'Ask Claude…', rows: '3' },
    });
    this.sendBtn = inputRow.createEl('button', { text: 'Send', cls: 'cortex-send' });

    this.sendBtn.addEventListener('click', () => this.handleSend());
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && this.plugin.settings.sendOnEnter) {
        e.preventDefault();
        this.handleSend();
      }
    });

    // Auto-resume last session if setting is on
    if (this.plugin.settings.resumeLastSession) {
      const vaultRoot = (this.app.vault.adapter as any).basePath;
      const sessions = loadAllSessions(vaultRoot);
      if (sessions.length > 0) {
        await this.loadSession(sessions[0]);
      }
    }
  }

  async onClose() { /* nothing to clean up yet */ }

  private startNewSession() {
    this.currentSessionId = undefined;
    this.currentSessionTitle = undefined;
    this.currentSessionCreatedAt = undefined;
    this.messagesEl.empty();
    this.updateSessionStatus();
    log('New session started');
  }

  private showSessionHistory() {
    const vaultRoot = (this.app.vault.adapter as any).basePath;
    const sessions = loadAllSessions(vaultRoot);
    new SessionListModal(this.app, vaultRoot, sessions, (session) => {
      this.loadSession(session);  // fire-and-forget ok here
    }).open();
  }

  private async loadSession(session: StoredSession) {
    this.currentSessionId = session.claudeSessionId;
    this.currentSessionTitle = session.title;
    this.currentSessionCreatedAt = session.createdAt;
    this.messagesEl.empty();
    this.updateSessionStatus();

    const resumable = canResumeLocally(session.claudeSessionId);

    if (resumable) {
      const messages = loadSessionMessages(session.claudeSessionId);
      if (messages.length > 0) {
        for (const msg of messages) {
          if (msg.role === 'user') {
            this.appendMessage('user', msg.content);
          } else {
            const el = this.appendMessage('assistant', '');
            await MarkdownRenderer.render(this.app, msg.content, el, '', this);
          }
        }
        // Divider between history and new messages
        const divider = this.messagesEl.createDiv({ cls: 'cortex-history-divider' });
        divider.setText('─── resuming here ───');
        divider.scrollIntoView({ behavior: 'instant' });
      } else {
        this.appendMessage('system', `Resumed: ${session.title}`);
      }
    } else {
      this.appendMessage('system', `Session from another machine: ${session.title}`);
    }

    log('Loaded session:', session.claudeSessionId, session.title, resumable ? '(local)' : '(remote)');
  }

  private updateSessionStatus() {
    if (this.currentSessionTitle) {
      this.sessionStatusEl.setText(this.currentSessionTitle);
      this.sessionStatusEl.title = this.currentSessionId ?? '';
    } else if (this.currentSessionId) {
      this.sessionStatusEl.setText(`Session: ${this.currentSessionId.substring(0, 8)}…`);
      this.sessionStatusEl.title = this.currentSessionId;
    } else {
      this.sessionStatusEl.setText('New session');
      this.sessionStatusEl.title = '';
    }
  }

  private async handleSend() {
    const prompt = this.inputEl.value.trim();
    if (!prompt) return;

    if (!this.plugin.claudeBinaryPath) {
      this.appendMessage('system', 'Claude binary not found. Check Cortex settings.');
      return;
    }

    const unlock = () => { this.sendBtn.disabled = false; };
    const isNewSession = !this.currentSessionId;
    const firstPrompt = isNewSession ? prompt : undefined;
    log('handleSend — session:', this.currentSessionId ?? 'new', '— prompt:', prompt.substring(0, 60));

    this.inputEl.value = '';
    this.sendBtn.disabled = true;
    this.appendMessage('user', prompt);

    const assistantEl = this.appendMessage('assistant', '');
    assistantEl.addClass('cortex-thinking');

    // On the first message of a new session, prepend vault context
    let finalPrompt = prompt;
    if (isNewSession) {
      const ctx = new ContextManager(this.app, this.plugin.settings.contextFilePath, this.plugin.settings.autonomousMemory);
      const context = await ctx.buildSessionContext();
      finalPrompt = ctx.injectContext(context, prompt);
      if (context) log('Context injected, length:', context.length);
    }

    let proc: ReturnType<typeof spawnClaude>;
    try {
      proc = spawnClaude({
        binaryPath: this.plugin.claudeBinaryPath,
        prompt: finalPrompt,
        vaultRoot: (this.app.vault.adapter as any).basePath,
        env: this.plugin.shellEnv,
        resumeSessionId: this.currentSessionId,
      });
    } catch (e) {
      assistantEl.setText(`Failed to start claude: ${e}`);
      unlock();
      return;
    }

    proc.stdin?.end();

    let accumulated = '';

    parseStreamOutput(proc, {
      onText: (delta) => {
        accumulated += delta;
        assistantEl.setText(accumulated);
      },
      onToolCall: (tool) => {
        this.appendMessage('system', `Tool: ${tool}`);
      },
      onDone: (sessionId) => {
        assistantEl.removeClass('cortex-thinking');

        if (sessionId) {
          const vaultRoot = (this.app.vault.adapter as any).basePath;
          const now = new Date().toISOString();

          if (isNewSession && firstPrompt) {
            // First response — create the session record
            this.currentSessionId = sessionId;
            this.currentSessionTitle = titleFromPrompt(firstPrompt);
            this.currentSessionCreatedAt = now;
            saveSession(vaultRoot, {
              id: sessionId,
              title: this.currentSessionTitle,
              createdAt: now,
              updatedAt: now,
              claudeSessionId: sessionId,
            });
            log('Session saved:', sessionId, this.currentSessionTitle);
          } else if (this.currentSessionId) {
            // Subsequent messages — update the timestamp
            saveSession(vaultRoot, {
              id: this.currentSessionId,
              title: this.currentSessionTitle ?? this.currentSessionId.substring(0, 8),
              createdAt: this.currentSessionCreatedAt ?? now,
              updatedAt: now,
              claudeSessionId: this.currentSessionId,
            });
          }

          this.updateSessionStatus();
        }

        if (!accumulated) {
          assistantEl.setText('(no response)');
        } else {
          assistantEl.empty();
          MarkdownRenderer.render(this.app, accumulated, assistantEl, '', this);
        }
        assistantEl.scrollIntoView({ behavior: 'smooth' });
        unlock();
      },
      onError: (err) => {
        this.appendMessage('system', `stderr: ${err.trim()}`);
      },
    });

    proc.on('error', (err) => {
      assistantEl.setText(`Process error: ${err.message}`);
      unlock();
    });
  }

  private appendMessage(role: 'user' | 'assistant' | 'system', text: string): HTMLElement {
    const el = this.messagesEl.createDiv({ cls: `cortex-message cortex-${role}` });
    el.setText(text);
    el.scrollIntoView({ behavior: 'smooth' });
    return el;
  }
}
