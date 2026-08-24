# UI Design Specifications — Parma

> **Status:** Draft  
> **Philosophy:** Digestible, clean, and mobile-first. As accessible to non-technical household members as Apple Notes or Notion, while remaining pure Markdown under the hood.

---

## 1. Design System & Theming
- **Palette:** Warm, clean, high-contrast typography with dark and light mode toggle (respects system preference by default).
- **Typography:** Legible serif/sans-serif pairing (e.g. Inter / Literata) optimized for reading long-form documentation, recipes, and home guides.
- **Touch Targets:** Minimum 44x44px touch targets on mobile for all buttons, links, and navigation items.

---

## 2. Layouts & Navigation

### Mobile View (Primary Focus)
- **Top Bar:** Quick Search icon, Page Title / Breadcrumb, Edit button.
- **Bottom Bar:** 
  - 🏠 Home / Vault Root
  - 📁 File Tree Drawer (slide-out navigation)
  - 📷 / ➕ Quick Note / Media Upload Action
  - 🕸️ Graph View
- **Slide-out Navigation Drawer:** Clean hierarchical directory tree with collapsible folders and note counts.

### Desktop / Tablet View
- **Left Sidebar:** Collapsible folder tree, tag list, and recent notes.
- **Center Canvas:** Reading or editing pane with clean typography and generous margins.
- **Right Sidebar (Optional / Collapsible):** Table of contents (TOC), local mini-graph, and backlinks list.

---

## 3. Editor & Write Experience (Non-Technical Friendly)
- **Hybrid Visual / Markdown Editor:**
  - Formatting toolbar (Bold, Italic, Lists, Checklists, Callout Boxes, Tables, Image Upload).
  - Clean preview that hides raw Markdown symbols unless focused.
- **Wikilink Autocomplete:** Typing `[[` summons a modal dropdown to quickly search and link to other pages in the vault.
- **Auto-Save & Conflict Feedback:** Clear visual indicator ("Saved to disk ✓") with non-intrusive auto-save.

---

## 4. Media & Image Upload Experience
- **Upload Trigger:** Camera icon in the editor toolbar, drag-and-drop onto the page, or tap on mobile.
- **Upload Modal:**
  - Thumbnail preview of the photo.
  - Input field for **File Name** (defaults to suggested name, e.g. `water-heater-valve.jpg`).
  - Input field for **Caption** (optional).
  - Alignment selector (Full Width, Centered, Right Float / Wiki Infobox style).
- **In-Page Presentation:** Renders with a clean frame, crisp caption, and tap-to-zoom / fullscreen lightbox.

---

## 5. Graph View Interface
- **2D / 3D Canvas:** Interactive force-directed node graph.
- **Touch-Friendly Controls:** Pinch-to-zoom, pan, tap node to open preview sheet or navigate directly.
