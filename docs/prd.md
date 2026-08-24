# Product Requirements Document (PRD) — Parma

## 1. Overview & Problem Statement
Knowledge workers, homelabbers, and writers frequently organize their personal notes and documentation in plain-text Markdown vaults (such as Obsidian). Existing self-hosted wiki solutions (e.g., BookStack, MediaWiki, Wiki.js) require heavy relational database backends, proprietary storage schemas, or complex sync pipelines.

Parma solves this by acting as a lightweight, containerized, database-free web wiki layered directly over an existing directory of Markdown files. It provides bidirectional read/write editing, automatic wikilink resolution, asset/attachment handling, full nested folder navigation, and visual graph exploration while keeping the filesystem as the single source of truth.

---

## 2. Goals & North Star
- **Zero-Database Simplicity:** Single container deployment; the host filesystem is the sole source of truth.
- **Markdown-Native Read & Write:** Full editing, file creation, renaming, and folder management directly modifying `.md` files on disk.
- **Obsidian-Compliant (Not Obsidian-Reliant):** Seamlessly works on vanilla Markdown folders, but automatically respects Obsidian conventions (wikilinks `[[...]]`, callouts `> [!NOTE]`, frontmatter, and `.obsidian/app.json` attachment paths) when present.
- **Interconnected Knowledge:** Fast backlinks, forward links, and interactive 2D/3D graph visualization of note connections.
- **Lightweight & Self-Hosted:** Minimal resource footprint, effortless docker-compose / container deployment.

---

## 3. Target Audience
- Homelab enthusiasts and self-hosters wanting a lightweight, personal or team wiki.
- Obsidian users seeking a zero-config web interface to browse, search, and edit their vault across devices without paid sync services.
- Developers and writers who prefer plain Markdown and git-friendly knowledge bases.

---

## 4. Key Functional Requirements

### 4.1. File System & Storage
- Direct mounting of a host folder (`/vault`) as read-write or read-only.
- Automatic file watching (`inotify`/filesystem events) to reflect external changes in real time.
- Nested directory tree navigation matching the host directory structure.
- Safe CRUD operations (atomic file writes, directory creation, rename/move with optional link refactoring).

### 4.2. Markdown Parsing & Rendering
- CommonMark / GFM compliance.
- Bidirectional Wikilink resolution (`[[Page Name]]`, `[[Page Name|Alias]]`, `[[Page Name#Header]]`).
- Obsidian-style Callouts (`> [!NOTE]`, `> [!WARNING]`, etc.).
- YAML/TOML Frontmatter extraction (tags, aliases, title overrides).
- Attachment and image rendering:
  - Standard markdown relative links `![](path/to/image.png)`.
  - Obsidian-style embeds `![[image.png]]`.
  - Attachment folder discovery via `.obsidian/app.json` or fallback directory search.

### 4.3. Editor & Write Experience
- Modern in-browser Markdown editor (split-pane preview or live preview mode).
- Real-time save / auto-save to disk.
- Wikilink auto-complete (`[[`) indexing available vault notes.
- Quick note creation and folder management.

### 4.4. Knowledge Graph & Search
- In-memory link graph indexer calculating all incoming and outgoing connections.
- Global vault graph visualization and localized page graph (configurable depth).
- Fast in-memory full-text search across titles, tags, and note content without external database daemons.

---

## 5. Non-Functional Requirements
- **Performance:** Instant page load and search across vaults with 5,000+ notes.
- **Portability:** Available as a multi-arch Docker container (amd64 / arm64).
- **Resource Footprint:** Sub-100MB idle memory footprint.
- **Open Source:** MIT License.

---

## 6. Out of Scope (v1)
- User authentication / multi-user role management (can be proxied via Authelia/Authentik/Tailscale in homelabs).
- Complex cloud sync integrations (git/Dropbox) — rely on host filesystem syncing.
- AI / LLM / Agentic reasoning layers (Parma is focused purely on fast, deterministic markdown wiki rendering and editing).
