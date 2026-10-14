# Hey Murph — Dropbox sync file format

The app syncs with **one file in the Dropbox app folder**: `Apps/HeyMurphSync/heymurph-data.json`
(the app sees it as `/heymurph-data.json`). Every sync downloads the file, merges it with the phone's data, and uploads the result (overwriting the file).

## Structure

```json
{
  "app": "hey-murph",
  "version": 2,
  "updatedAt": 1791961580722,
  "items":   [ /* tasks */ ],
  "journal": [ /* journal entries */ ],
  "habits":  { "habits": [ /* 2 habits */ ], "updatedAt": 1791961580722 }
}
```

All times are **milliseconds since epoch (UTC)**, e.g. JavaScript `Date.now()`, Python `int(time.time()*1000)`.

### Task (`items[]`)
```json
{"id":"mv6to1sexd8g4","title":"Call Acme","list":"focus","tags":["quick wins"],"due":"2026-10-20",
 "customer":"","top":false,"done":false,"created":1791904490510,"doneAt":null,
 "notes":"optional","jid":"optional journal id","updatedAt":1791904490510}
```
- `list`: `"focus"` or `"cold"`. Tags must be from: `damage control`, `preventive damage control`, `overdue`, `quick wins`, `delegation`, `necessary task`.
- The Focus List holds max 10 open items and max 3 `top` items. Please respect that when adding.
- `customer` is legacy and ignored by the UI.

### Journal entry (`journal[]`)
```json
{"id":"mv6to12wp2e2x","text":"Call **Acme** about ==renewal==","type":"Decision","created":1791904489592,
 "stage":"record","essence":"","processedAt":null,"exec":null,"updatedAt":1791904489592}
```
- `type`: `Idea | Quote | Note | Link | Decision | ""`. `stage`: `"record"` or `"processed"`.
- `exec`: `null` or `{"dest":"focus"|"cold"|"notes","at":<ms>,"taskId":"<task id, if any>"}`.

### Habits (`habits`)
`{"habits":[{"name":"Walk","color":"#ff8a3d","days":{"2026-10-13":1}}, …],"updatedAt":<ms>}`. Habits merge as **one block**: the newest `habits.updatedAt` wins as a whole.

## How merging works
- Tasks and journal entries are matched by `id`. **The copy with the larger `updatedAt` wins** (a tie keeps the phone's copy).
- Deletions are **tombstones**: `{"id":"…","deleted":true,"updatedAt":<ms>}`. A tombstone beats any older version of the item, and a newer edit beats the tombstone.

## Rules for editing the file safely (Murph)
1. Download the file, edit it, and upload it back as **valid JSON**. If the JSON is invalid, the app refuses to overwrite it and shows a sync error.
2. **Edit an item:** change its fields and set `updatedAt` to now (it must be larger than the old value).
3. **Add an item:** use a new unique `id` (e.g. 12+ random lowercase letters and digits), set `created` and `updatedAt` to now, and include all fields shown above.
4. **Delete an item:** don't just remove it. Replace it with `{"id":"<same id>","deleted":true,"updatedAt":<now>}`. If you remove it outright, the phone will upload it again.
5. **Keep existing tombstones.** Never drop entries with `"deleted":true`.
6. **Habits:** edit the block and bump `habits.updatedAt`.
7. Optionally bump the top-level `updatedAt`. It's informational only.
8. Avoid editing at the same moment the phone edits the same item: the newest `updatedAt` wins, and the other change is lost.
