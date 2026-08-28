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

Parma supports all standard Obsidian-style callout blocks with customizable titles and foldability (`+` for open by default, `-` for collapsed by default):

```markdown
> [!TYPE] Optional Custom Title
> Callout body text goes here.
```

### All 13 Standard Callout Types

> [!NOTE] General Note
> Useful background information and context that readers should take note of when reading.

> [!ABSTRACT] Executive Summary
> A concise overview or TL;DR summarizing the core takeaways of a longer document.

> [!INFO] Live Vault Synchronization
> Parma detects file system modifications instantly and updates client views in real time.

> [!TODO] Pending Vault Tasks
> Track pending tasks, upcoming milestones, and routine household maintenance checklists.

> [!TIP] Keyboard Shortcuts
> Press <kbd>⌘</kbd> + <kbd>K</kbd> (or <kbd>Ctrl</kbd> + <kbd>K</kbd>) to trigger instant omnibox search and heading navigation.

> [!SUCCESS] Backup Operation Completed
> Verified snapshot of vault contents was safely archived to redundant secondary storage.

> [!QUESTION] Need Syntax Help?
> Parma renders standard Markdown, GitHub-Flavored Markdown (GFM), math formulas, and Obsidian wikilinks.

> [!WARNING] Descaling Warning
> Mineral scale accumulation can damage internal heating elements if regular maintenance is neglected.

> [!FAILURE] Gateway Connection Failed
> Unable to establish link with the remote sync target. Verify your network credentials and routing.

> [!DANGER] High Voltage Isolation
> Always disconnect the main electrical breaker before servicing major household appliances.

> [!BUG] Known Rendering Issue
> Certain mobile browsers may miscalculate viewport height during active virtual keyboard input.

> [!EXAMPLE] Stepless Grinder Dial-in
> For an 18g double espresso basket, aim for a 36g liquid yield in 25–30 seconds at 9 bars of pressure.

> [!QUOTE] Antoine de Saint-Exupéry
> Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away.

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
