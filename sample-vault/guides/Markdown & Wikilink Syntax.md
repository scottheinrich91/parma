# Parma Markdown & Wikilink Syntax Guide

Welcome to the syntax and feature guide for **Parma**. Parma fully supports GitHub Flavored Markdown (GFM), Obsidian-style bidirectional wikilinks, custom callouts, and co-located media figures.

---

## 🔗 1. Wikilinks (`[[...]]`)

You can link across any note in your vault using double square brackets:

- **Basic Link**: `[[Home]]` links to the root `Home.md`.
- **Folder Link**: `[[appliances/Espresso Machine]]` links to a note inside a subfolder.
- **Custom Display Text (Alias)**: `[[recipes/Sourdough Bread|My Sourdough Recipe]]` renders as [[recipes/Sourdough Bread|My Sourdough Recipe]].
- **Heading Anchor**: `[[appliances/Espresso Machine#Daily]]` navigates directly to that section.

If a linked note does not exist yet, Parma renders the link in a distinct muted tone and allows you to create the new note in one click!

---

## 📢 2. Callouts (`> [!TYPE]`)

Parma supports GitHub and Obsidian style alert callouts:

> [!NOTE]
> Useful information that users should know, even when skimming.

> [!TIP]
> Helpful advice for doing things better or more easily.

> [!IMPORTANT]
> Key information users need to know to achieve their goal.

> [!WARNING]
> Urgent info that needs immediate user attention to avoid problems.

> [!CAUTION]
> Advises about risks or negative outcomes of an action.

---

## 🖼️ 3. Co-located Images & Figures

Images placed in the same folder as the note can be referenced relatively:

```markdown
<figure>
  <img src="./espresso-machine.svg" alt="Espresso Machine" />
  <figcaption>Figure 1: Machine front view schematic.</figcaption>
</figure>
```

Or using standard markdown syntax: `![Espresso Machine](./espresso-machine.svg)`.

---

## 📊 4. Tables and Task Lists

| Feature | Supported in Parma | Notes |
| :--- | :---: | :--- |
| **Tables** | ✅ | GFM table syntax with alignment |
| **Checklists** | ✅ | Interactive task lists (`- [x] Done`) |
| **Code Highlighting**| ✅ | Fenced code blocks with language tags |
| **LaTeX / Math** | ✅ | Inline and display math |

---

## 🔗 Related Notes
- [[Home|Return to Main Home Dashboard]]
- [[guides/Home Maintenance Checklist|Checklist Guide]]
