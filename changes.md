# Changes — 2026.11.22

Developer changelog for the current set of changes. See [`release.md`](release.md) for the user-facing release notes.

## New Angular components (standalone)

| Component | Purpose |
|---|---|
| `book-key-listing` / `book-key-entry` | List and edit key/value metadata rows attached to a **book** (volume). Includes a "generate keys" action. |
| `media-key-listing` / `media-key-entry` | List and edit key/value metadata rows attached to a **media folder**. |
| `book-search-dialog` | New generic search dialog for books. Supports text, type, tags, processors, sort order, rating-blur and rating-limit levels. Replaces the old generic `search-dialog` for the book listing. |
| `chapter-image-merger` | "Mass Image Merger" tool for a chapter. Merges chapter images via the `action.book.merge_images` background plugin. |
| `series-duplicate-finder` | Finds duplicate images across the chapters of a book. Runs an on-demand scan and a background `action.book.deduplicate` plugin. |
| `entity-banner` | Shared banner that renders an entity (book / chapter / folder) metadata header. |
| `image-multi-splitter` | Splits a single image into N pieces at user-chosen positions (horizontal or vertical). |
| `split-position-picker` | Position-picker UI used by `image-multi-splitter` to mark split points on an image. |
| `keyboard-shortcuts-dialog` | Dialog that lists the application's keyboard shortcuts. |
| `link-widget` | Dashboard widget with external links (GitHub repos, Firefox extension). |
| `process-monitor` | Embeddable widget that polls a single background process task and reports progress, elapsed time and success/failure. |
| `recent-items-bar` | Left-side nav bar (mat-sidenav) listing recently viewed items (media folders, processes, books, chapters) with pin support. |
| `session-widget` | Dashboard widget showing session auth state and time remaining with a circular ring and auto-renew. |

## New service

- `recent-items.service.ts` — Persists recently viewed items to `localStorage` (max 30). Supports pinning (pinned items are exempt from trimming and from re-ordering), time-ago labels, and per-user storage. Used by media-browser, book/chapter listing and image-listing.

## Routing (`app.routes.ts`)

- New root route renders the dashboard directly (`pathMatch: full`).
- `a-media/by-date` — media browser in "browse by date" mode.
- `a-media/keys/:folder_id`, `a-media/key/:folder_id[/:id]` — media folder key listing/entry.
- `a-volume/keys/:book_id`, `a-volume/key/:book_id[/:id]` — book key listing/entry.
- `a-volume/series-duplicate-finder/:book_name` — duplicate finder.
- `a-volume/chapter-image-merger/:book_name/:chapter_name` — mass image merger.

## Media browser

- New **Browse by Date** mode: a date range (start/end) picker that lists files created within the range, sorted newest-first. Driven by the new `/api/media/list/by-date` endpoint.
- **Select by MIME type** actions: "Select All Video / Photo / Audio / Text".
- Visited folders are tracked into recent items (unrated folders are skipped).
- `copyFolderMetadata` refactored to accept the folder's `info` object rather than reading a shared field.
- `CurrentInfo` now carries an `id`.

## Book listing

- Switched to the new `book-search-dialog`, which adds **type** and **processor** filters alongside text/tags.
- Search state (text, type, tags, processors) is now persisted per user and restored on load.
- Rating blur / rating limit controls moved into the search dialog.
- Visited books are tracked into recent items.

## Volume service

- Book-key CRUD: `fetchBookKeys`, `fetchBookKey`, `addBookKey`, `updateBookKey`, `removeBookKey`, `generateBookKeys`.
- `fetchBooks` now sends `filter_type` and `filter_processor` to the API.
- `BookDefinition` gains `alt_name` (alternative name), persisted on add/update.
- `removeChapter` gains an `exclude_chapter` option.
- `mergeImage` gains an `is_horizontal` flag.
- New `splitImageMulti` — split one image at multiple positions.
- New `scanDuplicates` + `backgroundScanDuplicates` (runs the `action.book.deduplicate` plugin).

## Media service

- New `MediaKeyValueDefinition` for folder keys.
- New `fetchMediaByDate` — paginated files within a date range.

## Process / worker / logging

- `WorkerStatus` redesigned: `name`, `status` (`idle` / `running` / `dead`), `job_name`, `job_description`, `last_seen`, `uptime`.
- **Paged logs**: `log_total`, `log_pages`, `log_page`, `log_page_size` on `StatusData`; log rows now carry a `fmt` (`txt` / `md` / `json`).
- `singleProcessStatus` supports log paging and `include_files`.
- New `StatusFile` / task `files` list.
- New `downloadLog` (export a task log as `md` or `json` via blob download) and `purgeProcessTask` (delete a finished task).
- `formatUptime` helper plus worker status icon/CSS-class helpers; `weight` added to the status wrapper.
- `process-listing`, `process-details`, `process-log-card`, `process-status-card` and `process-details-card` were reworked to render worker status, paged logs, log copy/download, and the task file list.
- `process-listing-dialog` updated for the new status wrapper shape.

## Chapter editing

- Chapter editor gains a **multi-split** mode: split one image into several pieces via `image-multi-splitter` / `split-position-picker`.
- Merge operations now pass orientation (`isHorizontal`) through to the API.
- Chapter listing: recent-items tracking, a navigation guard to suppress double loads, and a plugin dialog for chapter actions.
- `chapter-editor-massive` now uses `entity-banner`.

## App shell (`app.component`)

- Added a left **recent-items sidenav** (hidden on small screens) that can be toggled from the main menu.
- Added **Keyboard Shortcuts** menu item.
- Added a **Browse by Date** shortcut button in the top bar.
- Main menu items now carry icons; content is wrapped in a `mat-sidenav-container` shell.
- `hamburger-menu` and `loading-spinner` now implement `OnDestroy` and unsubscribe via a `destroy$` subject (leak cleanup).

## Dashboard

- New **Session** widget (auth state + time remaining + auto-renew ring) and **Link** widget (external links), each independently toggleable in "Customize Dashboard".

## Misc component fixes

- `media-player`: playlist item removal is now an in-place `splice` with correct index handling (the previous reassignment broke change detection / references).
- `plugin-action`: new `executeAndClose` ("Execute And Close") action.
- `media-folder-tag-chooser`: wrap the tag fetch in `first()` to avoid repeated subscriptions.
- `media-search-dialog`: drop unused `MatCard` imports.
- `recent-media-widget` / `recent-volume-widget`: `action.preview` → `action.view` translation key.

## Build, tooling & config

- **package.json**: added `dompurify`, `marked`, `@types/dompurify` (HTML sanitization + Markdown rendering).
- **`.npmrc`** (new): `min-release-age=2880` and `ignore-scripts=true` (supply-chain hardening).
- **`npm.md`** (new): notes on inspecting and re-running npm lifecycle scripts that are blocked by `ignore-scripts`.
- **`angular.json`**: raised the component-style size limits (warning `3kb → 7kb`, error `4kb → 8kb`).
- **`.gitignore`**: ignore `/.claude`.
- **`config.py`** (localize tooling): new batch translation helper (`_get_translated_batch`) translates a term into all target languages in a single AI call; `run_localize` now groups missing translations by entry and falls back to per-language translation; the interactive localize prompt is now a checkbox.

## i18n

- `en`, `de`, `es`, `fr`, `it`, `ja`, `ko`, `zh-cn` and the regenerated `spooky` theme: new/updated keys for book keys, media keys, browse-by-date, duplicate finder, image merger, multi-split, session widget, link widget, process worker/log terms, and related forms.
- `transloco_keys.json` updated accordingly.
