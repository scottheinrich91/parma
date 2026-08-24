# Technical Specifications — Parma

> **Status:** Draft  
> **Purpose:** Engineering architecture for zero-database, mobile-first Markdown wiki with in-directory media handling.

---

## 1. Architecture Overview
Parma runs as a single lightweight container hosting a backend service (Go or Node/TypeScript) and a pre-built responsive single-page web application (Svelte/Vue/React).

```
┌──────────────────────────────────────────────────────────┐
│                   Web / Mobile Client                    │
│   (Responsive SPA + Visual Editor + D3 Graph + PWA)      │
└──────────────▲─────────────────────────────┬─────────────┘
               │ HTTP / SSE / REST           │ Multipart Form
               │                             │ (Media Uploads)
┌──────────────┴─────────────────────────────▼─────────────┐
│                     Parma Engine                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │ REST API: /api/tree, /api/note, /api/graph, /api/fs │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ AST Parser: Markdown + Wikilinks + Callouts        │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ Media Manager: Upload, in-directory save, naming   │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ In-Memory Indexer: Bi-directional link graph & FTS │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ FS Watcher: inotify/fs events -> real-time updates │  │
│  └────────────────────────┬───────────────────────────┘  │
└───────────────────────────┼──────────────────────────────┘
                            ▼
                Mounted Host Volume: /vault
           ├── Home/
           │   ├── Living Room.md
           │   ├── thermostat-setup.jpg   <-- Co-located media
           │   └── Appliances/
           │       ├── Dishwasher.md
           │       └── filter-clean.png
           └── Recipes/
```

---

## 2. Media Upload & Asset Pipeline
1. **Upload Request:** Client uploads image via `multipart/form-data` with target note path, custom filename, and caption.
2. **File Storage:** Backend writes binary image directly into the note's enclosing directory on disk (e.g. `/vault/Home/Appliances/filter-clean.png`).
3. **Markdown AST Insertion:** Editor automatically appends or inserts the relative markdown reference:
   ```markdown
   ![Dishwasher filter cleaning steps](./filter-clean.png)
   ```
4. **Asset Serving:** Static file handler serves image routes relative to the vault root safely preventing directory traversal attacks.

---

## 3. Link Resolver & Graph Engine
- In-memory SQLite FTS5 or Tantivy/Pagefind for instant text search.
- Bidirectional link map maintained in memory, re-indexed on file modification events.
- Wikilink resolution handles relative paths and vault-wide unique note names (`[[Dishwasher]]` -> `/Home/Appliances/Dishwasher.md`).
