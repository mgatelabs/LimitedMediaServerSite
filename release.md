# Limited Media Server (Site) — Release Notes

## 2026.11.22

1. **Recent Items bar** — a new side panel tracks the media folders, processes, books and chapters you've viewed, so you can jump straight back to them. Items can be pinned to the top. Toggle it from the main menu (⋮).
2. **Browse media by date** — a new "Browse by Date" view (calendar icon in the top bar) lists media files within a date range, newest first.
3. **Book & Folder Keys** — attach key/value metadata to books (volumes) and media folders. You can add, edit and remove keys, or let the server generate them for you.
4. **Series Duplicate Finder** — scan a book for duplicate images across its chapters (on-demand or in the background) and remove the ones you pick.
5. **Mass Image Merger** — merge many images in a chapter at once, with live progress.
6. **Multi-split** — in the Chapter Editor, split a single image into several pieces at the exact positions you mark (horizontal or vertical).
7. **Improved book search** — the book listing now has a full-featured search dialog with type, tag and processor filters, plus rating controls. Your last search is remembered per user.
8. **Alternative book names** — books can now carry an alternative display name.
9. **Process & worker upgrades**
   - Worker list now shows names, status (idle / running / dead), current job, and uptime.
   - Task logs are now paged (fast on long logs) and you can **copy** or **export** them (Markdown or JSON).
   - Finished tasks can be purged to keep the list clean.
   - Tasks now show the files they are working on.
10. **Select by type** — in the media browser, one click to select all video, photo, audio or text files.
11. **Session widget** — a dashboard widget shows your login state and time remaining, with a live countdown ring that renews automatically.
12. **Link widget** — a dashboard widget with quick links to the Limited Media Server projects and the tracker browser extension.
13. **Keyboard shortcuts reference** — a new dialog (main menu → Keyboard Shortcuts) lists every shortcut in the app.
14. **Media player fix** — deleting the current video in a playlist no longer desyncs playback; the next item loads correctly.
15. **More translations** — all new features are translated across every supported language.
16. **Build & security** — added `dompurify` and `marked` libraries, hardened npm installs (scripts disabled, minimum package age), and raised component style-size limits.

> Note: the new features (keys, duplicate finder, image merger, browse-by-date, paged logs) require the matching **Limited Media Server** version to be running.
