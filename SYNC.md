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
  "habits":  { "habits": [ /* 2 habits */ ], "updatedAt": 1791961580722 },
  "meta":    { "lastReviewAt": 1791993897141, "updatedAt": 1791993897141 }
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
- Optional `tid`: the id of the done task an Insight came from.
- `type`: `Idea | Quote | Note | Link | Decision | Review | Insight | ""`. `stage`: `"record"` or `"processed"`.
- `exec`: `null` or `{"dest":"focus"|"cold"|"notes","at":<ms>,"taskId":"<task id, if any>"}`.

### Habits (`habits`)
`{"habits":[{"name":"Walk","color":"#ff8a3d","days":{"2026-10-13":1}}, …],"updatedAt":<ms>}`. Habits merge as **one block**: the newest `habits.updatedAt` wins as a whole.

### Meta (`meta`)
`{"lastReviewAt":<ms>,"updatedAt":<ms>,"lastReview":{"processed":0,"executed":0,"deleted":0,"skipped":0}}`. This records the last **Journal review**: stepping through Record entries to process and execute them. It merges as one block, so the newest `meta.updatedAt` wins. `lastReview` is optional stats. A review saves a journal entry (`"type":"Review"`, processed, executed to notes) only if an insight was written. The app uses the later of `meta.lastReviewAt` and the newest Review entry's `created`. To record a review, set `meta.lastReviewAt` and bump `meta.updatedAt` (`hm.py review [--insight …]`).

### Insights from done tasks
An insight is a normal journal entry: `"type":"Insight"`, `"stage":"processed"`, `"exec":{"dest":"notes","at":<ms>}`, `"tid":"<done task id>"`, and `text` starting with `From done: <task title>`. A task "has an insight" (💡) when such an entry with its `tid` exists. The task itself is not modified, so nothing extra needs to merge. Add one with `hm.py insight REF "text"`.

## How merging works
- Tasks and journal entries are matched by `id`. **The copy with the larger `updatedAt` wins** (a tie keeps the phone's copy).
- Deletions are **tombstones**: `{"id":"…","deleted":true,"updatedAt":<ms>}`. A tombstone beats any older version of the item, and a newer edit beats the tombstone.

## Rules for editing the file safely (Murph)
1. Download the file, edit it, and upload it back as **valid JSON**. If the JSON is invalid, the app refuses to overwrite it and shows a sync error.
2. **Edit an item:** change its fields and set `updatedAt` to now (it must be larger than the old value).
3. **Add an item:** use a new unique `id` (e.g. 12+ random lowercase letters and digits), set `created` and `updatedAt` to now, and include all fields shown above.
4. **Delete an item:** don't just remove it. Replace it with `{"id":"<same id>","deleted":true,"updatedAt":<now>}`. If you remove it outright, the phone will upload it again.
5. **Keep existing tombstones.** Never drop entries with `"deleted":true`.
6. **Habits / meta:** edit the block and bump its `updatedAt`.
7. Optionally bump the top-level `updatedAt`. It's informational only.
8. Avoid editing at the same moment the phone edits the same item: the newest `updatedAt` wins, and the other change is lost.
