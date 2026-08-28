# Parma

Markdown-native personal & household wiki.

> *Named after **Parma** (Quenya for "book" or "written parchment") — keeping knowledge etched in plain, enduring text.*

Parma is a lightweight, database-free, privacy-first web wiki layered directly over a directory of plain Markdown files (such as an Obsidian vault, Git repository, or local folder). Your filesystem is the source of truth: changes made in Obsidian, VS Code, or Parma sync in real-time with zero database overhead.

---

## ✨ Features

- **Filesystem-First**: Notes are plain `.md` files and images are co-located in your vault. Zero SQL databases or proprietary schemas.
- **Wikipedia-Style Reader**: Beautiful typography, GitHub alerts/callouts (`[!NOTE]`, `[!WARNING]`, `[!TIP]`, etc.), interactive task lists, and auto-generated Table of Contents.
- **Live Wikilinks**: Bidirectional note linking (`[[Note]]`, `[[Folder/Note|Alias]]`, `[[#Heading]]`) with dead-link detection and instant creation.
- **Markdown Editor**: Integrated editor with formatting toolbar, keyboard shortcuts (`Cmd/Ctrl+S`), and instant image upload with caption formatting.
- **Knowledge Graph**: Interactive 2D force-directed visualization of note connections and backlinks drawer.
- **Instant Search**: Fast full-text and title search palette (`Cmd/Ctrl+K`).
- **Dark & Light Modes**: Clean high-contrast themes respecting system preferences with manual override.
- **Atomic Operations**: Safe disk writes using atomic rename to prevent file corruption.
- **Container Ready**: Production multi-stage Docker build and Docker Compose configuration.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm 10+

### Local Development

```bash
# Clone repository
git clone https://github.com/scottheinrich91/parma.git
cd parma

# Install dependencies
npm install

# Start development server (backend on :3000, Vite client on :5173)
npm run dev
```

### Production Build

```bash
# Build frontend and backend
npm run build

# Run unit and integration tests
npm test

# Start production server
npm start
```

---

## 🐳 Docker Deployment

Run Parma with Docker Compose in seconds:

```bash
# Clone the repository
git clone https://github.com/scottheinrich91/parma.git
cd parma

# Start the container (mounts ./vault to /vault)
docker compose up -d
```

### Manual Docker Run

```bash
docker build -t parma .
docker run -d -p 3000:3000 -v /path/to/your/vault:/vault -e VAULT_PATH=/vault parma
```

---

## ⚙️ Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VAULT_PATH` | Path to the local Markdown vault directory | `./sample-vault` (local) / `/vault` (Docker) |
| `PORT` | HTTP server port | `3000` |
| `NODE_ENV` | Runtime environment (`development` / `production`) | `development` |

---

## 📁 Repository Structure

```
parma/
├── client/              # React 18 + Vite + Tailwind CSS frontend
│   └── src/             # SPA components, graph view, and editor
├── server/              # Node.js + Hono backend
│   ├── src/             # Vault scanner, search, graph indexer, media handler
│   └── tests/           # Vitest integration and security tests
├── docs/                # Product requirements, tech spec, and architecture
│   ├── prd.md           # Product Requirements Document
│   ├── tech-spec.md     # Technical Specification & API docs
│   ├── ui.md            # UI/UX & Design Guidelines
│   └── backlog.md       # Roadmap and feature backlog
├── sample-vault/        # Rich sample household knowledge base
├── vault/               # Starter template vault
├── Dockerfile           # Multi-stage production container
├── docker-compose.yml   # Container orchestration
└── package.json         # Workspace manifest
```

---

## 📖 Documentation

- [Product Requirements Document (PRD)](docs/prd.md)
- [Technical Specification](docs/tech-spec.md)
- [UI & UX Specification](docs/ui.md)
- [Roadmap & Backlog](docs/backlog.md)

---

## 📄 License

[MIT](LICENSE)
