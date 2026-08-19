---
name: google-sheets-dashboard
description: Use this skill when building, modifying, or extending this Google Sheets dashboard-style web app. It enforces a read-first workflow, favors adding features over redesign, preserves the current visual layout, and keeps editable columns plus history behavior intact.
---

# Google Sheets Dashboard Skill

Use this skill when working on this dashboard project or other similar Google Sheets-style dashboard apps with editable tables, history tracking, and lightweight local or Sheets-backed workflows.

## Required First Reads

Before proposing or editing anything, always read these files in this order:

1. `/Users/kklin/Documents/New project/index.html`
2. `/Users/kklin/Documents/New project/styles.css`
3. `/Users/kklin/Documents/New project/app.js`

Do not skip this step. Build context from the real structure first.

## Primary Goal

Quickly create and modify a Google Sheets dashboard workflow app without unnecessarily redesigning the interface.

## Working Rules

1. Read `index.html`, `styles.css`, and `app.js` first.
2. Prioritize adding or repairing functionality instead of large visual rewrites.
3. New or updated functionality should support:
   - pasting tabular data into the app
   - editable fields and editable columns
   - adding new columns
   - preserving old data/history for later lookup
4. When replying to the user:
   - first state the modification plan
   - then provide the concrete change summary

## UI / UX Principles

- Preserve the current dashboard layout and visual language unless the user explicitly asks for a redesign.
- Reuse existing components, class names, state patterns, and table behaviors whenever possible.
- Avoid introducing extra control clutter when an inline editing pattern already exists.
- Prefer minimal, high-signal UI additions that fit the current beige / dashboard style.

## Implementation Priorities

When making changes, follow this order:

1. Understand the current state shape and render flow in `app.js`.
2. Reuse existing table rendering and view switching patterns.
3. Extend state normalization when adding new persisted properties.
4. Preserve backward compatibility with existing saved local data whenever feasible.
5. Add UI only after the data model and behavior are clear.

## Data Handling Guidance

- Prefer extending existing persisted state rather than creating disconnected storage patterns.
- If a new feature introduces records, batches, archives, or logs, ensure old data remains queryable.
- If a new feature supports pasted table data:
  - accept tab/newline-delimited content
  - normalize row/column shape before saving
  - keep imported raw values editable after import
- When adding columns:
  - update both the visible table config and the normalization logic
  - ensure existing saved data still loads safely

## Response Pattern

Use this response structure unless the user asks otherwise:

### 修改計畫

- Briefly explain what you will change and where.
- Mention assumptions if needed.

### 變更內容

- Summarize the actual edits made.
- Mention key files changed.
- Mention any limitations, follow-up work, or testing notes.

## Watchouts

- Do not do a broad redesign just because the code is messy.
- Do not break existing localStorage-backed data unless the user explicitly approves a migration.
- Do not add new UI panels or controls when the feature can live inside the current structure cleanly.
- Do not forget to update both render logic and persistence logic when adding new fields.
