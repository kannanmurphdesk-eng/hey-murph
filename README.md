# Hey Murph

Offline-first task tracker PWA (pilot). Pure static HTML/CSS/vanilla JS — no build, no server, no login, no analytics, no CDNs. Data lives only in the browser's localStorage on your device.

**Live:** https://kannanmurphdesk-eng.github.io/hey-murph/ — open on your phone, then "Add to Home Screen" (iPhone: Safari → Share → Add to Home Screen).

- Focus List (max 10 open, max 3 ★ top priority) and Cold Storage, one-tap move
- Six fixed tags: damage control, preventive damage control, overdue, quick wins, delegation, necessary task
- Due dates + Overdue view, optional customer with filter, Done view, edit/delete with confirm
- Export Markdown / JSON backup (share sheet or download); import JSON or pasted Markdown

Markdown format: `- [ ] Title [tags: quick wins, overdue] [due: 2026-10-20] [customer: Acme] [top]` under `## Focus List` / `## Cold Storage`.

Export a JSON backup regularly — iOS may clear website data for home-screen apps not used for a while.

## Dropbox sync
Two-way sync with `Apps/HeyMurphSync/heymurph-data.json` (OAuth 2 PKCE, App-folder scope). Set `DROPBOX_APP_KEY` in `config.js`. The file format is described in [SYNC.md](SYNC.md). Tests: `node --test test/`.
