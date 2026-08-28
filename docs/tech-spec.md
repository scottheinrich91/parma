# Technical Specification — Parma

## 1. Architecture Overview
Parma is structured as a full-stack TypeScript application composed of a high-performance Node.js backend using Hono (with `@hono/node-server`) and a responsive single-page frontend built with React, Vite, and Tailwind CSS.

```
+-------------------------------------------------------------+
|                      Browser / Client                       |
|  React 18 + Vite + Tailwind CSS + Lucide + Force Graph      |
+------------------------------+------------------------------+
                               | REST API / JSON / Media
+------------------------------v------------------------------+
|                     Node.js / Hono API                      |
|  - Vault Scanner & Watcher      - In-memory Wikilink Graph  |
|  - Atomic Markdown Read/Write   - Full-text Search Indexer  |
|  - Co-located Media Server      - File Upload Handler       |
+------------------------------+------------------------------+
                               | Direct File I/O
+------------------------------v------------------------------+
|              Filesystem Vault (e.g., /vault)               |
|  - Folders, .md Notes, Co-located .svg/.png/.jpg Assets     |
+-------------------------------------------------------------+
```

## 2. Backend Services & Endpoints

### 2.1 Configuration
- `VAULT_PATH`: Root directory of the markdown vault. Defaults to `./sample-vault` in local development and `/vault` in container runtime.
- `PORT`: HTTP port to bind (default `3000`).

### 2.2 Endpoints Specification
- `GET /api/tree`
  - Recursively scans `VAULT_PATH`.
  - Filters out hidden files/folders (`.git`, `.obsidian`, `.DS_Store`, `.tmp*`).
  - Returns nested structure: `{ root: string, tree: VaultNode[] }`.
  - `VaultNode`: `{ id: string, name: string, path: string, type: 'file' | 'directory', extension?: string, size?: number, updatedAt?: string, children?: VaultNode[] }`.

- `GET /api/note?path=<relative_path>`
  - Sanitizes path to strictly prevent directory traversal (e.g., `../`).
  - Reads raw markdown and extracts optional YAML frontmatter.
  - Returns: `{ path: string, title: string, content: string, frontmatter: Record<string, any>, stats: { size: number, mtime: string } }`.

- `POST /api/note`
  - Body: `{ path: string, content: string }`.
  - Atomic write strategy:
    1. Creates target directory recursively if it doesn't exist.
    2. Writes data to a temporary file (`.filename.tmp.<uuid>`) in the target directory.
    3. Issues atomic `fs.promises.rename()` replacing the target note.
    4. Triggers immediate re-indexing of the wikilink graph and search engine.
  - Returns: `{ success: true, path: string }`.

- `DELETE /api/note?path=<relative_path>`
  - Deletes file or empty directory from the vault.

- `POST /api/upload`
  - Multipart form data containing:
    - `file`: Binary file stream (image/audio/pdf).
    - `notePath`: Relative path of the active note.
    - `customName` (optional): User-specified filename.
  - Resolves note's enclosing folder and writes the asset directly co-located with the note.
  - Returns: `{ filename: string, relativePath: string, mediaUrl: string, markdownSnippet: string }`.

- `GET /api/media/*`
  - Safe asset streaming for co-located images and media.
  - Validates file type against allowed mime types (`image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`, `image/gif`, `application/pdf`).
  - Supports HTTP range requests, caching headers (`ETag`, `Cache-Control`).

- `GET /api/graph`
  - Returns in-memory indexed graph `{ nodes: GraphNode[], links: GraphLink[] }`.
  - `GraphNode`: `{ id: string, label: string, path: string, exists: boolean, incomingCount: number, outgoingCount: number, folder: string }`.
  - `GraphLink`: `{ source: string, target: string, label?: string }`.

- `GET /api/backlinks?path=<relative_path>`
  - Returns list of notes linking to the given note with contextual snippets and line numbers.

- `GET /api/search?q=<query>`
  - Fast in-memory full-text search with tokenization, ranking, match highlighting, and line context.

## 3. Wikilink Parsing & Resolution Engine
Wikilinks are extracted via regular expressions:
- Pattern: `/\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g`
- Resolution algorithm:
  1. Exact relative match in current note folder.
  2. Exact match relative to vault root.
  3. Case-insensitive basename lookup across the entire vault.
  4. Non-existent note detection (allows visual distinction for "ghost/wanted" notes and one-click creation).

## 4. Security & Hardening
- **Path Traversal Protection**: Every incoming path is normalized with `path.resolve(VAULT_PATH, sanitizedPath)`. If the resulting path does not start with `VAULT_PATH`, a 403 Forbidden is returned.
- **Allowed File Types**: Markdown notes must end with `.md` or `.markdown`. Media endpoints strictly restrict serving to whitelisted image/media extensions.
- **Atomic Operations**: All writes use temporary file allocation followed by atomic renames to avoid partial writes or corruption during power loss or server restarts.
