# Stopwatch

A minimal, modern stopwatch web app — precision timing with lap tracking, keyboard shortcuts, and a clean dark UI.

**Live demo → [as-repo1.github.io/stop_watching](https://as-repo1.github.io/stop_watching/)**

---

## Features

| Feature | Details |
|---|---|
| **Centisecond precision** | Powered by `requestAnimationFrame` — updates every ~16ms |
| **Lap tracking** | Records split time per lap + cumulative total |
| **Best / worst lap** | Automatically highlights fastest (green) and slowest (red) laps |
| **Smart display** | Shows `MM:SS` normally, expands to `HH:MM:SS` for long runs |
| **Animated ring** | SVG progress ring completes one full revolution every 60 seconds |
| **Status badge** | Live indicator — Idle / Running / Paused with color coding |
| **Keyboard shortcuts** | `Space`, `L`, `R` — no mouse required |
| **Session persistence** | `sessionStorage` saves state across page reloads |
| **Accessible** | `aria-live` regions, `focus-visible` outlines, reduced-motion support |
| **Responsive** | Adapts to all screen sizes |

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Start / Pause |
| `L` | Record lap (while running) |
| `R` | Reset |

---

## Tech Stack

- **HTML5** — semantic structure (`<main>`, `<section>`, `<header>`, `<footer>`)
- **CSS3** — custom properties, glassmorphism, `@keyframes`, `prefers-reduced-motion`
- **Vanilla JS** — `requestAnimationFrame`, `sessionStorage`, no dependencies
- **Fonts** — [Inter](https://fonts.google.com/specimen/Inter) (UI) + [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) (digits) via Google Fonts

---

## Project Structure

```
stop_watching/
├── index.html   # Semantic markup, SVG ring, lap list, shortcut hints
├── main.css     # Design system, animations, dark theme, responsive layout
└── main.js      # Timer logic, lap tracking, keyboard handling, persistence
```

---

## How It Works

**Timing** — `startWatch()` snapshots `performance.now()`. On each animation frame, the difference is added to the accumulated `elapsed` time, giving sub-millisecond accuracy regardless of tab throttling.

**Laps** — Each lap stores the cumulative total and the split (delta from the previous lap). The lap list re-renders on every new lap, comparing all splits to mark the best and worst.

**Persistence** — State (`elapsed`, `laps`, `running`) is serialized to `sessionStorage` on every meaningful action. On page load, `restoreSession()` reads it back and renders the paused state — so a refresh never loses your time.

---

## Design Decisions

- **No frameworks or build tools** — opens directly as a file, zero setup.
- **`requestAnimationFrame` over `setInterval`** — avoids drift and is paused automatically when the tab is hidden.
- **Hours hidden by default** — the display stays compact (`MM:SS`) and only expands when the timer exceeds 60 minutes.
- **Lap button disabled when idle/paused** — prevents recording empty or misleading splits.
