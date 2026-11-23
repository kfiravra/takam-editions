# takam-editions

A POC for a home assignment of the Ministry of Finance (interview 2026-11-24). A user reads a Takam directive
without downloading a file, and sees what changed between two editions of it. Goal, decisions, phases and the
design of every part: [PLAN.md](PLAN.md). Work phase by phase from it.

## Map

`client/` React + Vite :5173 → `server/` Express :3000 → files in `data/sample/` (`manifest.json`, and a docx, a
pdf and a txt for every edition). `shared/types.ts` is the only contract between the two sides: change it first.
`scripts/` creates the sample (download from the site, conversion with LibreOffice) and is never imported by
the server. `tests/` holds the Vitest suites.

## Verify

- `npm run check` runs `tsc --noEmit`, `vitest run` and `vite build`. Run it before every commit from phase 6
  on. Before the client exists (phases 3 to 5) run `npm run typecheck && npm test`.
- A change on a screen: `npm run dev`, then look at http://localhost:5173 at a wide window and at 390 wide.
- `GET /api/health` answers 200 only when the manifest is loaded and every file it names exists.
- Before starting a server, make sure nothing still listens on 3000 or 5173.

## Rules

- Keep it small. No dependency, file or feature beyond PLAN.md without Kfir's word. If the plan and the code
  disagree, stop and ask; do not improvise.
- One job per file. `text.ts` and `compare.ts` are pure logic: no Express, no state.
- Server logic is written test-first. Do not bend a test to make it pass.
- The look of the screens is made with the taste skill (`design-taste-frontend`) and approved by Kfir on the
  screen. Load the skill before writing client code. PLAN.md, Design I, is its brief.
- Comments say why, not what. No `any`. No `console.log` outside `server/index.ts` and `scripts/`; the error
  handler of `server/app.ts` uses `console.error`.
- English only in code, comments, logs, test names and commit messages. Hebrew only in text a user sees
  (`client/`), in `data/`, in `README.md`, and as quoted directive text inside tests.
- Configuration comes from environment variables with defaults (`.env.example`). No secret in the repository.

## Gotchas (what the code does not tell you)

- The server never opens a Word file. Word is converted once, by `scripts/convert.ts`, into the pdf and the txt.
- The comparison ignores section numbers on purpose: a deleted section renumbers every section after it.
- File names come from the manifest only. Nothing from a request is ever joined into a path.
- `dir="rtl"` and logical CSS only (`margin-inline-start`, `border-inline-start`, `text-align: start`); a
  physical `left` or `right` is an RTL bug.
- Express 5 rejects the route path `'*'` and hands a listen error to the callback of `app.listen`
  (PLAN.md, Design K).

## Git

- One commit per finished phase, on a green Verify, with the message the plan gives. A fix to an earlier phase
  gets a commit of its own, `fix(<scope>): ...`.
- No push and no rewriting of history without Kfir's word.
- `README.md` is Kfir's text. Do not write it, and do not reword it.
