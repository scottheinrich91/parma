# UI/UX Specification — Parma

## 1. Design Aesthetics & Inspiration
Parma draws inspiration from Wikipedia's clean, distraction-free encyclopedia design, combined with modern Swiss typography and Obsidian's powerful linked-thought workflow.

### Visual Pillars:
- **Typography-First**: Beautiful readability with serif body option (Georgia, Charter, Merriweather) or modern sans-serif (Inter, system-ui).
- **Subtle Modern Accents**: Muted borders, subtle shadows, high contrast for readability, clean table formatting.
- **Theme Modes**: First-class support for Light and Dark modes with automatic OS detection and persistent manual override.

## 2. Layout Structure
```
+-------------------------------------------------------------------------+
| [=] Parma Wiki   [Search Cmd+K...]     [Edit/Read] [Graph] [Sun/Moon]   |
+----------------+----------------------------------------+---------------+
| Vault Tree     | Note Title & Breadcrumb                | Table of      |
| - Home         | -------------------------------------- | Contents /    |
| > appliances/  | Article Body (Markdown Reader)         | Backlinks     |
|   - Espresso   | - Headings                             | Panel         |
|   - Dishwasher | - Embedded Figure Images               |               |
| > recipes/     | - Callouts (> [!NOTE])                 |               |
| > household/   | - Wikilinks ([[Other Note]])           |               |
|                |                                        |               |
+----------------+----------------------------------------+---------------+
```

### 2.1 Navigation Drawer / Sidebar
- Expandable / Collapsible folder hierarchy.
- Visual icon indicators for folders, files, and active reading notes.
- Fast note creation button (`+ New Note`) with inline modal / prompt.
- Mobile: Off-canvas sliding drawer with overlay backdrop.

### 2.2 Reader Mode
- **Wikilinks**: Rendered as interactive links. Hover displays preview tooltip; clicking navigates to target note. If target doesn't exist, styled in dotted/muted red with prompt to create.
- **Callouts**: Styled container blocks for `[!NOTE]`, `[!WARNING]`, `[!TIP]`, `[!IMPORTANT]`, `[!CAUTION]`, `[!INFO]`, `[!SUCCESS]`, `[!DANGER]`.
- **Figures & Co-located Media**: High-res rendering with caption tags and zoom-on-click preview.
- **Table of Contents**: Floating or right-side list of auto-generated H1/H2/H3 anchors with scrollspy.

### 2.3 Editor Mode & Toolbar
- Split or focused full-height markdown editor with syntax highlighting / monospace support.
- Top formatting toolbar:
  - Text formatting: Bold, Italic, Strikethrough, Code.
  - Structure: H1, H2, H3, Bullet List, Number List, Task List, Blockquote.
  - Advanced: Insert Wikilink `[[...]]`, Insert Callout, Insert Table, Image Upload.
- **Image Upload Dialog**:
  - Drag-and-drop zone or file picker.
  - Custom file name input (e.g., `filter-cleaning-steps.png`).
  - Caption input field.
  - Automatically uploads to co-located note directory and inserts:
    ```markdown
    <figure>
      <img src="./filter-cleaning-steps.png" alt="Filter Cleaning" />
      <figcaption>Step 1: Clean the mesh filter under warm water.</figcaption>
    </figure>
    ```

### 2.4 Backlinks Panel & Graph Visualization
- **Backlinks Sidebar**: List of referring notes with matching context snippets.
- **Interactive Graph Modal / View**:
  - Force-directed 2D network graph.
  - Color-coded nodes (active note, connected notes, folders).
  - Search filter and node click-to-navigate.

## 3. Keyboard Shortcuts
- `Cmd / Ctrl + K`: Open search palette.
- `Cmd / Ctrl + S`: Save note in editor mode.
- `Cmd / Ctrl + E`: Toggle Edit / Read mode.
- `Cmd / Ctrl + G`: Toggle Graph view.
- `Escape`: Close open modals / palette / mobile drawer.
