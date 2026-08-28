# Product Requirements Document (PRD) — Parma

## 1. Overview & Vision
**Parma** is a lightweight, database-free, privacy-first web wiki layered directly over a directory of plain Markdown files (e.g., an Obsidian vault, Git repository, or personal folder). 

Many personal, family, and homelab knowledge bases suffer from database lock-in, proprietary cloud schemas, or heavy server requirements. Parma restores simplicity: your filesystem is the source of truth. Any change in Obsidian, VS Code, or a Git pull immediately reflects in Parma, and any edit in Parma is written directly to disk as human-readable standard Markdown with co-located media.

## 2. Core Personas
1. **The Self-Hoster / Homelabber**: Wants a clean, fast web portal for house manuals, appliance guides, network configs, and emergency checklists hosted on a Raspberry Pi or home server.
2. **The Obsidian User on the Go**: Wants to access, search, view backlinks, and edit their Obsidian vault from any mobile device, tablet, or secondary browser without needing third-party sync subscriptions.
3. **The Family / Team Collaborator**: Needs a Wikipedia-clean web interface for shared family knowledge, recipes, and procedures where non-technical members can read and contribute easily.

## 3. Key Principles & Non-Goals
- **No Database**: Notes are plain `.md` files; images are co-located or folder-relative. Zero SQL, zero SQLite migrations.
- **Zero Lock-in**: Full compatibility with Obsidian, GitHub Flavored Markdown (GFM), and standard editors.
- **Atomic File Operations**: Edits and uploads are committed atomically to prevent data corruption.
- **Responsive & Accessible**: Wikipedia-inspired, typography-driven reading experience that looks beautiful on desktop and mobile alike.
- **Instant Graph & Search**: Real-time indexing of wikilinks, backlinks, and full-text content in memory with live file watching.

## 4. MVP Feature Set
1. **Vault Tree Explorer**:
   - Hierarchical folder navigation with expand/collapse, active item indicators, file creation, and deletion.
2. **Wikipedia-Style Reader Mode**:
   - Clean serif / sans-serif typography, dark/light theme support.
   - Live wikilink resolution (`[[Note]]`, `[[path/Note|Alias]]`, `[[#Heading]]`).
   - Callout formatting (`> [!NOTE]`, `> [!WARNING]`, `> [!TIP]`, `> [!IMPORTANT]`, etc.).
   - Auto-generated Table of Contents (TOC).
   - Co-located image rendering (`![[image.png]]`, `![alt](image.png)`, figure elements).
3. **Markdown Editor Mode**:
   - Formatting toolbar (headings, lists, tasks, wikilinks, code, quotes, callouts).
   - Photo/Image Upload Modal with custom filename, caption input, and instant figure markup insertion.
   - Atomic disk write on save (`Cmd/Ctrl+S`).
4. **Knowledge Graph & Backlinks**:
   - Backlinks sidebar drawer showing all incoming references with contextual snippets.
   - Interactive 2D Graph visualization of note connections with search filter and local/global view.
5. **Fast Search Palette**:
   - Global `Cmd/Ctrl+K` quick-open modal with fuzzy match on note titles and full-text body snippets.
6. **Container & Deployment**:
   - Single multi-stage Dockerfile and `docker-compose.yml` for effortless homelab deployment.

## 5. Success Metrics
- Sub-50ms API response time for tree scanning and note reads.
- 100% data fidelity when switching back and forth between Obsidian/VS Code and Parma.
- Zero data loss under concurrent or interrupted write operations (enforced via atomic rename).
