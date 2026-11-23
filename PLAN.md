# takam-editions: read a Takam directive without a download, and see what changed between editions
Created: 2026-11-23 · Branch: `main` · Owner: Kfir Avraham

Written from Kfir's scope decisions of 2026-11-22 and 2026-11-23. The Research section records what was checked
on the site and on its Word files before planning. Claude Code builds the project from this plan, phase by
phase, and verifies each phase itself.

## Goal

The Takam site (https://takam.mof.gov.il) publishes every directive, message and form as a Word file. Two things
follow for the people who work by them (accountants, procurement staff, suppliers): reading one section means
downloading a file, and when a directive is updated there is no convenient way to see what changed. 295 of the
418 directives on the site have more than one edition, and the site lists earlier editions by date only. After
this task a small web app shows, on a sample of 10 documents with 21 editions, each edition inside the page, and
for any two editions every paragraph that was changed, added or removed, with its section number and the changed
words marked. Why now: the home assignment of the Ministry of Finance asks for one business problem of the site
and a working POC for it, in 4 to 6 hours of work; the interview is on 2026-11-24.

## Research (before this plan, on the site and on its files)

- The site is an Angular client over a public JSON API (Design J lists the three calls). It answers through a
  firewall (`server: Sucuri/Cloudproxy`), so a request that does not come from a browser may be refused.
- Every directive ends with an appendix, "טבלת שינויים", that its author fills in by hand: one line per section,
  without the earlier wording. For edition 6 of directive 1.4.3 (19.09.2024) it lists sections 1, 1.5.9, 2.3,
  2.6, 2.9.2 and 2.12. The rates message 3.1.1.1 (54 editions) has no such table; its edition 53 sets the
  Accountant General's rate at 5% and edition 54 at 4.75%.
- `mammoth` (Word to HTML) reads the files but drops the section numbers: Word computes them, they are not text.
- `docx-preview` (draws a Word file in the browser) showed the sections of edition 5 of directive 1.4.3 as
  "0.1, 0.2" instead of "1.1, 1.2". Cause: it merges a base style over the style that inherits from it, and in
  that file the heading style and its base style point at different numbering lists.
- LibreOffice converts the same files correctly, to PDF and to plain text. In the text every paragraph is one
  line and a numbered paragraph starts with its section number ("1.5.9. ...").
- `diffWords` of the `diff` library marks Hebrew letter by letter. `diffArrays` on words gives clean marks.

## Decisions

From Kfir (scope, stack and look). The why and the rejected alternative are the planner's reading.

1. **One problem, two views: read an edition without downloading it, and see what changed between two editions.**
   Why: both come from the same cause (the content is locked in Word files), and the second has no answer on the
   site today. (Rejected: search inside the text, a table of the interest rates, a redesign of the whole
   catalogue. Each is a problem of its own; the README names them.)
2. **A version small enough to explain line by line.** Two screens, about ten source files on each side, no
   layer that exists "for later". (Rejected: separate services with a glossary-style contract, as in the CBS
   project: too much code to explain for a POC.)
3. **Node.js, TypeScript and Express on the server; React and Vite on the client; Vitest; one `package.json`.**
   Why: the role asks for React and Node.js, and one install and one command keep the run instructions short.
   (Rejected: Python with FastAPI; a workspace with two packages.)
4. **No language model in the build.** The comparison is deterministic and can be tested. (Rejected: an LLM
   summary of the changes. It can sit on top of the list of changes later; the README says so.)
5. **The sample: 10 documents from chapters 1, 3 and 7, up to the three latest editions of each** (Design B).
6. **A modern look, designed with the taste skill and approved by Kfir on the screen** (Design I). It has to
   look clearly better than the site it improves. (Rejected: a look fixed in advance in this plan.)
7. **Kfir writes the README.** It holds his answers to the assignment's questions. Claude Code does not write or
   reword it.

Settled by the planner after the research, open to Kfir's objection:

8. **Convert once, when a document enters the system, never per request.** A script runs LibreOffice on each Word
   file and writes a PDF (for reading) and a text file (for comparing). The server never opens a Word file.
   (Rejected: `mammoth` and `docx-preview`, for the reasons in Research. A wrong section number in a binding
   document is worse than a download.)
9. **Reading is the browser's own PDF viewer in an `<iframe>`.** (Rejected: PDF.js: a second viewer to maintain.
   Known limit: not every mobile browser shows a PDF inside a page, so there is also a link that opens it alone.)
10. **The comparison works on paragraphs of text, with the section number kept apart from the wording**
    (Design D, E). Why: when one section is deleted, every section after it is renumbered, and those must not be
    reported as changes. (Rejected: comparing lines as they are; a character-level diff.)
11. **`data/sample/manifest.json` is the store.** (Rejected: a database for 10 documents.)
12. **`shared/types.ts` is the only contract between server and client**; both import it (Design C).
13. **What a page shows lives in its address** (`?edition=5`, `?tab=changes&from=5`), so a view can be shared as
    a link and the back button works. One exception: the "show the whole document" checkbox of the changes view
    is a display preference and stays in component state. (Rejected: component state for the tab and the
    chosen edition.)
14. **Errors cross the API as codes** (`{ "error": "document_not_found" }`); the client owns the Hebrew sentences.
15. **Pinned versions, Node 22.12 or newer** (Design A).

## Phases

Every phase ends the same way: tick each step as it finishes, run Verify, add one line to the Log at the end of
this file (date, what Verify printed, anything that differs from the plan), and make one commit with the
message the phase gives. Before the commit run `npm run typecheck && npm test` in phases 3 to 5 (there is no
client to build yet), and `npm run check` from phase 6 on. If a Verify does not hold, stop and tell Kfir; do not
bend a test to make it pass. Server logic is written test-first; the client is checked on the screen. A fix to
an earlier phase gets a commit of its own, `fix(<scope>): ...`. The Design section is the specification each
step builds from. After phases 6, 7 and 8 wait for Kfir to look at the screen before going on.

### Before phase 1 (Claude Code checks these and ticks them)
- [x] `node -v` prints v22.12 or newer. If it is older, stop and tell Kfir.
- [x] The folder holds `PLAN.md` and `CLAUDE.md`.
- [x] The folder is a git repository on the branch `main` (`git init -b main` when it is not one yet).

### Phase 1: skeleton
- [x] `package.json`, `tsconfig.json`, `.gitignore`, `.env.example` per Design A.
- [x] `npm install`.

Verify: `npx tsc --version` prints the pinned version.
Commit: `chore: project skeleton and plan` (with `package-lock.json`, `PLAN.md` and `CLAUDE.md`)

### Phase 2: the sample
- [x] `server/config.ts` per Design A; `sample.config.json` and `scripts/fetch-sample.ts` per Design J.
- [x] Run `npm run fetch-sample`. If the site refuses the request, follow "When the site refuses" in Design J.
- [x] `scripts/convert.ts` per Design J. Find LibreOffice as Design J says, then run `npm run convert`.

Verify: `npm run typecheck` is clean, and
`node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync('data/sample/manifest.json','utf8'));console.log(m.documents.length+' documents, '+m.documents.flatMap(d=>d.editions).length+' editions, '+fs.readdirSync('data/sample').length+' files')"`
prints `10 documents, 21 editions, 64 files`. Every `.pdf` starts with `%PDF`, every `.txt` holds text, and
`data/sample/H.1.4.3_v6.txt` has a line that starts, after its spaces, with `1.5.9.` (the conversion wrote the
section numbers). A second `npm run convert` prints `Every Word file already has a PDF and a text file.`
Write into the Log how the Word files arrived (from the site by the script, or from the browser download).
Commit: `feat(scripts): download the sample and convert it to PDF and text` (with `data/sample/`)

### Phase 3: contract and text parsing
- [x] `shared/types.ts` per Design C.
- [x] `vitest.config.ts` (Design A).
- [x] `tests/text.test.ts`: the cases of Design G1, written first and seen failing.
- [x] `server/text.ts` per Design D.

Verify: `npm run typecheck` is clean and `npx vitest run tests/text.test.ts` passes. On the real file
`data/sample/H.1.4.3_v6.txt`: the first paragraph is `{ label: '1', text: 'מבוא' }`, there is a paragraph with
the label `1.5.9`, no paragraph has an empty text, and the number of paragraphs equals the number of non-empty
lines of the file. Write that number into the Log.
Commit: `feat(server): parse the text of an edition into numbered paragraphs`

### Phase 4: the comparison
- [x] `tests/compare.test.ts`: the cases of Design G2, written first and seen failing.
- [x] `server/compare.ts` per Design E.

Verify: `npx vitest run tests/compare.test.ts` passes. Then check the result against what the documents
themselves say (Design E, "Ground truth"): compare editions 5 and 6 of `H.1.4.3`, and editions 53 and 54 of
`HOD.3.1.1.1`, and confirm every point of the ground truth. Write the four counts of each comparison (same,
changed, added, removed) into the Log, and pin them in the test file, so a later change to the algorithm is
noticed.
Commit: `feat(server): compare two editions paragraph by paragraph`

### Phase 5: the API
- [x] `tests/api.test.ts`: the cases of Design G3, written first and seen failing.
- [x] `server/catalog.ts`, `server/app.ts`, `server/index.ts` per Design F (`server/config.ts` exists since phase 2).

Verify: `npm test` passes. Then make sure nothing listens on port 3000, run `npm start`, and
`GET http://localhost:3000/api/health` answers exactly
`{"status":"ok","documents":10,"editions":21,"missingFiles":[]}`. Stop the server.
Commit: `feat(server): catalogue, files, comparison and health routes`

### Phase 6: the look, the client frame and the home screen
- [ ] Load the taste skill and settle the look per Design I: palette, typefaces, spacing, the shape of a list
      row, a tile, a tab and a changed paragraph. Show Kfir the direction on the home screen and get his word
      before building the other screens.
- [ ] `vite.config.ts`, `client/index.html`, `client/src/main.tsx`, `api.ts`, `format.ts` per Design A and H.
- [ ] `client/src/App.tsx`: the frame and the routes `/` and "anything else" (the document route comes in phase 7).
- [ ] `client/src/styles.css`: the design tokens as CSS variables, and the base styles.
- [ ] `client/src/HomePage.tsx` per Design H1.

Verify: `npm run check` passes. Kfir looks (`npm run dev`, http://localhost:5173), at a wide window and at 390
wide: five recently updated documents, the first is 7.3.3 "ערבויות וביטחונות" (edition 18, 05.10.2026); three
chapters numbered 1, 3 and 7; choosing chapter 7 lists 7.3.1 and 7.3.3, with one message and one form under
7.3.3. Kfir approves the look.
Commit: `feat(client): home screen with recent updates and chapters`

### Phase 7: document page and reading view
- [ ] `DocumentPage.tsx` (the title, the meta line, the layout; no tabs yet), `ReadView.tsx` and `SidePanel.tsx`
      per Design H2 and H3.
- [ ] The `/document/:id` route in `App.tsx`.

Verify: `npm run check` passes. Kfir looks: `/document/H.1.4.3` shows the PDF of edition 6 with sections 1.1,
1.2 and so on; "מהדורה 5" in the side panel shows edition 5 with the note that it is not the edition in force,
and the back button returns to edition 6; "הורדת Word" downloads `H.1.4.3_v6.docx`; `/document/H.7.3.3` lists
one message and one form in the side panel; `/document/H.9.9.9` shows a clear message and a link home.
Commit: `feat(client): document page with the PDF reading view`

### Phase 8: changes view
- [ ] The two tabs in `DocumentPage.tsx`, and the one-edition message, per Design H2.
- [ ] `CompareView.tsx` per Design H4.

Verify: `npm run check` passes. Kfir looks: `/document/H.1.4.3?tab=changes` shows the counts that phase 4
wrote into the Log, and the first change is section 1.3 marked "הוסר"; the checkbox shows the whole document;
`/document/HOD.3.1.1.1?tab=changes` shows 5% turned into 4.75%; `/document/H.3.1.1?tab=changes` says the
document has one edition in the sample. Also at 390 wide: no sideways scrolling.
Commit: `feat(client): changes view between two editions`

### Gate
- [ ] `npm run check` passes from a clean `npm ci`; `git status` is clean.
- [ ] Tell Kfir the number of tests, the counts of phase 4 and how the sample arrived in phase 2: his README
      states them.
- [ ] Kfir adds his `README.md`. Commit: `docs: README` (his text, unchanged, together with the ticks of this
      gate and its Log line).
- [ ] Kfir's walk-through on `npm run build && npm start` (http://localhost:3000): home, chapter 7, reading
      1.4.3, edition 5, Word download, changes of 1.4.3, whole document, the rates message, an unknown address.

## Design

### A. Layout, tooling, configuration

```
shared/types.ts       the contract (C)
server/config.ts      settings from the environment
server/catalog.ts     loads manifest.json, finds documents and files (F)
server/text.ts        text file -> paragraphs (D)
server/compare.ts     the comparison, pure functions (E)
server/app.ts         createApp(catalog, clientDir?): the routes (F)
server/index.ts       reads config, loads the catalogue, listens
client/index.html     lang="he" dir="rtl"
client/src/           main.tsx, App.tsx, api.ts, format.ts, HomePage.tsx, DocumentPage.tsx,
                      ReadView.tsx, SidePanel.tsx, CompareView.tsx, styles.css (H, I)
scripts/              fetch-sample.ts, convert.ts (J)
sample.config.json    which documents the download script fetches (J)
tests/                text.test.ts, compare.test.ts, api.test.ts (G)
data/sample/          manifest.json + <file>.docx, <file>.pdf, <file>.txt per edition (B)
```

`package.json`: `"name": "takam-editions"`, `"version": "0.1.0"`, `"type": "module"`, `"private": true`,
`"engines": { "node": ">=22.12" }`, exact versions:
dependencies `express` 5.3.0, `diff` 9.0.0, `dotenv` 18.0.10, `react` 19.3.1, `react-dom` 19.3.1,
`react-router-dom` 7.18.6;
devDependencies `typescript` 7.0.2, `tsx` 4.23.15, `vite` 8.3.8, `@vitejs/plugin-react` 6.3.0, `vitest` 5.1.1,
`supertest` 7.3.2, `concurrently` 10.0.7, `@types/express` 5.0.6, `@types/node` 22.20.5, `@types/react` 19.3.0,
`@types/react-dom` 19.3.0, `@types/supertest` 7.2.1.
The typefaces are chosen in phase 6 and added then, as `@fontsource` packages with exact versions. They are the
only dependency this plan leaves open.

Scripts: `dev` (concurrently: `tsx watch server/index.ts` and `vite`), `build` (`vite build`), `start`
(`tsx server/index.ts`), `test` (`vitest run`), `typecheck` (`tsc --noEmit`), `check` (typecheck, then test,
then build), `fetch-sample` and `convert` (`tsx scripts/...`).

One `tsconfig.json` for everything: target ES2022; lib ES2022, DOM, DOM.Iterable; module ESNext; moduleResolution
bundler; jsx react-jsx; strict; noEmit; skipLibCheck; resolveJsonModule; types `node` and `vite/client`; include
`shared`, `server`, `client/src`, `scripts`, `tests` and the two config files. Relative imports carry no
extension (`from '../shared/types'`), and types are imported with `import type`.

Vite: root `client`, the React plugin, build into `client/dist`, and in development a proxy of `/api` to
`http://localhost:<PORT>` with `server.strictPort: true` (when 5173 is taken, fail; do not move to 5174). The
Vite config imports `dotenv/config`, so the proxy reads the same `PORT` as the server. Because Vite's root is
`client/`, Vitest gets its own `vitest.config.ts` with `include: ['tests/**/*.test.ts']`. `server/index.ts`
passes `client/dist` to `createApp`, so `npm run build && npm start` serves everything on one port.

Configuration comes from environment variables, read in `server/config.ts` through `dotenv`, each with a default
and each documented in `.env.example`: `PORT` (3000), `DATA_DIR` (`data/sample`), and for the scripts only
`TAKAM_BASE_URL` (`https://takam.mof.gov.il`) and `SOFFICE_PATH` (`soffice`). The project needs no secret. The
scripts import `server/config.ts`; the server imports nothing from `scripts/`.

`.gitignore`: `node_modules/`, `client/dist/`, `.env`, `tmp/`, `*.zip`.

### B. The sample

`manifest.json` is `{ source, fetchedAt, documents }` (type `Manifest`, Design C): `source` is the address of the
site and `fetchedAt` the day of the download (`YYYY-MM-DD`). An edition's `file` is a name without an extension,
`<id>_v<number>`; its three files sit next to the manifest. Editions are listed newest first.

| id | number | name | type | parent | editions |
|---|---|---|---|---|---|
| H.1.4.1 | 1.4.1 | ביצוע תשלומים בגין התחייבויות | instruction | | 2 |
| H.1.4.3 | 1.4.3 | מועדי תשלום | instruction | | 6, 5, 4 |
| H.1.4.5 | 1.4.5 | תשלום מקדמות | instruction | | 2 |
| H.3.1.1 | 3.1.1 | קביעת שיעורי ריבית | instruction | | 1 |
| HOD.3.1.1.1 | 3.1.1.1 | עדכון ריביות החשב הכללי | message | H.3.1.1 | 54, 53, 52 |
| H.3.1.3 | 3.1.3 | קביעת ריבית פיגורים החשב הכללי | instruction | | 2, 1 |
| H.7.3.1 | 7.3.1 | מסמכי מכרז | instruction | | 22, 21, 20 |
| H.7.3.3 | 7.3.3 | ערבויות וביטחונות | instruction | | 18, 17, 16 |
| HOD.7.3.3.1 | 7.3.3.1 | מנפיקי ערבות מורשים | message | H.7.3.3 | 9, 8, 7 |
| T.7.3.3.1 | 7.3.3.1 | כתב ערבות (ללא הצמדה) | form | H.7.3.3 | 5 |

Chapters: 1 "ביצוע תקציב", 3 "ריבית הכנסות וגבייה", 7 "התקשרויות ורכישות". A message and a form can share a
number, so the `id` is the key everywhere and the `number` is only shown.

Phase 2 creates the sample: the Word files come from the site, and LibreOffice converts each of them into a
PDF and a text file. A text file is UTF-8 with a byte-order mark, with `\n` or `\r\n` line endings. Every paragraph is one line, indented by its level. A numbered
paragraph starts with its section number and a dot (`        1.5.9. תשלומים שאינם...`). Every table row is a
line of its own, its cells apart by tabs (in a few complex tables a row spreads over several lines), and there
are empty lines. Word leaves invisible direction marks next to numbers.

### C. The contract (`shared/types.ts`)

```ts
export type DocType = 'instruction' | 'message' | 'form';
export type FileFormat = 'docx' | 'pdf' | 'txt';
export interface Edition { number: number; validFrom: string /* YYYY-MM-DD */; file: string }
export interface DocumentEntry {
  id: string; number: string; name: string; type: DocType;
  chapter: string; subChapter: string;
  parentId: string | null;      // a message or a form belongs to an instruction
  editions: Edition[];          // newest first
}
export interface Manifest { source: string; fetchedAt: string; documents: DocumentEntry[] }
export interface DocumentDetail extends DocumentEntry { parent: DocumentEntry | null; children: DocumentEntry[] }
export interface Paragraph { label: string /* "1.5.9" or "" */; text: string }
export interface WordPart { kind: 'same' | 'added' | 'removed'; text: string }
export type Block =
  | { kind: 'same' | 'added' | 'removed'; label: string; text: string }
  | { kind: 'changed'; label: string; words: WordPart[] };
export interface CompareSummary { same: number; changed: number; added: number; removed: number }
export interface CompareResult { documentId: string; from: Edition; to: Edition; summary: CompareSummary; blocks: Block[] }
export interface HealthResult { status: 'ok' | 'degraded'; documents: number; editions: number; missingFiles: string[] }
export interface ApiError { error: string }
```

### D. Text into paragraphs (`server/text.ts`)

- `normalize(text)`: remove the invisible characters U+200B (the zero-width space), U+200E, U+200F, U+202A to
  U+202E, U+2066 to U+2069 and U+FEFF; turn every run of whitespace (JavaScript `\s`, which covers tabs and
  non-breaking spaces) into one space; trim.
- `parseParagraphs(fileText)`: split on `\r?\n`, normalize every line, drop the empty ones. A line that matches
  `^((?:\d+\.)+)\s+(.+)$` becomes `{ label: <group 1 without its last dot>, text: <group 2> }`. Any other line
  becomes `{ label: '', text: <the line> }`. A table cell that holds a date or "2.7" must not be read as a
  section number: the pattern needs a dot after every number, then whitespace, then text.
- `readParagraphs(filePath)`: read the file as UTF-8 and parse it. It rejects when the file is missing.

| line | label | text |
|---|---|---|
| `            1.5.9. תשלומים שאינם בתחולת החוק` | `1.5.9` | `תשלומים שאינם בתחולת החוק` |
| `    1. מבוא` | `1` | `מבוא` |
| `ראה הוראת תכ"ם מס' 3.1.3.` | (empty) | the whole line |
| `19.09.2024`, `2.7`, `6` (table cells) | (empty) | the whole line |

### E. The comparison (`server/compare.ts`)

`compareParagraphs(oldParagraphs, newParagraphs): Block[]`, in the order of the document. Only the `text` is
compared, never the `label`. One library function does the work at three levels: `diffArrays` of `diff`.

1. `diffArrays(oldParagraphs, newParagraphs, { comparator: (a, b) => a.text === b.text })`. Each part of the
   result is `added`, `removed` or common to both.
2. Walk the parts. A `removed` part that is followed at once by an `added` part is one rewritten stretch: hand
   both to step 3 and skip the `added` part. Any other part gives one block per paragraph, of kind `added`,
   `removed` or `same`, with that paragraph's label and text. A `same` block carries the label of the new edition
   (a common part of `diffArrays` holds the items of the second array); a `removed` block carries the label it
   had in the old one.
3. A rewritten stretch: `diffArrays(removed, added, { comparator })`, where two paragraphs match when
   `similarity(a.text, b.text) >= SIMILARITY_THRESHOLD` (0.5). Walk the parts with one index into each list: an
   `added` part gives `added` blocks, a `removed` part gives `removed` blocks, and every pair of a common part
   gives one `changed` block with the label of the new paragraph and the word diff of step 5.
4. `similarity(a, b)`: split each text on a single space into a set of words; the result is
   `2 × shared / (size of A + size of B)`. 1 for the same words, 0 when no word is shared.
5. Word diff: `diffArrays(oldText.split(' '), newText.split(' '))`, each part mapped to
   `{ kind, text: <its words joined by a space> }`. (`diffWords` is not used: see Research.)
6. `summarize(blocks)`: the count of blocks per kind.

Ground truth, from the documents themselves:

- Directive 1.4.3, edition 5 against edition 6. The last lines of `H.1.4.3_v6.txt` are the directive's own change
  table. For edition 6 it lists sections 1, 1.5.9, 2.3, 2.6, 2.9.2 and 2.12. The comparison must show a block
  that is not `same` for each of them. Section 1: edition 6 dropped the paragraph that was 1.3 in edition 5 (the
  regulations of February 2021), so the first block that is not `same` is `removed` with the label `1.3`. Then
  an `added` block labelled `1.5.9`, and blocks labelled `2.3`, `2.6`, `2.9.2` or under it, and `2.12` or under
  it. The comparison may show more than the table: note in the Log which changed sections the table does not
  mention.
- Message 3.1.1.1, edition 53 against edition 54: nothing is added or removed, and one `changed` block holds the
  word parts removed `5%` and added `4.75%`.

### F. The API (`server/catalog.ts`, `server/app.ts`, `server/index.ts`)

`loadCatalog(dataDir)` is synchronous. It resolves the folder to a full path (`res.sendFile` and `res.download`
need one, and the tests pass a relative folder), reads `manifest.json` once, and throws
`manifest.json was not found in <the full path>. Check DATA_DIR in .env.` when it is missing. It gives
`documents`, `find(id)`, `childrenOf(id)`, `filePath(edition, format)` and `missingFiles()`: the names of the
files that are not on the disk, edition by edition in manifest order, and for each edition docx, pdf, txt. File
names come from the manifest only, never from a request.

`createApp(catalog, clientDir?)` returns the Express app without listening, so tests build it on any data
folder. Every error is `{ "error": "<code>" }`. In every route the checks run in the order the table lists them.

| Method and path | Success | Errors |
|---|---|---|
| `GET /api/health` | 200 `HealthResult` with `status: "ok"` | 503 with `status: "degraded"` and the missing file names |
| `GET /api/documents` | 200 `DocumentEntry[]`, manifest order | |
| `GET /api/documents/:id` | 200 `DocumentDetail` | 404 `document_not_found` |
| `GET /api/documents/:id/editions/:number/:format` | 200 the file: `pdf` shown in place (`application/pdf`, no `Content-Disposition`), `docx` as a download named `<file>.docx` | 404 `document_not_found`, then `edition_not_found`, then `not_found` (any other format), then `file_not_found` (not on the disk) |
| `GET /api/documents/:id/compare?from=5&to=6` | 200 `CompareResult` | 404 `document_not_found`; 400 `bad_request` unless `from` and `to` are both digits only and different; 404 `edition_not_found`; 500 `file_unreadable` when a text file cannot be read |
| any other `/api/...` | | 404 `not_found` |

After the API routes: when `clientDir` was given and the folder is on the disk (it is missing until
`npm run build`), serve it as static files and answer any other address with its `index.html`, so
`/document/H.1.4.3` works on reload. Last, an error handler that logs the error with `console.error` and answers
500 `server_error`.

`index.ts`: load the catalogue, create the app with `client/dist`, and listen on `PORT`; then log
`takam-editions is listening on http://localhost:<port> with <n> documents`.

### G. Tests (Vitest; `supertest` for the API; the real sample, no mocks)

Test names and comments are English; Hebrew appears only as quoted directive text.

G1, `text.test.ts`: direction marks do not make two texts differ; spaces, tabs and non-breaking spaces collapse;
the four rows of the Design D table; empty lines, `\r\n` endings and the mark at the start of a file are
skipped; the real file of the Phase 3 Verify line; a missing file rejects.

G2, `compare.test.ts`, on small hand-made paragraphs: an edition against itself has no changes; a new paragraph
is `added` and the order is kept; a deleted one is `removed`; "שיעור הריבית יעמוד על 5% לשנה" against the same
sentence with 4.75% is one `changed` block whose words are same, removed `5%`, added `4.75%`, same; a paragraph
rewritten from scratch is `removed` then `added`, not `changed`; a paragraph that only moved from label 1.6 to
1.5 is `same` with label 1.5; a removed paragraph keeps its old label; two empty editions, and one empty side;
reversing the direction swaps the added and removed counts; a paragraph that appears twice stays two
paragraphs; `similarity` is 1 and 0 at the ends. Then the two comparisons of the ground truth, read from the
sample: every point of Design E, and the counts that were measured and written into the Log.

G3, `api.test.ts`: health is 200 and `ok` on the sample; the list has 10 documents in manifest order; a
document comes with its editions newest first; an unknown document is 404 with its code; an unknown `/api/x` is
404 `not_found`; the PDF answers `application/pdf` without `Content-Disposition` and its bytes start with `%PDF`;
the Word file is an attachment named `H.1.4.3_v6.docx`; format `txt` and edition 1 are 404; the comparison of
editions 5 and 6 of `H.1.4.3` through the route gives the counts of phase 4; the four bad queries (none, only
`from`, equal numbers, `from=abc`) are 400; an edition outside the sample is 404; `loadCatalog` on a folder
without a manifest throws; an app built on a temporary folder whose manifest names files that do not exist
answers health 503 with the list, and the comparison 500 `file_unreadable` without crashing; an app built with a
temporary client folder that holds an `index.html` answers `/document/H.1.4.3` with it.

### H. The client: content and behaviour

This section says what every screen holds and does, and the exact Hebrew text. How it looks is Design I.

`index.html`: `lang="he"`, `dir="rtl"`, a viewport that lets the user zoom, title `מה השתנה בתכ"ם`, and
`<link rel="icon" href="data:," />` so the browser does not ask for a favicon. `main.tsx` imports the typefaces
and `styles.css`, and renders `App` inside `StrictMode` and a `BrowserRouter`. `App.tsx` is the frame: a top bar
(the name `מה השתנה בתכ"ם` as a link home, and `לאתר הוראות תכ"ם` opening https://takam.mof.gov.il in a new tab)
and the routes: `/` home, `/document/:id` the document page, anything else `הדף לא נמצא.`

`api.ts`: one `get<T>(url)` that throws an `Error` whose message is the error code (`server_error` when there is
none); `api.documents()`, `api.document(id)`, `api.compare(id, from, to)`, `api.fileUrl(id, edition, format)`;
and one hook, `useRequest(key, request)`, that returns `{ data, error, loading }`, runs again when `key` changes
and ignores an answer that arrives after the key changed. No data library.

`format.ts`: the type labels (`הוראה`, `הודעה`, `טופס`); `formatDate` (`2024-09-19` to `19.09.2024`, as the
directives write dates); `byNumber` (a numeric-aware sort, so 1.4.10 comes after 1.4.3); `errorText(code)`:
`document_not_found` `המסמך לא נמצא במדגם.`, `edition_not_found` `המהדורה לא נמצאת במדגם.`, `file_unreadable`
`הטקסט של אחת המהדורות חסר, ולכן אין השוואה. אפשר לקרוא כל מהדורה בנפרד.`, anything else
`השרת לא ענה. נסו לרענן את הדף.` Loading is `טוען…` everywhere.

**H1. Home (`HomePage.tsx`).** The title `מה השתנה בהוראות תכ"ם` and the lead
`כאן קוראים הוראה בלי להוריד קובץ, ורואים בדיוק מה השתנה בין מהדורה למהדורה. במדגם 10 מסמכים מתוך 3 פרקים.`
(the two numbers are counted from the data). Then two sections. `עודכנו לאחרונה`: the five documents whose
latest edition is the newest, newest first. `פרקים במדגם`: one tile per chapter, a button with `aria-pressed`
that holds the chapter number (the first part of the number of its documents), its name and `K מסמכים`
(`מסמך אחד` for one); under the tiles, the documents of the open chapter. One chapter is always open: the first
at the start, and choosing another tile opens that one. In a chapter, instructions are sorted by number, each
followed by its messages and forms (by number, then manifest order). A document row holds its number, its name
(a link to the document), its type, `מהדורה N מיום DD.MM.YYYY`, and the link `מה השתנה` (to `?tab=changes`) only
when the document has more than one edition. While the list loads, or when it fails, a note takes the place of
the two sections.

**H2. Document page (`DocumentPage.tsx`, `SidePanel.tsx`).** From the top: a first line with `כל המסמכים` as a
link home, then ` / <chapter> / <subChapter>` as plain text; the title, made of the number and the name; a meta
line, `<type>, מהדורה N, בתוקף מיום DD.MM.YYYY`, that always names the latest edition, also while an older one
is read; the two tabs; then the view of the chosen tab next to a side panel. The page title is
`<number> <name> | מה השתנה בתכ"ם`, and it goes back to `מה השתנה בתכ"ם` when the page is left. An unknown
document shows `errorText` and the link `חזרה לרשימת המסמכים`.

The two tabs (phase 8) are links inside a `nav` (`aria-label="תצוגות המסמך"`), the active one with
`aria-current="page"`: `קריאה` leads to the page without a query, `מה השתנה` to `?tab=changes`. `?edition=N`
chooses the edition to read (the latest when absent or unknown). `?tab=changes` shows the changes view; for a
document with one edition it shows `למסמך הזה יש במדגם מהדורה אחת, אז אין עם מה להשוות.`

Side panel: under `מהדורות`, one row per edition: the link `מהדורה N` (to `?edition=N`, marked when it is the
one being read), its date, and `הורדת Word` (a link with the `download` attribute); then
`במדגם נשמרות עד שלוש המהדורות האחרונות של כל מסמך.` Under it, a second titled list: a message or a form shows
`שייך להוראה` and its instruction; an instruction with messages or forms shows `הודעות וטפסים של ההוראה` and
each of them. A related row is `<type> <number>` (a link) and the name.

**H3. Reading view (`ReadView.tsx`).** An `<iframe>` whose address is the PDF route followed by
`#view=FitH&navpanes=0` (fit the width, hide the viewer's side panel), with the title `<name>, מהדורה N` and a
`key` equal to its address: an `<iframe>` whose `src` changes adds a step to the browser's history, and a new
frame per edition keeps the back button on the page. Above it, when the edition is not the latest, a note:
`זו מהדורה N מיום DD.MM.YYYY, לא המהדורה שבתוקף.` Under it the link `פתיחת המסמך בלשונית נפרדת`, which opens the
PDF route (without the `#` part) in a new tab.

**H4. Changes view (`CompareView.tsx`).** It compares the latest edition with an older one: `?from=N`, or the one
before the latest when `from` is absent or unknown. `משווים את מהדורה 6 מיום 19.09.2024 מול` is the `<label>` of
a `<select>` of the older editions (`מהדורה 5 מיום 09.05.2021`); choosing one navigates to
`?tab=changes&from=N`. The select line stays on screen in every state. Under it, as notes: while waiting
`משווה בין המהדורות…`; on failure `errorText`; without changes `אין הבדלים בטקסט בין שתי המהדורות.` Otherwise
the summary, as four counts (`N פסקאות שונו`, `N נוספו`, `N הוסרו`, `N לא השתנו`), the checkbox
`להציג גם פסקאות שלא השתנו` (off at the start: only the changes are listed), the sentence
`ההשוואה היא של נוסח הסעיפים. סעיף שרק מספרו השתנה לא נחשב שינוי.` and the blocks in order. A block is one `<p>`:
the word `שונה`, `נוסף` or `הוסר`, the section number when there is one, then the text. In a changed block the
removed words are in `<del>` and the added words in `<ins>`, with one space between consecutive parts, outside
the two elements.

### I. Visual design: the brief for the taste skill

The look is not fixed in this plan. It is made in phase 6 with the taste skill (`design-taste-frontend`, from
`taste-skill`, in Kfir's global skills). Load it before any client code is written. If it is not available, stop
and ask Kfir. Use it for the look of the three screens of Design H; it adds no screen, section or copy.

- What this is: a working tool for people who read financial regulations every day. They come to find a
  directive, read it, and see what changed. It is an application, not a marketing page.
- The bar: modern and calm, and clearly better looking than the site it improves (https://takam.mof.gov.il).
  Kfir judges it on the screen; iterate with him on the home screen until he approves, then carry the same
  system to the other screens.
- The numbers of the Takam (chapter, directive, section) are how users find their way, so they must be easy to
  see in a list, in a title and next to every changed paragraph.
- The changes view is the heart of the product. A reader must tell at a glance which paragraphs were changed,
  added or removed, and inside a changed paragraph which words went out and which came in. Colour is never the
  only signal: every block also carries its word (`שונה`, `נוסף`, `הוסר`), and `<del>` and `<ins>` keep their
  strike-through and underline.
- The PDF is drawn by the browser's own viewer inside the page. Give it room: the full width of its column and
  most of the height of the window.
- Hard limits: Hebrew and right-to-left throughout, with logical CSS only (`margin-inline-start`,
  `border-inline-start`, `text-align: start`); all text at a contrast of 4.5 to 1 or better; a visible focus
  outline on every link, button and field; the user can zoom; no sideways scrolling at 390 wide, where the side
  panel goes under the main column.
- Technical limits: plain CSS in `client/src/styles.css`, with the palette, type scale and spacing as CSS
  variables at the top; no CSS framework, no component library, no animation library, no icon set beyond a few
  inline SVGs. Typefaces must cover Hebrew and are bundled through `@fontsource` (no request to an outside
  server). Motion, if any, is CSS only and respects `prefers-reduced-motion`.
- When the look is settled, write its tokens (colours, typefaces, sizes) in a short comment at the top of
  `styles.css`, and one line about it in the Log.

### J. Data preparation (`scripts/`)

The site's API, as read on 2026-11-23. Both JSON answers are a bare array of objects.

| Call | Answer | Fields used |
|---|---|---|
| `GET {base}/api/Document` | every document (1,127) | `sfid`, `name`, `documentcodetext` (`H.1.4.3`), `documenttype` (`Instruction`, `Message`, `Form`), `parentdocument` (the `sfid` of the instruction, or null), `firstnamechapter`, `secondnamechapter` (null on a message and on a form) |
| `GET {base}/api/DocumentVersion/{sfid}` | the editions of one document | `rtn_versionnumber__c` (a number), `rtn_validfrom__c` (`2024-09-19T00:00:00.000Z`), `rtn_contentversionid__c` |
| `GET {base}/api/DocumentSF/DownloadDocument/{contentversionid}/{name}` | the bytes of the file | `{name}` is free text; the document id is sent |

`sample.config.json`, in the project root:
`{ "editionsPerDocument": 3, "documents": [ ...the ten ids, in the order of Design B ] }`.

`fetch-sample.ts`: create `DATA_DIR` when it does not exist. For every id of the config, find the document (stop
with `<id> was not found on the site` when it is missing) and its parent; read its editions, sort them by
number, newest first (the site's order is not promised), and take the first `editionsPerDocument`; download
each one and save it as `<id>_v<number>.docx` in `DATA_DIR`. A file whose bytes do not start with `PK` is not a
docx: skip it with the warning `skipped <file>: it is not a Word (docx) file`; the document then simply has one
edition less. The manifest entry: `number` is the id after its first dot; `name` is trimmed and loses the invisible
direction marks U+200E and U+200F (one name on the site ends with one); `type` is the lower-case form of the site's type; `chapter` and
`subChapter` come, as the site sends them, from the parent when there is one; `parentId` is the parent's id
only when the parent is in the sample; `validFrom` is the first 10 characters of `rtn_validfrom__c`, cut from
the text and not parsed, so a time zone can never move the date by a day. Every request sends
`user-agent: takam-editions-poc (sample download)` and is followed by a pause of 300 ms. An answer that is not
2xx stops the script with `the site answered <status> for <url>`. `manifest.json` is written last, after every
file was saved, with `source` = `TAKAM_BASE_URL` and `fetchedAt` = today, and the script ends with
`manifest.json was written to <dir>`. On failure it prints `The sample was not downloaded: <reason>` and exits
with 1.

When the site refuses: if the first request is answered with anything but a 2xx JSON answer (a firewall page,
a 403), do not retry, and do not disguise the request as a browser. The same 21 Word files and their
`manifest.json` were already downloaded through Kfir's browser on 2026-11-23: look for them in his Downloads
folder (inside WSL: `/mnt/c/Users/<user>/Downloads`), copy `manifest.json` and the 21 files it names into
`data/sample`, and say so in the Log. If they are not there, stop and tell Kfir.

`convert.ts` needs LibreOffice, of the system the project runs on (inside WSL: the Linux package, not the
Windows program). Find it first with `soffice --version`; on Windows the program is usually
`C:\Program Files\LibreOffice\program\soffice.exe`. When it is not on the PATH, put its path in `.env` as
`SOFFICE_PATH`. When it is not installed, stop and ask Kfir to install it, then go on: Windows
`winget install TheDocumentFoundation.LibreOffice`, macOS `brew install --cask libreoffice`, Ubuntu or WSL
`sudo apt-get install -y libreoffice-writer`.

`convert.ts`: list the `.docx` files of `DATA_DIR` that lack a `.pdf` or a `.txt`. When there are none, print
`Every Word file already has a PDF and a text file.` and end. Otherwise run LibreOffice twice on all of them,
without a shell: `<SOFFICE_PATH> --headless --convert-to pdf --outdir <DATA_DIR> <files>`, then the same with
`--convert-to "txt:Text (encoded):UTF8"`, and print `<n> Word files were converted to PDF and text.` When it
fails, print the reason and `Is LibreOffice installed? If it is not on the PATH, set SOFFICE_PATH in .env.` and
exit with 1.

### K. Stack notes

1. Express 5 rejects the route path `'*'` at startup. A fallback is `app.use(handler)` without a path.
2. Express 5 passes a listen error (a taken port) to the callback of `app.listen` instead of throwing. A
   callback that only logs would print "is listening" on a taken port. The callback must throw the error it
   receives.
3. With `supertest`, a binary answer is read with `.responseType('blob')`; `res.body` is then a `Buffer`.
4. `tsc --noEmit` fails with "No inputs were found" while there is no `.ts` file yet, so phase 1 does not run it.

## Risks

- A check of phase 4 does not hold: the code differs from Design D or E, or the plan is wrong about the
  documents. Stop and tell Kfir; do not adjust the test.
- The site refuses the download of phase 2: the same files were downloaded through Kfir's browser, and Design J
  says where to take them from. Kfir's README states which way the sample arrived.
- LibreOffice is not installed: phase 2 stops and asks Kfir to install it; nothing else needs it.
- The look takes more rounds than planned: it is settled on one screen in phase 6, before the others are built.
- The PDFs are made by LibreOffice, not by Word: the layout is close to the source and may not be identical. The
  README says so.
- Mobile browsers that do not show a PDF inside a page: the link under the frame opens it alone (decision 9).

## Out of scope

Search inside the text. An LLM summary or a chat. A database. Login and permissions. Scheduled ingestion of new
editions. Comparing tables as tables (a table is compared row by row, as paragraphs). Detecting a paragraph
that moved. Automated tests for the client. Docker and CI/CD. Kfir's README describes how each would be
approached.

## Log

- 2026-11-23 plan written.
- 2026-11-23 phase 1: Node v22.16.0; `npx tsc --version` printed `Version 7.0.2`; all 18 packages installed at
  their pinned versions. Nothing differs from the plan.
- 2026-11-23 phase 2: the Word files arrived from the site, by the script (`npm run fetch-sample`: every request
  was answered and no file was skipped), and LibreOffice 26.2.5.2 converted them. Verify: typecheck clean;
  `10 documents, 21 editions, 64 files`; 21 of 21 PDFs start with `%PDF`; 21 of 21 text files hold Hebrew text;
  line 15 of `H.1.4.3_v6.txt` starts with `1.5.9.`; a second `npm run convert` printed
  `Every Word file already has a PDF and a text file.` Differs from the plan: `shared/types.ts` (Design C, word
  for word) was written in this phase and not in phase 3, because `fetch-sample.ts` types the manifest it writes
  with `Manifest`; and the scripts stop on three cases Design J does not name: an answer that is 2xx but not a
  JSON list, a document type outside the contract, and a LibreOffice run that ends well without writing a file.
- 2026-11-23 phase 3: typecheck clean; `npx vitest run tests/text.test.ts` passed, 10 of 10, each case first seen
  failing. `H.1.4.3_v6.txt` gives 143 paragraphs, equal to its 143 non-empty lines: the first is
  `{ label: '1', text: 'מבוא' }`, one is labelled `1.5.9`, none has an empty text. Differs from the plan:
  LibreOffice 26.2 writes a table row as one line, its cells apart by tabs, and not every cell as a line of its
  own (Design B), so a table row is one paragraph; G1 got one more case, for such a row.
- 2026-11-23 fix to phase 3, on Kfir's word: the zero-width space U+200B joined the invisible characters
  (Design D, `server/text.ts`, and one more test, seen failing first: 11 pass). In the sample it sits at the end
  of five table rows of `HOD.7.3.3.1`, the same in editions 7, 8 and 9; the paragraph counts did not change.
- 2026-11-23 on Kfir's word: Design B and Out of scope now say that a table row is one line and that a table is
  compared row by row.
- 2026-11-23 phase 4: `npx vitest run tests/compare.test.ts` passed, 13 of 13, each case first seen failing;
  typecheck clean and `npm test` passed (24 tests). Counts as same, changed, added, removed, pinned in the test
  file: `H.1.4.3` edition 5 against 6: 107, 26, 10, 8; `HOD.3.1.1.1` edition 53 against 54: 6, 3, 0, 0. Every
  point of the ground truth holds. In 1.4.3 the first change is `removed` 1.3, 1.5.9 is `added`, 2.6 is
  `changed`, 2.3 and the heading of 2.9.2 are each `removed` then `added` (rewritten past the threshold), with
  2.9.2.1 to 2.9.2.4 `changed`, and 2.12 shows as a `removed` 2.12.2 next to a `changed` paragraph that edition 6
  leaves without a number. In the message, 1.1 holds `5%` out and `4.75%` in. Changed sections that the change
  table of edition 6 does not mention: 2.9.3 (the yearly report: 2.9.3.1 changed, the old 2.9.3.2 and 2.9.3.3
  gave way to a new 2.9.3.2); 3.8 and 3.11 (removed from the list of documents); 1.5.2 and 3.14 (the name of
  another directive); 1.4 and 2.8 (a reference to a renumbered section); 2.1, 2.4.1, 2.4.2, 2.9.1 and item 2 of
  appendix A (a space dropped after a hyphen). Nothing differs from the plan.
- 2026-11-23 phase 5: `npm test` passed (43 tests: 11 text, 13 compare, 19 API, each API case first seen
  failing) and typecheck is clean. With nothing on port 3000, `npm start` printed
  `takam-editions is listening on http://localhost:3000 with 10 documents` and `GET /api/health` answered exactly
  `{"status":"ok","documents":10,"editions":21,"missingFiles":[]}`; the server was then stopped. Also checked by
  hand: a second `npm start` on the taken port ends with `EADDRINUSE` and never says it is listening, and a
  `DATA_DIR` without a manifest stops the start with the message of Design F. Differs from the plan:
  `res.sendFile` and `res.download` get `dotfiles: 'allow'`, because Express 5 answers "not found" for a full
  path that holds a folder whose name starts with a dot, so a clone under such a folder would serve no file. G3
  got five more cases: that one, the parent and the children of a document, the order of the checks in the file
  route and in the compare route, and the API alone while the client is not built.
