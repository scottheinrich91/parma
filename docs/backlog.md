# Product Backlog & Roadmap — Parma

## Phase 1: MVP Core (Current Sprint)
- [x] Full-Stack TypeScript Architecture:
  - [x] Node.js + Hono backend with REST endpoints:
    - `/api/tree`: recursive vault directory scanner.
    - `/api/note`: atomic read/write of markdown notes with frontmatter.
    - `/api/upload`: multipart image upload into note's enclosing folder.
    - `/api/media`: secure co-located asset streaming with MIME validation.
    - `/api/graph`: in-memory wikilink graph indexer & backlink extractor.
    - `/api/search`: fast full-text note search with highlighted snippets.
  - [x] React + Vite + Tailwind CSS frontend:
    - Wikipedia-inspired clean typography & responsive mobile layout.
    - Reading mode with wikilink resolution, callouts, and co-located images.
    - Markdown editor with toolbar and image upload modal.
    - Backlinks panel and 2D interactive knowledge graph visualization.
    - Global quick-open search modal (Cmd+K).
- [x] Dockerfile & docker-compose.yml for easy container deployment.
- [x] Rich sample-vault with household guides, appliances, recipes, callouts, and interconnected wikilinks.
- [x] Automated unit and integration tests.

## Phase 2: Enhanced Collaboration & Portability
- [ ] Change default internal/server port to 3791 (Ring Verse convention across backend, client proxy, and Dockerfile).
- [ ] Multi-vault switcher (switch between household, work, and personal vaults).
- [ ] Bidirectional Git Sync integration with auto-commit / push on edit.
- [ ] PDF export with print-ready Wikipedia-style stylesheet.
- [ ] Offline PWA caching with Service Worker.

## Phase 3: Advanced Intelligence & Automation
- [ ] Unlinked mentions detection in reading and graph views.
- [ ] Optional basic auth / token authentication for public internet reverse-proxy setups.
- [ ] Daily notes calendar and template engine.
- [ ] Excalidraw / Mermaid diagram live rendering in reader mode.
