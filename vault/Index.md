---
title: Welcome to Parma
tags: [parma, wiki, guide, home]
updated: 2026-08-27
---

# Welcome to Parma

> **Parma** (*Quenya for "book" or "written scroll"*, Tengwar letter #2) is a lightweight, zero-database, mobile-first web wiki built directly over a directory of Markdown files. Every document and image is stored as pure, human-readable text on your filesystem.

---

## Table of Contents
- [About Parma](#about-parma)
- [Vault Overview & Quick Links](#vault-overview--quick-links)
- [Formatting Showcase & Callouts](#formatting-showcase--callouts)
  - [Callout Examples](#callout-examples)
  - [Wikilinks & Internal Navigation](#wikilinks--internal-navigation)
  - [Task Lists & Checklists](#task-lists--checklists)
  - [Data Tables](#data-tables)
  - [Code Snippets](#code-snippets)
- [Media & Attachment Handling](#media--attachment-handling)

---

## About Parma

Parma bridges the gap between raw text editors and modern web encyclopedias. It is designed for households, homelabbers, and writers who desire:

1. **Zero Database Friction:** Mount any folder of `.md` files (such as an Obsidian vault) and Parma serves it instantly.
2. **Family-Friendly Visual Editing:** Edit with full visual formatting (WYSIWYG) without needing to memorize Markdown symbols.
3. **Co-Located Photos:** Snap a photo from mobile, and Parma writes it directly alongside the note on disk.
4. **Knowledge Graphs:** Automatically maps bidirectional `[[wikilinks]]` into an interactive 2D graph.

---

## Vault Overview & Quick Links

Explore sample notes across this sandbox vault:

* 🏠 **Household Lore:**
  * [[household/Emergency Contacts|🚨 Emergency Contacts]]: Vital utility shut-off locations, medical contacts, and emergency procedures.
  * [[household/WiFi and Network|📶 Home Network & WiFi]]: Guest network details, router admin gateways, and static IP tables.
  * [[household/Trash and Recycling Schedule|♻️ Waste & Recycling Schedule]]: Weekly pickup timetables and sorting guidelines.
  * [[household/Paint Colors & Materials|🎨 Paint Colors & Hardware]]: Exact room-by-room paint codes and flooring references.

* ⚙️ **Appliance Care:**
  * [[appliances/Espresso Machine|☕ Espresso Machine Guide]]: Daily routine, grinder dial-in settings, and descaling.
  * [[appliances/Dishwasher|🍽️ Dishwasher Maintenance]]: Spray arm cleaning and filter maintenance.
  * [[appliances/HVAC & Heat Pump|❄️ HVAC & Heat Pump Care]]: Filter replacement schedule (MERV 11) and thermostat seasonal profiles.

* 🍕 **Culinary Recipes:**
  * [[Recipes/Pasta|🍝 Artisanal Pasta]]: Fresh handmade pasta with Semolina flour and rich eggs.
  * [[recipes/Sourdough Bread|🍞 Sourdough Country Loaf]]: 75% hydration master recipe, bulk fermentation schedules, and steam-baking.
  * [[recipes/Pasta Carbonara|🍝 Authentic Roman Carbonara]]: Guanciale rendering, Pecorino-egg emulsion, and pasta water technique.
  * [[recipes/Neapolitan Pizza|🍕 Neapolitan Pizza]]: 48-hour cold fermentation dough calculation.

---

## Formatting Showcase & Callouts

Parma natively parses and beautifully renders standard Markdown, GitHub-Flavored Markdown (GFM), and Obsidian extensions.

### Callout Examples

> [!NOTE]
> **Information Note:** Parma automatically renders callout blocks with theme-adaptive colors and clean iconography.

> [!TIP]
> **Helpful Tip:** Press <kbd>⌘</kbd> + <kbd>K</kbd> (or <kbd>Ctrl</kbd> + <kbd>K</kbd>) to instantly search across all titles, tags, and note contents.

> [!IMPORTANT]
> **Key Architecture Decision:** No external SQL database or Redis cache is required. The host filesystem is the sole source of truth.

> [!WARNING]
> **Safety Warning:** When servicing major appliances, always ensure the main breaker or shut-off valve is closed before proceeding. See [[household/Emergency Contacts#Utility Shut-Offs|Emergency Shut-Off Procedures]].

> [!CAUTION]
> **Critical Caution:** Never run destructive disk commands against your mounted vault without taking backups.

---

### Wikilinks & Internal Navigation

Parma seamlessly resolves Obsidian-style internal links:
- Direct page link: [[recipes/Pasta Carbonara]]
- Custom alias link: [[appliances/Espresso Machine|Dialing in your morning espresso]]
- Deep section link: [[household/Emergency Contacts#Main Water Shut-off|Where to find the main water valve]]

---

### Task Lists & Checklists

Keep track of household routines and project tasks with interactive checkboxes:

- [x] Unbox and inspect espresso machine pressure gauge
- [x] Mount Obsidian vault folder into Parma
- [ ] Clean dishwasher filter mesh and spray arms
- [ ] Replace HVAC air intake filter (Size 20x25x4)
- [ ] Feed sourdough starter (1:2:2 ratio)

---

### Data Tables

| Metric | Development (Vite) | Production Engine (Node) |
| :--- | :---: | :---: |
| **Port** | `5173` | `3000` |
| **Hot Reloading (HMR)** | Active | N/A |
| **Memory Footprint** | ~55 MB | ~35 MB |
| **SSL Termination** | NPM Reverse Proxy | NPM Reverse Proxy |

---

### Code Snippets

Deploying Parma in your homelab with `docker-compose.yml`:

```yaml
services:
  parma:
    image: parma:latest
    container_name: parma
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - VAULT_PATH=/vault
    volumes:
      - /vault:/vault
```

---

## Media & Attachment Handling

Parma stores images directly inside the folder where your note lives, or in your designated attachments folder. When uploaded through the camera/gallery picker on mobile, images render with clean wiki frames and captions:

![Classic Espresso Extraction](./appliances/espresso-machine.svg)
*Figure 1: Clean inline figure formatting with automatic captions.*

---

> *"All that is gold does not glitter, not all those who wander are lost."*  
> — **J.R.R. Tolkien**
