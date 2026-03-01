# Obsidian Claude Plugin — Design Conversation Transcript

**Date:** 2025-02-27  
**Participants:** Scott, Claude (Anthropic)  

---

**Scott:** I have been thinking about writing some code that's a wrapper around claude-code. Here's kind of what i'm thinking: i use claudecode in vscode a lot. I like the project model, how it can manage and modify files in the project, and i like the interface - just having a window within the vscode interface that i use for conversations and instructions.

I would like the same functionality, but within obsidian - so the entire vault would be the project, and claude would heelp with writing, organizing, scripting, etc.

Is this something that could be done as an obsidian plugin and can i get access to the api's i would need in claude to do this implementation?

---

**Claude:** This is very doable, and it's a genuinely good idea — Obsidian's architecture is well-suited for it. A few things worth clarifying upfront though:

**Claude Code isn't really wrappable**

Claude Code is a CLI application, not an API you can call programmatically. What you'd actually build is a plugin using the **Anthropic Messages API directly**, with tool use — which is essentially what Claude Code itself does under the hood. You'd be reimplementing the pattern, not wrapping the tool. The end result would behave the same way from your perspective.

**The Obsidian Plugin API gives you everything you need**

Obsidian plugins are TypeScript/Electron, and the plugin API exposes:

- `app.vault` — full read/write/create/delete/rename access to every file in the vault
- `app.metadataCache` — parsed frontmatter, links, tags, backlinks
- `app.workspace` — create custom panels/leaves (your chat window)
- File search, folder traversal, etc.

You can create a sidebar or split panel that looks and feels like the Claude Code panel in VS Code.

**The Claude API side**

You'd use the Anthropic Messages API with **tool use**. You define tools like:

- `read_file(path)` → returns file contents
- `write_file(path, content)` → creates or overwrites
- `list_files(folder)` → directory listing
- `search_vault(query)` → grep/fuzzy search across files
- `move_file(from, to)` / `delete_file(path)`

Claude reasons about what needs to happen, calls tools, you execute them against the vault via the Obsidian API, return results, Claude continues. Standard agentic loop. You'd inject a system prompt that establishes vault context — something like the folder structure and maybe key files.

**What you'd build**

1. A custom `ItemView` (the chat panel) registered as a sidebar or split pane
2. An API client using `fetch` (Obsidian's Electron context supports it natively — no need for Node http)
3. Tool handler that maps Claude's tool calls → `app.vault` operations
4. Conversation history kept in memory (or persisted to a vault file)
5. Optionally: a "context" system where you can pin specific notes or folders to the conversation

**Existing plugins to study**

There are plugins like *Copilot* and *Smart Connections* that do partial versions of this. None replicate the full agentic file-editing loop. Looking at their source on GitHub would give you a fast start on the boilerplate (plugin manifest, settings tab, view registration).

**One practical consideration**

Obsidian restricts network access in mobile — but since you're using this in a desktop/van setup with VS Code already, desktop-only is probably fine. Just something to know.

This would be a pretty natural project for someone already comfortable with Unreal plugin architecture — the Obsidian plugin system is much simpler. If you want, I can sketch out the core architecture or start on the actual plugin scaffold.

---

**Scott:** Is this something i would be able to do now? Is my claude pro account adequate for something like this?

---

**Claude:** The short answer: your Pro subscription alone isn't enough, but getting API access is straightforward and cheap for personal use.

**What Pro gives you (and doesn't)**

The Pro plan does not include API usage through the Claude Console. If you're interested in both enhanced Claude features and the Claude API, you'll need to set up Console access to pay for API usage separately.

So the plugin you'd build makes direct API calls, and those are billed separately from your Pro subscription.

**Setting up API access**

You'd go to console.anthropic.com, create a developer account, add a credit card, and buy credits (minimum is just $5). You get an API key, and that's what the plugin uses. Credits are consumed every time you send a successful request to the Claude API. For personal writing/organization use on a vault, costs would be pretty minimal — likely a few dollars a month unless you're running intensive agentic loops constantly.

**There's actually another path via Claude Code**

Since Pro and Max plans now include access to both Claude on the web and Claude Code in your terminal with one unified subscription, and Claude Code can be accessed programmatically via its SDK — you could potentially build the plugin to talk to your local Claude Code installation instead of calling the API directly. This would use your Pro subscription's included usage rather than burning API credits. It's a more complex integration but worth knowing it exists as an option.

**Bottom line**

The simplest path: keep your Pro subscription, add a Console account at console.anthropic.com with $10-20 in credits, and build the plugin against the standard API. You'd be up and running today. The API key setup takes about 5 minutes.

Want to start on the actual plugin scaffold?

---

**Scott:** I think I would like to doing this without the using the api directly, so that i could share the plugin and it would work for anyone with access to claudecode

---

**Claude:** There's an important catch here worth knowing before you go further.

**The Agent SDK requires an API key**

The official documentation explicitly states: "Unless previously approved, Anthropic does not allow third party developers to offer claude.ai login or rate limits for their products, including agents built on the Claude Agent SDK. Please use the API key authentication methods described in this document instead."

So the SDK route doesn't give you subscription-based sharing the way you're imagining — it still needs API credentials.

**But there's a different path that actually works**

Rather than using the SDK, you call the `claude` CLI binary directly as a subprocess. This is the same binary users have installed when they set up Claude Code. It authenticates through the user's own login (`claude login`), which is tied to their Pro/Max subscription.

The plugin would:
1. Check that `claude` is installed and on PATH
2. Spawn it as a child process, pointed at the vault directory as the working directory
3. Use `--output-format stream-json` and `--print` flags to drive it non-interactively
4. Pipe messages in/out

This is actually how Cline and Zed integrate with Claude Code — they talk to the local binary rather than the SDK, which lets them ride the user's subscription.

**What this means for your plugin**

The user prerequisite becomes: "have Claude Code installed and logged in" — which is a very reasonable ask for your target audience (people already using Claude Code in VS Code). The plugin itself has zero auth, zero API key, zero separate billing. It just calls the binary the user already has.

The tricky part on the Obsidian side is that plugins run in a sandboxed Electron environment. You'd need to use Node's `child_process` via Obsidian's allowed Node APIs (which it does expose to plugins), and you'd need to handle PATH detection so the plugin can find the `claude` binary across different OS installs (typically `~/.local/bin/claude` on Linux/Mac, different on Windows).

That's all very doable — just want you to have a clear picture before committing to the architecture. Want to start scaffolding it out?

---

**Scott:** So this sounds like you've described 3 approaches - api, sdk, and direct calls - am i understanding what you're describing?

---

**Claude:** Yes, that's right. And they form a natural spectrum:

**Direct API** — your plugin calls Anthropic's REST API directly with an API key. Most flexible, most control, but requires every user to have a Console account and API credits separate from their subscription.

**Agent SDK** — same thing essentially, just with a nicer TypeScript wrapper around those API calls. Still requires an API key. The SDK docs even explicitly say you can't use subscription login for third-party apps.

**CLI subprocess** — your plugin shells out to the `claude` binary that's already installed on the user's machine. No API key, no separate billing — it runs under whatever auth the user already set up (`claude login`). This is the only approach that genuinely works for "install the plugin, it just works if you have Claude Code."

So the third one is the right fit for your goal of sharing the plugin broadly. The tradeoff is that it's the least clean integration — you're parsing CLI output rather than working with a proper API response — but it's well-trodden ground since other tools (Cline, Zed) already do exactly this.

---

**Scott:** Explain a bit more about the electron sandbox

---

**Claude:** Obsidian is built on Electron, which means it's essentially a Chromium browser running your plugin code. But unlike a normal browser, Electron can grant access to Node.js APIs — and Obsidian does expose these to plugins.

**What you can do**

Obsidian plugins run in the renderer process but with `nodeIntegration` enabled, so you have access to Node built-ins like `child_process`, `fs`, `path`, and `os`. That's what makes spawning the `claude` binary possible at all. A normal browser extension couldn't do any of this.

**What the sandbox actually restricts**

The constraints are more about what Obsidian chooses to expose than Electron itself. A few practical ones:

- You can't use arbitrary npm packages by just importing them — the plugin is a single bundled file, so anything you need gets bundled in at build time with esbuild or rollup
- You don't have direct access to the main process, just the renderer — though for spawning a subprocess this doesn't matter since `child_process` is available in the renderer when nodeIntegration is on
- Obsidian's plugin review process (for community plugins) scrutinizes any network calls or subprocess execution, so you'd need to be transparent about what you're calling and why

**The actual practical concern for your plugin**

The real issue isn't the sandbox per se, it's environment inheritance. When Obsidian launches, it may not inherit the user's full shell environment — particularly `PATH`. So even if `claude` is installed at `~/.local/bin/claude`, the spawned subprocess might not find it because that directory isn't in the PATH that Obsidian sees.

You'd need to handle this explicitly — either by detecting the likely install locations per OS and checking them directly, or by spawning a shell first (`bash -l -c "which claude"`) to resolve the PATH the way the user's terminal would, then using the absolute path for subsequent calls.

It's a solvable problem, just one you have to consciously design around rather than discovering it later when users report "it can't find claude."

---

**Scott:** Would the sandbox/shell environment cause any issues with Claud's abilities (searching web, CRUD files, etc.)?

---

**Claude:** Mostly no — and this is actually one of the nice things about the subprocess approach.

**Claude Code's capabilities are self-contained**

When you spawn the `claude` binary, it runs as its own independent process. Its file operations, web access, bash execution — all of that happens at the OS level from Claude's process, not through Obsidian's sandbox. Obsidian's renderer environment is just the thing that launched it. Once it's running, the sandbox is essentially irrelevant to what Claude can do.

**Working directory is the important one**

The one thing that directly affects Claude's file capabilities is what working directory you set when spawning it. That becomes Claude's "project" — what it can see, navigate, and operate on. For your plugin, you'd set this to the vault root, and from there Claude can read, write, create, and delete files anywhere within it just as it would in a normal terminal session. You'd pass the vault path explicitly when spawning rather than relying on whatever directory Obsidian happens to be running from.

**Network calls are fine**

Claude Code makes its own HTTP requests from its own process. It doesn't route through Obsidian's network stack, so there's no browser security policy or CORS issue getting in the way.

**The one real concern: Bash tool**

When Claude uses the Bash tool to run commands, those commands inherit the environment of the `claude` process — which inherits whatever environment you passed when spawning it from Obsidian. So if that environment is thin (missing PATH entries, missing environment variables), bash commands Claude tries to run might fail or behave unexpectedly.

The fix is the same as the PATH detection problem — spawn Claude with an explicit, fully-resolved environment rather than just inheriting Obsidian's. Concretely, you'd do a `bash -l -c env` call at plugin startup to capture the user's full shell environment, then pass that when spawning Claude. One-time setup cost, solves it permanently.

---

**Scott:** Interesting. What is Cline and Zed?

---

**Claude:** Both are code editors/tools that integrate with Claude Code via the CLI subprocess approach we were discussing.

**Cline**

An open-source AI coding assistant that runs as a VS Code extension. It's similar in concept to what you're building — it gives you a chat panel inside your editor where an AI agent can read, write, and edit files in your project. It supports multiple AI backends (Claude, GPT, Gemini, etc.) and can connect to a local Claude Code installation to use your subscription rather than direct API calls. It's probably the closest analog to what you're building, just for VS Code instead of Obsidian.

**Zed**

A code editor built from the ground up in Rust, positioned as a fast, modern alternative to VS Code. It has native AI features built in and added Claude Code support more recently — again via the Agent Client Protocol (ACP), which is essentially a standardized way for editors to talk to a locally running Claude Code process. Less relevant as a reference for you since it's a full editor rather than a plugin.

**Why they're relevant to your project**

Cline in particular is worth studying because it's open source and does almost exactly what you're planning — just in a different host environment. Their approach to spawning the subprocess, handling streaming output, managing conversation state, and dealing with tool execution results is all publicly readable. It would save you a lot of trial and error on the messy parts.

Their GitHub repo is `cline/cline` if you want to dig into it.

---

**Scott:** Interesting - so all pretty code problem specific. I use claudecode for a lot more than just code projects already, so it surprises me there's not more alternative usages out there already - obsidian seems kind of fringe and unknown

---

**Claude:** Obsidian has a pretty devoted following — it's not tiny — but you're right that the Claude Code ecosystem is almost entirely code-focused. A few reasons for that:

**Claude Code was positioned and marketed as a coding tool**

The name, the docs, the examples, the integrations — everything signals "for developers." So the people building on top of it are developers who think about developer problems. The broader use case of "agentic assistant that can manage a corpus of files" hasn't really been explored because that's not the frame people brought to it.

**The people who would want it don't know it exists**

Writers, researchers, knowledge workers using Obsidian — they're not generally the audience following Anthropic's developer releases. They might be heavy claude.ai users but they don't necessarily know Claude Code is a thing, let alone that it could be adapted for their workflow.

**The people who do know about it think of it as a coding tool**

Developers who use Claude Code daily, like you, have already adapted their mental model to include non-code uses. But that's kind of self-selected — you're a developer so you found it. Most people in that situation don't then go build the bridge to non-developer communities.

**Which is actually the interesting opportunity**

What you're describing — an Obsidian plugin that brings Claude Code's file management and agentic capabilities to knowledge workers — is genuinely underexplored territory. The Obsidian community in particular has a strong culture of sharing plugins and workflows, so if you built something polished it could travel pretty far beyond just being your own tool.

---

**Scott:** Is claudecode available in anthropic's free tier?

---

**Claude:** No. The free tier excludes access to the agentic Claude Code capabilities — it's limited to basic chat. Claude Code is only unlocked when you subscribe to one of the paid tiers.

So the minimum requirement for your plugin's users would be a Pro subscription at $20/month. That's actually a reasonable barrier in a good way — it means your target audience is people already invested enough in Claude to be paying for it, which correlates well with people likely to want an Obsidian integration.

---

**Scott:** When you refer to agentic, you mean like having claudecode edit files and execute commands, correct? Which claude.ai cannot do?

---

**Claude:** Mostly correct, but worth a small clarification.

Claude.ai actually can do some agentic things now — it has web search, can run code in a sandbox, and has connectors. But it's sandboxed to Anthropic's environment. It can't touch your local filesystem, run arbitrary commands on your machine, or operate outside the browser context.

Claude Code is "agentic" in the fuller sense — it runs on your machine, so it can:

- Read and write files anywhere on your filesystem
- Execute arbitrary shell commands
- Interact with your local tools (git, npm, compilers, etc.)
- Persist changes that actually affect your system

The distinction is really **local vs. sandboxed**. Claude.ai's "agentic" features operate in Anthropic's cloud sandbox. Claude Code's operate on your actual machine with your actual files.

For your Obsidian plugin, this is exactly why the Claude Code approach is the right one — you want Claude to actually modify vault files, move notes around, create new ones, run scripts. Claude.ai could theoretically help you think about your vault but couldn't touch it. Claude Code can reach into the vault directory and do real work.

So when the free tier docs say it excludes "agentic capabilities," they specifically mean it won't run Claude Code — the local, filesystem-level, command-executing version. The free tier Claude is just the chat interface with no local access.

---

**Scott:** Thank you for the clarification. I've never written am obsidian plugin, so can you give me an idea of what's going to be involved? Dev env, tools… is it compiled? And complexity… what are we looking at here? Is this a 1 person plus claude code project? A couple days work or a couple months?

---

**Claude:** Good questions. Let me give you a realistic picture.

**The stack**

Obsidian plugins are TypeScript, bundled with esbuild into a single `main.js` file. So yes, compiled — but it's a fast, simple build step, not like Unreal's shader compilation. The official plugin template uses a one-liner npm build command and has a watch mode for development. If you're comfortable with TypeScript (or even just JavaScript) you're already home.

**Dev environment**

Pretty lightweight:
- Node.js and npm
- VS Code (ironic given what you're building, but it's just a text editor here)
- The official Obsidian sample plugin as a starting template
- Your actual Obsidian vault for live testing — you just drop the built plugin files into `.obsidian/plugins/your-plugin/` and reload

There's no simulator or emulator. You test directly in Obsidian, which is actually convenient. Hot reload plugins exist to make the iteration loop faster.

**What the plugin actually needs to do**

Breaking it into discrete pieces:

- Register a sidebar panel (the chat UI) — straightforward, well-documented
- Build the chat interface in HTML/CSS within that panel — moderate, mostly UI work
- Detect the `claude` binary on the user's system — small but fiddly across OS/install variations
- Spawn the claude process pointed at the vault root — moderate, involves child_process and streaming output parsing
- Parse Claude's stream-json output format and render it in the UI — this is the most complex piece
- Handle conversation history across turns — moderate
- Settings page for things like binary path override — easy

**Complexity and time estimate**

Honest assessment for a solo developer with Claude Code helping: this is a **weeks project, not months**. If you were doing it without AI assistance it might be 4-6 weeks of part-time work. With Claude Code actively helping write the boilerplate, the subprocess handling, and the UI components, you're probably looking at **1-2 weeks of focused effort** to get a functional v1 — something you'd actually use daily.

The hardest single part will be the stream-json output parsing and making the conversation feel responsive — getting streaming text to render incrementally rather than dumping all at once. That's maybe 20-30% of the total work.

The things that could stretch the timeline are polish — handling edge cases like Claude asking for permissions mid-task, showing tool execution in the UI, error states, cross-platform PATH detection. A rough but usable v1 is much closer than a polished community plugin.

**Realistic phases**

1. Get the panel rendering and a hardcoded message displaying — half a day
2. Spawn claude, send a prompt, get a response back in the panel — 1-2 days
3. Streaming output rendering, conversation turns working — 2-3 days
4. Settings, binary detection, error handling — 1-2 days
5. Polish, vault context injection, CLAUDE.md integration — ongoing

Given your background — you clearly know how to build things and you use Claude Code daily — this is well within reach as a solo project. The Obsidian plugin API is significantly simpler than Unreal's plugin system.

---

**Scott:** Can you doublecheck your shared memory to get caught up a bit on my background - we just updated it a few moments ago.

---

**Claude:** Got it — the recent additions change my calibration noticeably. Brazil r/s, Splutterfish, Imagine 3D on the Amiga — writing raytracers, rasterizers, a hundred-plus shaders, an NLE, spline editor from scratch. And bare-metal neural nets in the mid-90s before most people knew what backprop was.

I've been explaining things at a level that's too basic for you. The Obsidian plugin breakdown I just gave was written for someone who might not know what a build step is — you obviously don't need that. You've built renderers from scratch; a TypeScript plugin with a subprocess and a streaming parser is a weekend project in terms of conceptual complexity, not weeks.

The genuinely interesting engineering problems in this project for someone at your level are actually pretty narrow:

- The stream-json parsing and incremental UI rendering — making it feel live
- Cross-platform binary detection and environment inheritance done robustly
- Designing the vault context injection so Claude gets useful project awareness without blowing the context window
- How you structure conversation sessions and whether/how you persist them in the vault itself

Everything else is just boilerplate you'll burn through quickly, especially with Claude Code doing the scaffolding.

I'll recalibrate going forward. What would you like to dig into next?

---

**Scott:** Explain a bit more about the vault context injestion and the context window

---

**Claude:** This is actually one of the more interesting design problems in the project.

**The context window problem**

When you spawn Claude and send a prompt, everything Claude "knows" about your vault has to fit in the context window. Claude Code in a code project handles this naturally — it can navigate the filesystem, read files on demand, and builds up context incrementally through tool calls. That same mechanism works here, but a vault has different characteristics than a codebase.

A large Obsidian vault might have hundreds or thousands of notes, interconnected through links and tags, with meaning that's often distributed — a single note might only make sense in relation to five others. Code has imports and explicit dependencies; Obsidian has softer, semantic relationships. So the question is how much you inject upfront versus let Claude discover through tool calls.

**What you'd actually inject**

At minimum, before any conversation turn you'd want to give Claude:

- The vault's folder structure — a tree of paths gives it navigational awareness without content cost
- The CLAUDE.md file if present — this is Claude Code's native mechanism for project context, and it would work perfectly here for vault-level instructions the user writes themselves
- Potentially an index of note titles and maybe first lines — enough for Claude to know what exists and make intelligent decisions about what to read

What you'd leave for on-demand tool calls is the actual note content. Claude asks to read specific files as it needs them, which is exactly how it handles large codebases.

**The interesting design tension**

The tricky part is that Obsidian's value is in the relationships between notes — backlinks, tags, dataview queries, MOCs. A flat file list doesn't capture that graph structure. So you have choices:

- Inject a richer representation — include backlink counts, tags, maybe the wikilink graph — at higher upfront token cost
- Build a smarter tool set — give Claude a `search_vault` tool that queries across content and metadata, so it can explore the graph semantically rather than you trying to summarize it upfront
- Let the user guide context explicitly — a "pin this note" mechanism in the UI that adds specific notes to the system prompt for the session

The third option is probably the most practical for v1 and actually aligns well with how people use Obsidian — users already think in terms of "I'm working in this area of my vault right now."

**CLAUDE.md as a first-class feature**

One thing worth designing around deliberately: Claude Code already knows to look for CLAUDE.md at the project root. If you set the working directory to the vault root when spawning, that behavior comes for free. You could encourage users to maintain a vault-level CLAUDE.md that describes their organizational system, their conventions, key areas — and Claude will naturally use it without you doing anything special. That's a nice zero-cost feature.

**Context window size**

Current Claude models have large context windows — hundreds of thousands of tokens — so you have room to be generous with upfront injection. The cost is latency and, if you ever route through the API, token cost. Via the CLI subprocess on a subscription it's less of a monetary concern, more of a "don't make the first response slow" concern. A vault tree and a reasonable index is probably a few thousand tokens — trivial.

---

**Scott:** I so this is just about initializing things. My thought was to give claude a folder structure and let the rest of the context discovery be user driven - like yoi said, the user could tell claude that they're working in a specific folder, have it review those files, then work from there.

---

**Claude:** Yes, and that's honestly the right call for v1. It's the most natural interaction model anyway — it mirrors how you'd brief a human collaborator. "Here's the vault structure, I'm working in /Projects/ClientX, go read those files and let's talk about reorganizing them."

The folder tree as the initialization payload is clean because it's cheap, it gives Claude genuine navigational awareness, and it lets the user reference paths naturally in conversation without Claude having to guess at structure.

A few things worth thinking about in that model:

**The tree representation matters**

A raw filesystem tree is fine but Obsidian vaults often have meaningful folder depth. You probably want to collapse branches below a certain depth by default — show top 2-3 levels, let Claude drill down via tool call if needed. A vault with deeply nested folders could produce a noisy tree otherwise.

**Conversation persistence**

Since the user is manually directing context, session continuity becomes important. If they've spent the first few turns getting Claude oriented in a folder, losing that on the next Obsidian launch would be frustrating. Worth thinking about whether you serialize conversation history to a file in the vault — which has a nice symmetry, the vault storing its own AI conversation history.

**The CLAUDE.md angle**

With user-driven context, CLAUDE.md becomes even more valuable as a way to persist orientation across sessions without repeating yourself. A user could maintain a "current focus" section in their CLAUDE.md that Claude reads on startup — effectively a persistent context hint they curate themselves. That's something you could document as a recommended pattern rather than build explicitly.

The approach you're describing is simple, transparent, and puts the user in control — which fits Obsidian's philosophy pretty well actually.

---

**Scott:** Dig. Typically when i spin up a new project, i give claude a few initial instruction, tell it what files i want it to use for background/orientation/starting, and then have it generate it's own claude.md file with the instruction to maintain that file by itself as we work.

The session continuity (memory) - how is that handled in the vscode implementation? Does cline do something different?

---

**Claude:** Good timing to look this up because the answer is richer than I expected.

**How Claude Code actually handles it**

Each new session starts with a fresh context window, without the conversation history from previous sessions. Claude can persist learnings across sessions using auto memory, and you can add your own persistent instructions in CLAUDE.md. Each Claude Code conversation is a session tied to your current directory.

But it's not as blunt as "everything is lost." Claude Code saves every conversation locally in `~/.claude/history.jsonl`, and sessions are resumable. When you resume a session with `claude --continue` or `claude --resume`, you pick up where you left off using the same session ID. New messages append to the existing conversation. Your full conversation history is restored.

So the two-tier model is:
- **Within a session** — full rolling context, with automatic compaction when the window fills up
- **Across sessions** — sessions are stored and resumable, but a new session starts fresh unless you explicitly resume

Claude Code manages context automatically as you approach the limit. It clears older tool outputs first, then summarizes the conversation if needed. Put persistent rules in CLAUDE.md rather than relying on conversation history.

**The CLAUDE.md implication**

This is why your workflow of having Claude generate and maintain its own CLAUDE.md is genuinely the right pattern — it's the designed mechanism for cross-session persistence. Anything important that emerged in conversation should live in that file, because conversation history can get compacted away but CLAUDE.md survives everything.

**For your plugin**

You have a design choice here. You could:

1. **Ride Claude Code's native session management** — pass `--resume` or `--continue` flags when spawning, let the CLI handle history storage in `~/.claude/`. Clean, zero extra work, but sessions are tied to that global store rather than the vault.

2. **Store conversation history in the vault itself** — serialize turns to a JSON file in `.obsidian/` or a dedicated vault folder, inject the relevant history as context when spawning each time. More work but the history travels with the vault, is version-controllable, and fits the Obsidian mental model of "everything lives in the vault."

3. **Hybrid** — use the native session resume for within-session continuity, and lean on CLAUDE.md for cross-session context.

Given your existing workflow, option 3 is probably the natural fit — and storing conversation history in the vault as markdown files would actually be a feature in Obsidian's world, not just an implementation detail. People would want to reference past sessions as notes.

---

**Scott:** I think we'd have a "current" session that we'd auto resume on launch/restart, with a "new conversation" button ("+") to start new conversations.

For the "claude.md" file - could we choose some other filename or location and just inject that manually at startup? This could be in the plugin settings or something. I don't like the current behavior in claude code as it clutters my project roots.

---

**Claude:** Both of those are straightforward.

**Session UX**

Auto-resume on launch is the natural behavior — last active session just continues. The `+` button starts a new session, which gets written to `.obsidian/claude/sessions/` with a timestamp and auto-generated title. Maybe a session list accessible somewhere in the panel for pulling up older ones. Clean and familiar — it's basically how every chat app works.

**Custom context file**

Yes, absolutely — and this is actually one of the advantages of the subprocess approach over using the SDK directly. Since you're managing context injection yourself, you can read any file from anywhere and prepend it to the conversation as a system prompt when spawning. CLAUDE.md is just a convention Claude Code follows natively; you're not bound by it at all.

So in plugin settings you'd have something like:

- **Vault context file** — path relative to vault root, defaults to something like `_claude-context.md` or whatever the user wants
- Falls back gracefully if the file doesn't exist

On spawn, the plugin reads that file, builds the system prompt — folder tree plus context file contents plus whatever session history is being resumed — and passes it in. Claude has no idea whether it came from CLAUDE.md or a file called `my-llm-notes.md` buried in a subfolder.

This also means the user could have different context files for different workflows and swap them in settings, or even surface that as a more dynamic feature later — like a "load context from this note" command that temporarily adds a specific file to the active session's context.

The clutter issue you're describing with CLAUDE.md is a real and common complaint. Owning that piece entirely in the plugin is a straightforward win.

---

**Scott:** Temporary, selectable context - i like that. I'm stealing that idea - haha :-)

---

**Claude:** It actually fits Obsidian's model really well — notes are already the unit of organization, so "add this note to Claude's context" is a natural gesture. You could extend it further:

**Some directions that idea goes**

- **Pinned context** — notes that persist across sessions, set in settings or toggled in the UI. Your vault conventions doc, a reference sheet, whatever.
- **Session context** — notes added for just the current conversation, cleared on `+`. "Read this meeting transcript while we work on this."
- **Inline context via a command** — right-click a note in Obsidian's file explorer, "Add to Claude context." Drops it into the active session without leaving the note you're in.
- **Context from selection** — highlight text in a note, send it to Claude as context rather than a prompt. Useful for "here's the relevant section, now do X."

The underlying mechanic is the same for all of them — just a list of file paths the plugin reads and injects before each turn. The UI variations are just different ways of managing that list.

The interesting design question is whether context is injected once at session start or re-injected on every turn. Re-injecting every turn is more reliable since you don't have to worry about it getting compacted away, but it costs tokens. For a small set of pinned notes it's probably worth just always including them.

At this point you're basically designing a proper context management layer on top of Claude Code, which is something that doesn't exist yet in any tool. That's the real value of the plugin beyond just "Claude in Obsidian."

---

**Scott:** Interesting - could have per note context via yaml front matter on a note - could be like a "don't edit this file" or "always refer to these instructions before changing anything in this note". Very powerful - i could use that yesterday

---

**Claude:** That's a genuinely elegant idea because it uses Obsidian's native metadata system — you're not inventing a new convention, you're extending one that already exists.

**The frontmatter schema could be something like:**

```yaml
---
claude:
  protect: true
  instructions: "Never modify this file directly. Treat as reference only."
---
```

Or more granular:

```yaml
---
claude:
  readonly: true
  context: "always"
  instructions: "This is the canonical taxonomy. Suggest changes but don't apply them."
---
```

**What the plugin does with it**

When Claude is about to write to a file, the plugin checks the frontmatter first. If `protect` or `readonly` is set, it intercepts the tool call before it executes and either blocks it or prompts the user. The instructions get injected as context whenever that file is read or referenced in a session.

The `context: always` variant is interesting — notes tagged that way automatically join every session's context without the user having to think about it. A master index note, a style guide, a cast of characters in a writing project. Always present, never cluttering the conversation manually.

**It gets more powerful combined with the folder tree injection**

When you build the initial folder tree at session start, the plugin could scan frontmatter across the vault and include a digest — "these 4 notes are marked always-context, these 12 are protected." Claude knows the shape of the vault's constraints before any conversation starts.

**The meta-irony**

You'd essentially be building a permission and instruction system for Claude baked into the vault's own note metadata. The vault becomes self-describing in terms of how Claude should interact with it. That's a fundamentally different and richer model than anything that exists in code-focused tools — CLAUDE.md is a single file, this is distributed intelligence across the entire vault.

Worth capturing this in a design doc before you start coding — this is getting substantial enough that you'll want it written down.

---

**Scott:** Yea, this is great - could you generate a thorough design document with specs and user story elements based on this conversation? Markdown artifact. Also create a markdown, verbatim transcript of this convo so that i can move it into a code project. Thanks. Is there anything else that should be written up before i leave this convo?

---

*[Documents generated — see accompanying files]*
