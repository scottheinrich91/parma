# Product Requirements Document (PRD) — Parma

> **Etymology:** *Parma* is the Quenya (High Elven) word for **"book"** or **"written parchment/scroll"** (and the name of Tengwar Letter #2). It reflects the project's core philosophy: keeping knowledge etched in plain, durable, human-readable text without reliance on an external database engine.

---

## 1. Overview & Problem Statement
Knowledge workers, families, homelabbers, and writers frequently organize their notes, recipes, and home documentation in plain-text Markdown vaults (such as Obsidian). Existing self-hosted wiki solutions (BookStack, MediaWiki, Wiki.js) require heavy relational database backends, while static viewers (Quartz, MkDocs) are read-only.

Parma solves this by acting as a lightweight, containerized, database-free web wiki layered directly over an existing directory of Markdown files. It provides a clean, family-friendly, mobile-first reading and editing interface while keeping the filesystem as the single source of truth.

---

## 2. Goals & North Star
- **Zero-Database Simplicity:** Single container deployment; the host filesystem is the sole source of truth.
- **Mobile-First & Digestible for Non-Technical Users:** Intuitive, friction-free UI on phones and tablets. Anyone in the household can read, search, edit, and snap photos without needing to know raw Markdown syntax.
- **Markdown-Native Read & Write:** Full editing, file creation, renaming, and folder management directly modifying `.md` files on disk.
- **Seamless Media & Photo Management:** Direct camera/gallery upload from mobile; photos saved directly into the note's directory and referenced by clean filenames with automatic wiki-style captioned figures.
- **Obsidian-Compliant (Not Obsidian-Reliant):** Seamlessly works on vanilla Markdown folders, but automatically respects Obsidian conventions (wikilinks `[[...]]`, callouts `> [!NOTE]`, frontmatter, and attachment paths) when present.
- **Interconnected Knowledge:** Fast backlinks, forward links, and interactive 2D/3D graph visualization of note connections.
- **Lightweight & Self-Hosted:** Minimal resource footprint, effortless docker-compose / container deployment.

---

## 3. Target Audience & Personas
- **The Household / Non-Technical Partner:** Wants a clean, friendly home wiki for household manuals, appliance guides, emergency contacts, medical records, and recipes. Needs one-tap mobile editing, intuitive formatting toolbars, and instant photo uploads.
- **The Homelab Enthusiast & Self-Hoster:** Wants a lightweight, single-container wiki that mounts `/vault` and uses zero SQL databases.
- **The Obsidian Power User:** Wants a zero-config web companion to browse and edit their vault across mobile and remote devices with full graph and wikilink fidelity.

---

## 4. Key Functional Requirements

### 4.1. Mobile & Family-Friendly UX
- Responsive, mobile-first design with touch-friendly navigation (drawer file tree, search bar, bottom action bar).
- Visual / WYSIWYG or hybrid rich Markdown editor so non-technical users can format text (bold, lists, headers) without typing raw `#` or `*`.
- Quick-add floating action button on mobile for new notes, quick edits, or snapping a photo.
- Image lightbox / tap-to-zoom for easy viewing on smaller screens.

### 4.2. Media & Photo Upload Pipeline
- **Direct Upload from Mobile & Web:** Native file picker, camera snap on mobile, drag-and-drop, and clipboard paste on desktop.
- **Configurable Asset Naming:** Prompt / dialog on upload allowing users to set a clean, human-readable filename (e.g. `water-shutoff-valve.jpg`) or generate an auto-timestamped name.
- **In-Directory Storage:** Images saved directly in the same folder as the active note (co-located) or routed to the vault's configured attachment directory.
- **Wiki-Style Image & Caption Formatting:** Parma automatically generates and writes the appropriate markdown/figure syntax with optional captions, alignment, and sizing.

### 4.3. File System & Storage
- Direct mounting of a host folder (`/vault`) as read-write or read-only.
- Automatic file watching (`inotify`/filesystem events) to reflect external changes in real time.
- Nested directory tree navigation matching the host directory structure.
- Safe atomic CRUD operations on files and directories.

### 4.4. Markdown Parsing & Rendering
- CommonMark / GFM compliance.
- Bidirectional Wikilink resolution (`[[Page Name]]`, `[[Page Name|Alias]]`, `[[Page Name#Header]]`).
- Obsidian-style Callouts (`> [!NOTE]`, `> [!WARNING]`, etc.).
- YAML/TOML Frontmatter extraction (tags, aliases, title overrides).
- Support for both standard relative image links `![](image.png)` and Obsidian embeds `![[image.png]]`.

### 4.5. Knowledge Graph & Search
- In-memory link graph indexer calculating all incoming and outgoing connections.
- Global vault graph visualization and localized page graph (configurable depth).
- Instant search across titles, tags, and note content without external database daemons.

---

## 5. Non-Functional Requirements
- **Performance:** Instant page loads and sub-50ms search response on mobile devices.
- **Portability:** Multi-arch Docker container (amd64 / arm64) for Raspberry Pis, mini PCs, and NAS appliances.
- **Resource Footprint:** Sub-100MB idle memory footprint.
- **License:** MIT (Open Source).

---

## 6. Out of Scope (v1)
- User authentication / multi-user role management (can be proxied via Authelia/Authentik/Tailscale in homelabs).
- Complex cloud sync integrations (relies on host filesystem).
- AI / LLM / Agentic reasoning layers.
