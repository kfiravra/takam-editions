// Compares two editions paragraph by paragraph. Pure functions: no Express, no state, no file.
// One library function does the work at three levels: diffArrays finds the paragraphs that stayed,
// pairs the paragraphs that were edited, and marks the words that changed inside a pair.
import { diffArrays } from 'diff';
import type { Block, CompareSummary, Paragraph, WordPart } from '../shared/types';

// Two paragraphs that share at least half of their words are one paragraph that was edited.
// Under that, the old one was removed and the new one was added.
export const SIMILARITY_THRESHOLD = 0.5;

// The share of words two texts have in common: 1 for the same words, 0 when no word is shared.
export function similarity(a: string, b: string): number {
  const wordsA = new Set(a.split(' '));
  const wordsB = new Set(b.split(' '));
  let shared = 0;
  for (const word of wordsA) if (wordsB.has(word)) shared++;
  return (2 * shared) / (wordsA.size + wordsB.size);
}

// The library's own diffWords marks Hebrew letter by letter, so the words are compared as array items.
function wordParts(oldText: string, newText: string): WordPart[] {
  return diffArrays(oldText.split(' '), newText.split(' ')).map(
    (part): WordPart => ({
      kind: part.added ? 'added' : part.removed ? 'removed' : 'same',
      text: part.value.join(' '),
    }),
  );
}

// A stretch where paragraphs went out and others came in at the same place.
// A pair that is similar enough is one edited paragraph; the rest was removed or added.
function rewrittenStretch(removed: Paragraph[], added: Paragraph[]): Block[] {
  const parts = diffArrays(removed, added, {
    comparator: (a, b) => similarity(a.text, b.text) >= SIMILARITY_THRESHOLD,
  });

  const blocks: Block[] = [];
  let oldIndex = 0;
  let newIndex = 0;
  for (const part of parts) {
    if (part.added) {
      for (const paragraph of part.value) blocks.push({ kind: 'added', label: paragraph.label, text: paragraph.text });
      newIndex += part.count;
    } else if (part.removed) {
      for (const paragraph of part.value) blocks.push({ kind: 'removed', label: paragraph.label, text: paragraph.text });
      oldIndex += part.count;
    } else {
      for (let i = 0; i < part.count; i++) {
        const older = removed[oldIndex + i];
        const newer = added[newIndex + i];
        blocks.push({ kind: 'changed', label: newer.label, words: wordParts(older.text, newer.text) });
      }
      oldIndex += part.count;
      newIndex += part.count;
    }
  }
  return blocks;
}

export function compareParagraphs(oldParagraphs: Paragraph[], newParagraphs: Paragraph[]): Block[] {
  // Only the text is compared, never the label: when a section is deleted, every section after it is
  // renumbered, and those must not be reported as changes.
  const parts = diffArrays(oldParagraphs, newParagraphs, { comparator: (a, b) => a.text === b.text });

  const blocks: Block[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const next = parts[i + 1];
    if (part.removed && next?.added) {
      blocks.push(...rewrittenStretch(part.value, next.value));
      i++;
      continue;
    }
    // A part that is common to both holds the paragraphs of the new edition, so a paragraph that stayed
    // shows its new section number. A removed part holds the old paragraphs, with their old numbers.
    const kind = part.added ? 'added' : part.removed ? 'removed' : 'same';
    for (const paragraph of part.value) blocks.push({ kind, label: paragraph.label, text: paragraph.text });
  }
  return blocks;
}

export function summarize(blocks: Block[]): CompareSummary {
  const summary: CompareSummary = { same: 0, changed: 0, added: 0, removed: 0 };
  for (const block of blocks) summary[block.kind]++;
  return summary;
}
