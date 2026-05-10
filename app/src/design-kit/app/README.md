# Mora · App UI Kit

Calm editorial recreation of the Mora web app. Single HTML entry that loads small JSX component files via Babel-standalone — modular, low-fidelity-on-functionality, high-fidelity-on-visual.

## Files

- `index.html` — clickable click-thru prototype. Routes between Library, Item Detail, Constellations, Memory Wall, and Journal capture.
- `Components.jsx` — atoms: `Button`, `Pill`, `SourceChip`, `Tag`, `Eyebrow`, `Icon`, `Rule`.
- `Sidebar.jsx` — fixed left rail, Mora wordmark + nav.
- `TopBar.jsx` — page title eyebrow + capture affordance.
- `Library.jsx` — main "saved" view: column-grid of memory cards, daily resurface band.
- `ItemDetail.jsx` — focused reading view of a single memory.
- `Constellations.jsx` — tag clusters as quiet sections.
- `MemoryWall.jsx` — daily resurface — "what to revisit today."
- `JournalCompose.jsx` — modal sheet for capturing a thought.
- `data.js` — sample memories.

## What's recreated vs omitted

| Recreated | Omitted (placeholder text instead) |
|---|---|
| Library bento → editorial column-grid | Settings page |
| Item detail reading view | Sources page (chrome shown only) |
| Constellations tag clusters | Add-Item full form (use journal compose instead) |
| Daily Memory Wall | Browser-extension popup |
| Journal capture sheet | Empty / loading skeletons |
| Sidebar + topbar nav | Authentication screens |

## Design notes

This kit deliberately walks **away** from the original Tailwind tokens (`bg-surface-container`, `text-on-primary`, neon glows, glassmorphism, Material Symbols). It uses the new `colors_and_type.css` variables and Phosphor icons to express the calm/archival direction.

It is a **visual recreation** — interactions are mocked with React state. There is no real persistence, no real capture engine, no real ML.
