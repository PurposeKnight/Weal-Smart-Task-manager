# TaskFlow — Smart Task Manager

A clean, minimal task manager web app built with vanilla HTML, CSS, and JavaScript. Demonstrates full **CRUD** (Create, Read, Update, Delete) functionality using the browser's `localStorage` for persistence — no backend or dependencies required.

## ✨ Features

- **Create** tasks with title, description, priority, category, and due date
- **Read** tasks in a clean card list with search, filter, and sort controls
- **Update** tasks via inline edit form with live character counters
- **Delete** individual tasks or clear all at once
- Completion toggle with a custom checkbox
- Overdue task detection with visual badge
- Detail modal on card click
- Toast notifications for all actions
- Warm cream UI with burnt orange accent — no dark mode clichés
- Data persists across page reloads via `localStorage`

## 🗂 File Structure

```
WEAL/
├── index.html   # App structure, form, task list, modal
├── style.css    # All styling — warm cream design system
└── app.js       # CRUD logic, filtering, sorting, localStorage
```

## 🚀 Running Locally

No build step needed. Just open `index.html` directly in any browser:

```bash
# Option 1 — double-click index.html in your file explorer

# Option 2 — open from terminal
start index.html          # Windows
open index.html           # macOS
xdg-open index.html       # Linux
```

## 🛠 Tech Stack

| Layer    | Technology         |
|----------|--------------------|
| Structure | HTML5              |
| Styling   | Vanilla CSS        |
| Logic     | Vanilla JavaScript |
| Storage   | Browser localStorage |
| Fonts     | Inter (Google Fonts) |

## 📸 CRUD Overview

| Operation | How it works |
|-----------|-------------|
| **Create** | Fill the left-side form → click **Add Task** |
| **Read**   | Tasks render as cards; click any card to open the detail modal |
| **Update** | Click the ✏️ icon on a card → edit in form → **Save Changes** |
| **Delete** | Click 🗑️ on a card, or use **Delete** inside the modal |
