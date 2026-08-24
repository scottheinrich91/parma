# User Story Backlog — Parma

> **Status:** Draft  
> **Organization:** Epics and prioritized user stories.

---

## Epic 1: Core Filesystem & Vault Engine
- [ ] **US1.1:** Single container Dockerfile mounting `/vault` volume.
- [ ] **US1.2:** Recursive directory scanner generating nested JSON tree structure.
- [ ] **US1.3:** Filesystem watcher (`inotify`) publishing change events over SSE/WebSocket.
- [ ] **US1.4:** Safe atomic file CRUD (read, write, rename, create, delete).

## Epic 2: Markdown & Wikilink Pipeline
- [ ] **US2.1:** CommonMark rendering with Obsidian Callouts (`> [!NOTE]`).
- [ ] **US2.2:** Bidirectional `[[wikilink]]` parser resolving cross-folder paths.
- [ ] **US2.3:** YAML Frontmatter parsing for note metadata, tags, and custom titles.

## Epic 3: Mobile UX & Non-Technical Editor
- [ ] **US3.1:** Responsive mobile-first layout with touch-friendly navigation drawer and bottom bar.
- [ ] **US3.2:** Visual/hybrid Markdown editor with rich formatting toolbar for non-technical users.
- [ ] **US3.3:** Mobile camera & photo gallery upload sheet with custom filename and caption fields.
- [ ] **US3.4:** Automatic in-directory image saving and Markdown figure insertion.
- [ ] **US3.5:** Tap-to-zoom image lightbox for mobile view.

## Epic 4: Knowledge Graph & Search
- [ ] **US4.1:** In-memory link graph indexer calculating backlinks and forward links.
- [ ] **US4.2:** Interactive 2D/3D force graph visualization on web and mobile canvas.
- [ ] **US4.3:** Fast in-memory full-text search across titles, content, and tags.

## Epic 5: Packaging & Documentation
- [ ] **US5.1:** Multi-arch Docker images (amd64 / arm64) published to GitHub Container Registry (ghcr.io).
- [ ] **US5.2:** Example docker-compose setups and homelab getting-started guide.
