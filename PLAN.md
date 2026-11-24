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
   look clearly better than the site it improves. (Rejected: a look fixed in advance in this plan.) After
   Kfir's review of the first look, the look was set in phase 9 and is the one Design I describes, and the
   taste skill only checks it.
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
Write into the Log how the Word files arrived.
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
- [x] Load the taste skill and settle the look per Design I: palette, typefaces, spacing, the shape of a list
      row, a tile, a tab and a changed paragraph. Show Kfir the direction on the home screen and get his word
      before building the other screens.
- [x] `vite.config.ts`, `client/index.html`, `client/src/main.tsx`, `api.ts`, `format.ts` per Design A and H.
- [x] `client/src/App.tsx`: the frame and the routes `/` and "anything else" (the document route comes in phase 7).
- [x] `client/src/styles.css`: the design tokens as CSS variables, and the base styles.
- [x] `client/src/HomePage.tsx` per Design H1.

Verify: `npm run check` passes. Kfir looks (`npm run dev`, http://localhost:5173), at a wide window and at 390
wide: five recently updated documents, the first is 7.3.3 "ערבויות וביטחונות" (edition 18, 05.10.2026); three
chapters numbered 1, 3 and 7; choosing chapter 7 lists 7.3.1 and 7.3.3, with one message and one form under
7.3.3. Kfir approves the look.
Commit: `feat(client): home screen with recent updates and chapters`

### Phase 7: document page and reading view
- [x] `DocumentPage.tsx` (the title, the meta line, the layout; no tabs yet), `ReadView.tsx` and `SidePanel.tsx`
      per Design H2 and H3.
- [x] The `/document/:id` route in `App.tsx`.

Verify: `npm run check` passes. Kfir looks: `/document/H.1.4.3` shows the PDF of edition 6 with sections 1.1,
1.2 and so on; "מהדורה 5" in the side panel shows edition 5 with the note that it is not the edition in force,
and the back button returns to edition 6; "הורדת Word" downloads `H.1.4.3_v6.docx`; `/document/H.7.3.3` lists
one message and one form in the side panel; `/document/H.9.9.9` shows a clear message and a link home.
Commit: `feat(client): document page with the PDF reading view`

### Phase 8: changes view
- [x] The two tabs in `DocumentPage.tsx`, and the one-edition message, per Design H2.
- [x] `CompareView.tsx` per Design H4.

Verify: `npm run check` passes. Kfir looks: `/document/H.1.4.3?tab=changes` shows the counts that phase 4
wrote into the Log, and the first change is section 1.3 marked "הוסר"; the checkbox shows the whole document;
`/document/HOD.3.1.1.1?tab=changes` shows 5% turned into 4.75%; `/document/H.3.1.1?tab=changes` says the
document has one edition in the sample. Also at 390 wide: no sideways scrolling.
Commit: `feat(client): changes view between two editions`

### Phase 9: a second design round, on Kfir's word after his review of the screens
Phases 6 to 8 stay above as the history of the first round. Design H and Design I describe the screens as this
phase leaves them. No new dependency: the weight 600 comes from the typeface package that is already installed.

- [x] `styles.css`: the look of Design I. `main.tsx`: the weight 600 of the typeface.
- [x] `client/src/tree.ts` per Design H: the grouping that `HomePage.tsx` held moves there, with
      `recentlyUpdated`.
- [x] `App.tsx` per Design H: the top bar without the link to the Takam site, one request for the list, and no
      scroll to the top for an address with a hash.
- [x] `Catalogue.tsx` and `HomePage.tsx` per Design H1.
- [x] `SideTree.tsx`, `EditionPicker.tsx` and `DocumentPage.tsx` per Design H2. `SidePanel.tsx` is deleted.
- [x] `ReadView.tsx` per Design H3 and `CompareView.tsx` per Design H4.

Verify: `npm run check` passes. Then, in a headless Chromium at 1440 and at 390 wide:
- `/`: the first chapter card is on the first screen at 1440x900; nothing stands under the title but the
  catalogue; the top bar has no link to the Takam site; the aside lists 7.3.3 first.
- `/document/H.1.4.1`: the tree marks 1.4.1 and shows 1.4.3 and 1.4.5 next to it; the third link of the
  breadcrumb lands on `/` with the strip of 1.4 in view.
- `/document/H.1.4.3`: the pill of edition 6 carries `בתוקף`; `?edition=5` shows the banner and the button reads
  `הורדת Word, מהדורה 5`; the back button returns to edition 6.
- `/document/H.1.4.3?tab=changes`: the chips read 26, 10, 8 and 107; the pill of edition 4 moves the address to
  `from=4`; ticking the checkbox does not change `document.documentElement.clientWidth`.
- `/document/HOD.7.3.3.1`: the tree marks the message under 7.3.3.
- No sideways scrolling at 390; the focus shows on every control; the checker of the taste skill passes
  contrast, tap sizes and overflow.

Commit: `feat(client): catalogue, side tree and edition picker` (with `PLAN.md` and the Gate lines that were
waiting)

### Gate
- [x] `npm run check` passes from a clean `npm ci`; `git status` is clean.
- [x] Tell Kfir the number of tests, the counts of phase 4 and how the sample arrived in phase 2: his README
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
client/src/           main.tsx, App.tsx, api.ts, format.ts, tree.ts, HomePage.tsx, Catalogue.tsx,
                      DocumentPage.tsx, SideTree.tsx, EditionPicker.tsx, ReadView.tsx, CompareView.tsx,
                      styles.css (H, I)
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

export interface Edition {
  number: number;
  validFrom: string; // YYYY-MM-DD
  file: string;
}

export interface DocumentEntry {
  id: string;
  number: string;
  name: string;
  type: DocType;
  chapter: string;
  subChapter: string;
  parentId: string | null; // a message or a form belongs to an instruction
  editions: Edition[]; // newest first
}

export interface Manifest {
  source: string;
  fetchedAt: string;
  documents: DocumentEntry[];
}

export interface DocumentDetail extends DocumentEntry {
  parent: DocumentEntry | null;
  children: DocumentEntry[];
}

export interface Paragraph {
  label: string; // "1.5.9" or ""
  text: string;
}

export interface WordPart {
  kind: 'same' | 'added' | 'removed';
  text: string;
}

// A paragraph that stayed, was added or was removed: one text.
export interface PlainBlock {
  kind: 'same' | 'added' | 'removed';
  label: string;
  text: string;
}

// A paragraph that was edited: its words, each marked as same, added or removed.
export interface ChangedBlock {
  kind: 'changed';
  label: string;
  words: WordPart[];
}

export type Block = PlainBlock | ChangedBlock;

export interface CompareSummary {
  same: number;
  changed: number;
  added: number;
  removed: number;
}

export interface CompareResult {
  documentId: string;
  from: Edition;
  to: Edition;
  summary: CompareSummary;
  blocks: Block[];
}

export interface HealthResult {
  status: 'ok' | 'degraded';
  documents: number;
  editions: number;
  missingFiles: string[];
}

export interface ApiError {
  error: string;
}
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
500 `server_error`. One error is the caller's and not the server's: an address with a broken `%` escape, which
Express rejects with a `URIError` before any route runs. The handler answers it 400 `bad_request` and does not
log it.

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

This section says what every screen holds and does, and the exact Hebrew text, as phase 9 leaves them. How it
looks is Design I.

`index.html`: `lang="he"`, `dir="rtl"`, a viewport that lets the user zoom, title `מה השתנה בתכ"ם`, and
`<link rel="icon" href="data:," />` so the browser does not ask for a favicon. `main.tsx` imports the typeface
(the Hebrew and the Latin subsets, in the weights 400, 500 and 600) and `styles.css`, and renders `App` inside
`StrictMode` and a `BrowserRouter`.

`App.tsx` is the frame. The top bar holds the mark and the name `מה השתנה בתכ"ם`, as one link home, and nothing
else. `App` asks for `/api/documents` once and hands the list to both pages. Until the list arrives a note says
`טוען…`; when the request fails the note is the `errorText` of its code. The routes are drawn once the list is
there: `/` home, `/document/:id` the document page, anything else `הדף לא נמצא.` A new page starts at its top,
with two exceptions: going back, where the browser returns to where the reader was, and an address with a
hash, where the home screen scrolls to the place the hash names.

`api.ts`: one `get<T>(url)` that throws an `Error` whose message is the error code (`server_error` when there is
none); `api.documents()`, `api.compare(id, from, to)`, `api.fileUrl(id, edition, format)`; and one hook,
`useRequest(key, request)`, that returns `{ data, error, loading }`, runs again when `key` changes and ignores
an answer that arrives after the key changed. No data library. The client does not ask for one document: a
document page finds it in the list. The route `GET /api/documents/:id` stays in the API.

`format.ts`: the type labels (`הוראה`, `הודעה`, `טופס`); the name of the app; `formatDate` (`2024-09-19` to
`19.09.2024`, as the directives write dates); `editionLine` (`מהדורה N מיום DD.MM.YYYY`, how a list names the
latest edition of a document); `byNumber` (a numeric-aware sort, so 1.4.10 comes after 1.4.3); `errorText(code)`:
`document_not_found` `המסמך לא נמצא במדגם.`, `edition_not_found` `המהדורה לא נמצאת במדגם.`, `file_unreadable`
`הטקסט של אחת המהדורות חסר, ולכן אין השוואה. אפשר לקרוא כל מהדורה בנפרד.`, anything else
`השרת לא ענה. נסו לרענן את הדף.` Loading is `טוען…` everywhere.

`tree.ts`: the tree of the Takam as far as the sample goes, as pure functions without React. The number of a
chapter is the first part of a document number (`chapterNumber`), and the number of a sub-chapter is its first
two parts, `1.4` (`subChapterNumber`); their names are the `chapter` and the `subChapter` of the documents.
`chaptersOf(documents)` gives the chapters by number, in each chapter its sub-chapters by number, and in a
sub-chapter the instructions by number, each followed by its messages and forms (by number, then manifest
order). `recentlyUpdated(documents)` gives the five documents whose latest edition is the newest, newest first.

**H1. Home (`HomePage.tsx`, `Catalogue.tsx`).** The title `כל המסמכים`, and under it nothing but the catalogue.
From 1024 wide an aside stands beside the catalogue; under 1024 it comes after it.

The catalogue is one card per chapter, with the id `c-<chapter number>`. Its header holds the number of the
chapter, its name, and `N מסמכים` (`מסמך אחד` for one). Every sub-chapter opens with a strip, with the id
`s-<sub-chapter number>`, that holds its number and its name. Under the strip, one row per document: its
number, its name (a link to the document), the word `הודעה` or `טופס` for a message or a form (an instruction
gets none), `מהדורה N מיום DD.MM.YYYY`, and the link `מה השתנה` (to `?tab=changes`) only when the document has
two editions or more. The whole row opens the document; `מה השתנה` stays a link of its own on top of it.

The aside is one card, `עודכנו לאחרונה`: the documents of `recentlyUpdated`, two lines each. The first line is
the number and the name, as the link to the document; the second is `מהדורה N מיום DD.MM.YYYY`, with `מה השתנה`
at its end under the same condition.

When the address has a hash (`/#c-1`, `/#s-1.4`), the home screen scrolls the element with that id into view.
The ids hold dots, so the element is found with `getElementById` and not with a selector.

**H2. Document page (`DocumentPage.tsx`, `SideTree.tsx`, `EditionPicker.tsx`).** The page finds its document in
the list, by the id in the address. From 1024 wide it has two columns: the side tree, then the document. Under
1024 the tree is not shown, and the breadcrumb is the way to the neighbours.

The side tree is a `nav` (`aria-label="עץ המסמכים"`): the link `כל המסמכים` (home), then every chapter (its
number and name), its sub-chapters (number and name) and their documents, in the order of `chaptersOf`. A
document is a link that holds its number and its name; a message or a form starts with its type word. The open
document carries `aria-current="page"`.

The document, from the top: a breadcrumb, a `nav` (`aria-label="מיקום המסמך"`) of three links: `כל המסמכים` to
`/`, `<chapter number> <chapter>` to `/#c-<number>`, and `<sub-chapter number> <subChapter>` to `/#s-<number>`;
the title, made of the number and the name; and a meta line, `<type>, מהדורה N, בתוקף מיום DD.MM.YYYY`, that
always names the latest edition, also while an older one is read. The page title is
`<number> <name> | מה השתנה בתכ"ם`, and it goes back to `מה השתנה בתכ"ם` when the page is left. An id that is
not in the list shows, next to the tree, `המסמך לא נמצא במדגם.` and the link `חזרה לרשימת המסמכים`.

Row A holds the view switch at its start and, in the reading view, the two actions at its end. The view switch
is two links inside a `nav` (`aria-label="תצוגות המסמך"`), the current one with `aria-current="page"`: `קריאה`
leads to the page without a query, `מה השתנה` to `?tab=changes`. `?edition=N` chooses the edition to read (the
latest when absent or unknown). `?tab=changes` shows the changes view; for a document with one edition it shows
`למסמך הזה יש במדגם מהדורה אחת, אז אין עם מה להשוות.` and no picker.

Row B is the edition picker: a list (`aria-label="מהדורות"`) of pills, each a link that holds `מהדורה N` and
its date (`DD.MM.YYYY`); the latest edition also carries the badge `בתוקף`. The chosen pill has
`aria-current="true"`. The view says which editions the picker lists and where a pill leads.

**H3. Reading view (`ReadView.tsx`).** The two actions of row A: `הורדת Word, מהדורה N`, a link with the
`download` attribute to the Word file of the edition on the screen, and `פתיחת המסמך בלשונית נפרדת`, which opens
the PDF route (without the `#` part) in a new tab, because not every mobile browser shows a PDF inside a page.
The picker lists every edition: a pill leads to `?edition=N`, and the pill of the latest to the address
without a query. When the edition on the screen is not the latest, a banner says
`זו מהדורה N מיום DD.MM.YYYY, לא המהדורה שבתוקף.` and ends with the link `למהדורה שבתוקף`. Then the document: an
`<iframe>` whose address is the PDF route followed by `#view=FitH&navpanes=0` (fit the width, hide the viewer's
side panel), with the title `<name>, מהדורה N` and a `key` equal to its address: an `<iframe>` whose `src`
changes adds a step to the browser's history, and a new frame per edition keeps the back button on the page.

**H4. Changes view (`CompareView.tsx`).** It compares the latest edition with an older one: `?from=N`, or the one
before the latest when `from` is absent or unknown. Row B: the words `מה השתנה במהדורה N לעומת` (N is the
latest), then the picker with the older editions only; a pill leads to `?tab=changes&from=M`. The row stays on
the screen in every state. Under it, as notes: while waiting `משווה בין המהדורות…`; on failure `errorText`;
without changes `אין הבדלים בטקסט בין שתי המהדורות.` Otherwise: a row of four chips (`N פסקאות שונו`, `N נוספו`,
`N הוסרו`, `N לא השתנו`) with the checkbox `להציג גם פסקאות שלא השתנו` at its end (off at the start: only the
changes are listed); the sentence `ההשוואה היא של נוסח הסעיפים. סעיף שרק מספרו השתנה לא נחשב שינוי.`; and the
blocks in order. A block is one `<p>`: the word `שונה`, `נוסף` or `הוסר`, the section number when there is one,
then the text. A paragraph that did not change carries no word. In a changed block the removed words are in
`<del>` and the added words in `<ins>`, with one space between consecutive parts, outside the two elements.

### I. Visual design

The first look was made in phase 6 with the taste skill (`design-taste-frontend`); the Log of phases 6 to 8
records it. After his review of the screens Kfir decided the look himself, and phase 9 built it. This section
is that look. The taste skill deals no palette here; only its checker is used, as a diagnostic.

What the look serves:

- A working tool for people who read financial regulations every day. They come to find a directive, read it,
  and see what changed. It is an application, not a marketing page: short, light and pleasant to browse.
- The numbers of the Takam (chapter, directive, section) are how users find their way, so they must be easy to
  see in a list, in a title and next to every changed paragraph.
- The changes view is the heart of the product. A reader must tell at a glance which paragraphs were changed,
  added or removed, and inside a changed paragraph which words went out and which came in. Colour is never the
  only signal: every block also carries its word (`שונה`, `נוסף`, `הוסר`), and `<del>` and `<ins>` keep their
  strike-through and underline.
- The PDF is drawn by the browser's own viewer inside the page. Give it room: the full width of its column and
  most of the height of the window.

Limits:

- Hebrew and right-to-left throughout, with logical CSS only (`margin-inline-start`, `border-inline-start`,
  `text-align: start`); all text at a contrast of 4.5 to 1 or better; a visible focus outline on every link,
  button and field; the user can zoom; no sideways scrolling at 390 wide.
- Plain CSS in `client/src/styles.css`, with the colours, the sizes and the spacing as CSS variables at the top
  and the tokens of the look in a short comment above them; no CSS framework, no component library, no
  animation library, no icon set beyond a few inline SVGs. The typeface covers Hebrew and is bundled through
  `@fontsource` (no request to an outside server).

The look:

- Colours: page `#f6f7f9`, card `#ffffff`, ink `#111827`, muted `#5b6472`, line `#e5e7eb`, strong line
  `#d1d5db`, hover `#f1f3f6`, accent `#2451d6`, accent soft `#e9efff`, accent ink `#1b3fa8`.
  Added: bg `#e9f7ef`, mark `#bfe6cf`, ink `#17663a`, stripe `#2e9e5b`. Removed: bg `#fdeeee`, mark `#f7c6c6`,
  ink `#a32020`, stripe `#d64545`. Changed: bg `#fdf3d7`, ink `#8a5a00`, stripe `#e0a100`.
  Two more greys: `#eceef2`, the track of the view switch, the ground of a type pill, and the hover of what
  stands on the page and not on a card (there `#f1f3f6` does not show); and `#fafbfc`, the strip of a
  sub-chapter.
- Type: IBM Plex Sans Hebrew 400, 500 and 600. Sizes 12, 13, 14, 15 and 18, and 26 for the title of a page (22
  under 640px). 600 for headings and card titles, 500 for names, numbers and controls. Nothing is larger than
  26px. A Takam number is set in tabular figures.
- Shape: a card is white, radius 12px, a 1px line, shadow `0 1px 2px rgb(16 24 40 / 0.05)`. Controls and rows
  have a radius of 8px, pills 999px. Spacing stays on 4, 8, 12, 16, 24, 32 and 48.
- A link inside a list or a control is not underlined: it answers with a hover background or the accent. An
  underline stays only for a link inside a sentence. Hover and press take 120ms; nothing else moves.
- `html` has `overflow-y: scroll`: the browser draws the track of the scrollbar on every page, also on one too
  short to scroll, so the page never shifts between a short page and a long one.

Frame. The top bar is white, 56px high and sticky, with a line under it; the name is 15px/600. The container
is at most 1200px wide, with a gutter of 24px (16px under 640px). A note (loading, an error, a page that is not
there) is a white card.

Home. From 1024px two columns: the catalogue, then an aside of 20rem.

- A chapter card. Header: the chapter number in a 28px square (accent soft, accent ink, 600), the name at
  18px/600, and the count at the end in 13px muted. A sub-chapter strip: the number and the name, 13px/500
  muted on `#fafbfc`, a line above and a line under.
- A document row is at least 48px tall: the number (tabular, 500, a 4.5rem column), the name (15px/500), a
  small grey pill for `הודעה` or `טופס`, then the edition (13px muted, an 11rem column) and `מה השתנה`
  (13px/500 accent, a 5.5rem column). The row is `position: relative`, the name link has an `::after` that
  covers the row, and `מה השתנה` sits above it (`position: relative; z-index: 1`). Hover paints the row. A
  message or a form is stepped in 24px under its instruction, at the end of a small elbow.
- The ids of a chapter card and of a strip have a `scroll-margin-top`, so the sticky bar does not cover them.
- The aside card is sticky under the bar; its title is 15px/600. An item of it: the number and the name at
  14px/500, then the edition in 13px muted with `מה השתנה` at the end. The whole item opens the document, as a
  row does.

Document page. From 1024px two columns: the side tree (18.75rem), then the document.

- The side tree is sticky under the bar, and it scrolls on its own when it is taller than the window. A
  chapter is 13px/600 and a sub-chapter 12px muted. A document row is 36px tall, 14px, radius 8px: the number
  in muted 500, then the name; hover background. The open document has the accent soft background and the
  accent ink, at 500. A message or a form is stepped in 16px, and its type word is 12px muted.
- The breadcrumb is 13px muted; a link of it answers with the accent. The title is 26px/600; the meta line is
  14px muted.
- The view switch is a segmented control: a track of `#eceef2`, padding 3px, radius 10px; two links, 36px tall,
  14px/500 muted. The current one is white with ink text and a light shadow, radius 7px (the 10px of the track
  less its padding).
- The edition picker: pill links 40px tall, white, a 1px strong line, radius 999px; `מהדורה N` at 14px/500 and
  the date in 13px muted. The badge `בתוקף` is 12px/500, added bg and added ink. The chosen pill has the accent
  border, the accent soft background and the accent ink.

Reading view.

- The two actions are 36px tall, radius 8px, 14px/500: the Word download is a button (white, a 1px strong
  line); the link that opens the PDF alone has no border, and a hover background.
- The banner of an older edition: changed bg, radius 8px; its link is underlined, as a link in a sentence.
- The PDF frame: radius 12px, a 1px strong line, white behind it; its height is the window less the bar and
  48px (56% of the window on a phone).

Changes view.

- Row B: the words at 14px/500, then the picker.
- A chip is 32px tall, white, a 1px line, radius 999px, 13px, with an 8px dot in the stripe colour of its kind
  (the strong line for the last) and the number in 600. The checkbox stands at the end of the row of chips.
- The sentence about section numbers is 13px muted.
- A block is a card: white, radius 8px, a 1px line, padding 12px 16px, and a 3px stripe at its start in the
  colour of its kind; added and removed also take their bg. Two columns: 5.5rem with the kind badge (12px/500)
  and the section number under it (14px/500, tabular); then the text, at most 72ch wide. The badge has the bg
  and the ink of its kind; on an added or a removed card, whose ground is that same bg, it takes the mark of
  its kind, so it still reads as a badge. `<del>` and `<ins>` keep the line through and the underline, on the
  removed and the added marks. A paragraph that did not change has no card: muted text on the page.

Under 1024px. One column everywhere. A catalogue row becomes two lines: the number, the name and the pill;
then the edition, with `מה השתנה` at the end. Links and controls are at least 44px tall. The picker wraps. A
block stacks: the badge and the number on one line, the text under them.

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
edition less. A document that is left without any edition stops the script with
`<id> has no edition in docx format`: the app reads the first edition of every document, so such a document must
not reach the manifest. The manifest entry: `number` is the id after its first dot; `name` is trimmed and loses the invisible
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
a 403), do not retry, and do not disguise the request as a browser. Stop and tell Kfir.

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
- The site refuses the download of phase 2: the script does not retry and does not disguise the request as a
  browser; Claude Code stops and tells Kfir (Design J). Kfir's README states how the sample arrived.
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
- 2026-11-23 fix to phase 5, on Kfir's word: an address with a broken `%` escape (`/api/documents/%`) is
  answered 400 `bad_request` and is not logged, where it was a logged 500 `server_error` (Design F,
  `server/app.ts`, and one more test, seen failing first: 44 pass).
- 2026-11-23 on Kfir's word: the code block of Design C shows the contract as Kfir reformatted it in `9f5446a`,
  one field per line, with `Block` as `PlainBlock | ChangedBlock`. The types themselves did not change.
- 2026-11-23 phase 6: `npm run check` passed (typecheck clean, 44 tests, `vite build` wrote `client/dist`). Kfir is
  away and said to go on without his look, so the look is not approved yet: his look at the home screen is still
  owed. Claude Code checked the screen itself in a headless Chromium at 1440, 1024, 768, 390 and 320 wide: five
  recently updated documents, the first 7.3.3 "ערבויות וביטחונות" (edition 18, 05.10.2026); chapters 1, 3 and 7;
  a click on chapter 7 lists 7.3.1 and 7.3.3, with one message and one form under 7.3.3; no sideways scrolling at
  any of the five widths. The look, made with the taste skill: its dealer gave the palette "cool grey, cobalt"
  (ground #eef0f3, ink #0b0c0e, one accent #1f2de6; the first palette it dealt, a near-black page, was passed
  over because the white pages of a PDF glare on it), sharp corners (4, 6, 8) and a calm grotesque with a mono.
  The dealt faces are Latin only, so the grotesque is IBM Plex Sans Hebrew (`@fontsource/ibm-plex-sans-hebrew`
  5.3.0, weights 400 and 500: the one dependency the plan left open). The mono was dropped: DM Mono and IBM Plex
  Mono both draw a slashed or dotted zero, which misreads in a section number such as 2.10, so a Takam number is
  set in tabular figures at weight 500. Differs from the plan: the skill's finish gate was not armed, because it
  holds a page to the structure of a marketing site (a hero alone on the first screen, a button in every
  section, a picture in every card), which Design I rules out; its checker was run on the home screen as a
  diagnostic, and every check that fits an application passes (contrast, tap size, overflow down to 320, focus,
  names). The second sentence of the lead appears once the list is loaded, because its two numbers are counted
  from the data. The top bar carries a small mark, three lines as an inline SVG, next to the name.
- 2026-11-23 phase 7: `npm run check` passed (typecheck clean, 44 tests, build). Kfir's look is still owed;
  Claude Code checked the page in a headless Chromium, by clicks and by reading the page back.
  `/document/H.1.4.3` draws the PDF of edition 6 inside the page, with sections 1.1, 1.2 and on. A click on
  "מהדורה 5" leads to `?edition=5`, shows the note "זו מהדורה 5 מיום 09.05.2021, לא המהדורה שבתוקף." and the PDF
  of edition 5, while the meta line still names edition 6; the back button returns to edition 6 in one step.
  The link "הורדת Word" carries `download`, and its address answers
  `Content-Disposition: attachment; filename=H.1.4.3_v6.docx`. `/document/H.7.3.3` lists one message and one
  form, and the message points back at its instruction. `/document/H.9.9.9` shows "המסמך לא נמצא במדגם." and the
  link home. No sideways scrolling at 1440, 1280, 1024, 768, 390 and 320. Differs from the plan: `format.ts`
  also holds the name of the app, which the top bar and the page title share. `App.tsx` scrolls to the top
  when the page changes, because the router keeps the scroll position and a document opened from the foot of a
  list would start half way down; going back is left to the browser. The side panel stands beside the view from
  1200 wide and under it below that, so the PDF keeps a readable width. On a phone the frame is 56% of the
  window high, so the link that opens the PDF alone is on the first screen. Seen and left as it is:
  `#view=FitH` fits the widest page of a file, and edition 18 of 7.3.3 holds five landscape pages, so it opens
  at a smaller zoom than 1.4.3.
- 2026-11-23 phase 8: `npm run check` passed (typecheck clean, 44 tests, build). Kfir's look is still owed;
  Claude Code checked the view in a headless Chromium, by clicks and by reading the page back.
  `/document/H.1.4.3?tab=changes` shows the counts of phase 4 (26 changed, 10 added, 8 removed, 107 the same)
  and lists 44 paragraphs, the first of them section 1.3 marked "הוסר"; the checkbox lists all 151; choosing
  edition 4 leads to `?tab=changes&from=4`, and the back button returns to edition 5.
  `/document/HOD.3.1.1.1?tab=changes` shows `5%` struck out and `4.75%` underlined in section 1.1.
  `/document/H.3.1.1?tab=changes` says the document has one edition in the sample. No sideways scrolling at
  1440, 1024, 768, 390 and 320, also with the whole document listed, and on the longest document (7.3.1, 505
  paragraphs). The skill's checker ran on the two views of a document as a diagnostic: the checks that fit an
  application pass, after the sentence under the checkbox moved from grey to ink. Nothing differs from the
  plan. Seen and left as it is, for Kfir to decide: the text of directive 1.4.3 holds the name of one regulation
  with its parentheses the wrong way round, ")דיווח על יישום החוק(", three times in edition 5 and once in
  edition 6. That is how LibreOffice wrote the text file (the PDF shows it right), and it shows in two of the 44
  listed paragraphs, the first one among them. Turning such a pair in `normalize` changes no count of any
  comparison in the sample, but it is a change to Design D, so it was not made. Also seen: the PDF frame takes
  the keyboard focus without a ring of its own, because a frame never matches `:focus`; the viewer inside it
  draws its own.
- 2026-11-23 gate, the first two items: after a clean `npm ci` (176 packages) `npm run check` passed (typecheck
  clean; 44 tests: 11 text, 13 compare, 20 API; build), and `git status` was clean. Told Kfir: 44 tests; the
  counts of phase 4 (`H.1.4.3` edition 5 against 6: 107 the same, 26 changed, 10 added, 8 removed;
  `HOD.3.1.1.1` edition 53 against 54: 6, 3, 0, 0); the sample arrived from the site, by the script. Checked
  ahead of Kfir's walk-through, in a headless Chromium on `npm run build && npm start` (port 3000): home,
  chapter 7, reading 1.4.3 after a reload, edition 5, the Word download, the changes of 1.4.3, the whole
  document, the rates message and an unknown address all answer as the plan says. Still Kfir's: his look at
  the three screens (the look is not approved yet), his README, and the walk-through in his own browser. The
  two ticks and this line wait, uncommitted, for the `docs: README` commit.
- 2026-11-24 phase 9, the second design round, on Kfir's word after his review of the screens: `npm run check`
  passed (typecheck clean, 44 tests, build). Kfir's look at the new screens is owed. Claude Code checked them in
  a headless Chromium at 1440 and at 390 wide (and at 1024, 768 and 320), by clicks and by reading the page
  back, on the dev server and once more on the built app. `/`: the first chapter card stands at 145 to 388 of a
  900 high window; under the title stands the catalogue alone; the top bar holds one link, the name; the aside
  lists 7.3.3 first. `/document/H.1.4.1`: the tree marks 1.4.1, with 1.4.3 and 1.4.5 in the same list; the third
  link of the breadcrumb lands on `/#s-1.4` with the strip of 1.4 in view under the bar, and so does a direct
  load of `/#s-7.3`. `/document/H.1.4.3`: the pill of edition 6 carries "בתוקף"; the pill of edition 5 leads to
  `?edition=5`, where the banner shows and the button reads "הורדת Word, מהדורה 5"; the back button returns to
  edition 6. `/document/H.1.4.3?tab=changes`: the chips read 26, 10, 8 and 107, and the first block is 1.3,
  "הוסר"; the pill of edition 4 moves the address to `from=4`; with a real scrollbar on the screen, ticking the
  checkbox leaves `document.documentElement.clientWidth` at 1425 of 1440. `/document/HOD.7.3.3.1`: the tree marks
  the message, between 7.3.3 and its form. No sideways scrolling at 390 or at 320, also with the 505 paragraphs
  of 7.3.1 listed. Every link and control that the Tab key reaches shows the 2px ring; the PDF frame, as in phase 8,
  has none of its own. The checker of the taste skill, run from outside the project on the three screens at 1440
  and 390, passes contrast, text contrast, tap size, overflow (spill,
  off-viewport, collide, cut text) and the three focus checks. It holds running text to 7 to 1 and a caption to
  4.5 to 1: the muted sentence under the chips and the muted edition lines (5.6 to 6 to 1) pass as what their
  classes name them, a caption and meta lines. It does not tick the checkbox, so it never saw the paragraphs that
  did not change, which are muted at 5.6 to 1 on Kfir's word. Its other findings are the rules of a marketing
  page (one button style, a picture in every card, a button on the first screen), a count of row starts from the
  left that does not fit a right-to-left list, and four warnings: body text is 15px and not 16, the white of the
  current view stands 1.09 to 1 off its track, a transparent box lies over the text of a row (the link that
  covers the row), and there is no skip link. Decided by Claude Code where Kfir's text was silent, each written
  into Design H or I: the page of a document finds its document in the list that `App` loaded, so `api.document`
  left the client and no screen calls `GET /api/documents/:id` any more (the route and its tests stay); what
  stands on the page and not on a card hovers in `#eceef2`, because `#f1f3f6` does not show on `#f6f7f9`; on an
  added or a removed card the kind badge takes the mark of its kind, because its own bg is the ground of the card;
  the white of the current view has a corner of 7px; the name in the top bar and the title of the aside are
  15px/600; the link back from an unknown document looks like the Word button; three names for a screen reader
  were added (`עץ המסמכים`, `מיקום המסמך`, `מהדורות`); `format.ts` got `editionLine`; the list of files in Design A
  follows the code. Seen and left as it is: on a page too short to scroll, the room that `scrollbar-gutter` keeps
  shows as a strip of the page colour beside the white top bar, and Chromium then reports a `clientWidth` of
  1440 although nothing moves (the bar ends at 1425 on a short page and on a long one). Hover colours sit inside
  `@media (hover: hover)`; headless Chromium reports no pointer, so they were checked with those rules copied
  out of the media query in the test page only. On Kfir's word, `PLAN.md` went into this commit with the two
  Gate ticks and the Gate line that were waiting for the `docs: README` commit.
- 2026-11-24 on Kfir's word: the reversed parentheses of 1.4.3 (the Log of phase 8) get no change in the code. It
  is a known limit, written in the README.
- 2026-11-24 fix to phases 2 and 3, from Kfir's code review: the invisible characters are written as `\u` escapes
  (`\u200B`, `\u200E`, `\u200F`, `\u202A-\u202E`, `\u2066-\u2069`, `\uFEFF`) where three files held the
  characters themselves: the regex of `server/text.ts`, the regex of the name in `scripts/fetch-sample.ts`, and
  the strings of `tests/text.test.ts` (28 characters in all). In an editor the regex read as an empty class, and
  GitHub flags such a file for bidirectional Unicode text. Nothing else changed: typecheck is clean, the 44 tests
  pass, and no file under `server/`, `scripts/`, `tests/`, `shared/` or `client/src` holds one of these
  characters.
- 2026-11-24 fix to phase 2, from Kfir's code review: when every edition of a document is skipped, the script
  stops with `<id> has no edition in docx format`, where it wrote the document into the manifest with an empty
  list of editions, and the client reads `editions[0]` (Design J, `scripts/fetch-sample.ts`). Checked without a
  request to the Takam site, against a stand-in site on this machine and a data folder outside the project:
  when it serves an old Word file the script prints the warning, then
  `The sample was not downloaded: H.1.4.1 has no edition in docx format`, ends with 1 and writes no manifest;
  when it serves a docx the document passes. Typecheck is clean and the 44 tests pass. The sample itself did not
  change: all 21 editions of its 10 documents are docx files.
- 2026-11-24 on Kfir's word, from his code review: the fallback of Design J, "When the site refuses", no longer
  says that the Word files wait in his Downloads folder. That never happened: the script got the sample from the
  site (the Log of phase 2). The fallback is now: do not retry, do not disguise the request, stop and tell Kfir.
  Two more lines spoke of the same browser download and follow it: the Verify of phase 2 and the first line of
  Risks.
- 2026-11-24 fix to phase 9, on Kfir's word after the report: `html` has `overflow-y: scroll` in place of
  `scrollbar-gutter: stable` (Design I). The room that the gutter kept showed, on a page too short to scroll, as
  a strip of the page colour beside the white top bar; now the browser draws the track of the scrollbar on every
  page. Checked in a headless Chromium with a real scrollbar, 1440 wide: `/document/H.3.1.1?tab=changes`, which
  does not scroll, and `/document/H.1.4.3?tab=changes`, which does, both report a `clientWidth` of 1425, and on
  both the top bar ends at 1425 with the track beside it for the whole height of the window; ticking the checkbox
  leaves 1425. The top bar and the tree still stick, an address with a hash still lands on its strip, and there
  is no sideways scrolling at 390, with a 15px scrollbar or as a phone. `npm run check` passed (44 tests).
- 2026-11-24 on Kfir's word after the report: the rule of `CLAUDE.md` about the look no longer says that the look
  is made with the taste skill, that the skill is loaded before client code is written, or that Design I is its
  brief. Since phase 9 the look is the one that Design I describes, and the skill serves only as a checker; the
  rule now says that.
- 2026-11-24 on Kfir's word: `GET /api/documents/:id` and its tests stay. The route is part of the API even
  though no screen calls it now. The Log of phase 9 had this as a decision of Claude Code.
- 2026-11-24 on Kfir's word: decision 6 got one sentence and was not rewritten. It still said only that the look
  is designed with the taste skill; the sentence adds that after Kfir's review of the first look the look was set
  in phase 9 and is the one Design I describes, and that the taste skill only checks it.
