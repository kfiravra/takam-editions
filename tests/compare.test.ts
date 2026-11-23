// server/compare.ts: two editions are compared paragraph by paragraph (PLAN.md, Design E and G2).
import { describe, expect, it } from 'vitest';
import { compareParagraphs, similarity, summarize } from '../server/compare';
import { readParagraphs } from '../server/text';
import type { Block, Paragraph } from '../shared/types';

const p = (label: string, text: string): Paragraph => ({ label, text });
const kinds = (blocks: Block[]) => blocks.map((block) => block.kind);

// Wording from directive 1.4.3 and from the rates message 3.1.1.1.
const INTRO = 'מבוא';
const SCOPE = 'הוראה זו תחול על כל תשלום לספקי הממשלה';
const GOALS = 'מטרות ההוראה';
const DEFINITIONS = 'ראה הגדרות הוראה זו בנספח א - הגדרות.';
const REGULATIONS = 'בחודש פברואר 2021 פורסמו תקנות מוסר תשלומים לספקים';
const RATE_5 = 'שיעור הריבית יעמוד על 5% לשנה';
const RATE_475 = 'שיעור הריבית יעמוד על 4.75% לשנה';

describe('compareParagraphs', () => {
  it('finds no change between an edition and itself', () => {
    const edition = [p('1', INTRO), p('1.1', SCOPE), p('', DEFINITIONS)];
    const blocks = compareParagraphs(edition, edition);
    expect(blocks).toEqual([
      { kind: 'same', label: '1', text: INTRO },
      { kind: 'same', label: '1.1', text: SCOPE },
      { kind: 'same', label: '', text: DEFINITIONS },
    ]);
    expect(summarize(blocks)).toEqual({ same: 3, changed: 0, added: 0, removed: 0 });
  });

  it('marks a new paragraph as added and keeps the order of the document', () => {
    const older = [p('1', INTRO), p('1.1', SCOPE), p('1.2', DEFINITIONS)];
    const newer = [p('1', INTRO), p('1.1', SCOPE), p('1.2', GOALS), p('1.3', DEFINITIONS)];
    expect(compareParagraphs(older, newer)).toEqual([
      { kind: 'same', label: '1', text: INTRO },
      { kind: 'same', label: '1.1', text: SCOPE },
      { kind: 'added', label: '1.2', text: GOALS },
      { kind: 'same', label: '1.3', text: DEFINITIONS },
    ]);
  });

  it('marks a deleted paragraph as removed', () => {
    const older = [p('1', INTRO), p('1.1', SCOPE), p('1.2', GOALS)];
    const newer = [p('1', INTRO), p('1.1', SCOPE)];
    expect(compareParagraphs(older, newer)).toEqual([
      { kind: 'same', label: '1', text: INTRO },
      { kind: 'same', label: '1.1', text: SCOPE },
      { kind: 'removed', label: '1.2', text: GOALS },
    ]);
  });

  it('marks the words that went out and came in when a paragraph was edited', () => {
    expect(compareParagraphs([p('1.1', RATE_5)], [p('1.1', RATE_475)])).toEqual([
      {
        kind: 'changed',
        label: '1.1',
        words: [
          { kind: 'same', text: 'שיעור הריבית יעמוד על' },
          { kind: 'removed', text: '5%' },
          { kind: 'added', text: '4.75%' },
          { kind: 'same', text: 'לשנה' },
        ],
      },
    ]);
  });

  it('reports a paragraph that was rewritten from scratch as removed and then added, not as changed', () => {
    const rewritten = 'מועד התשלום הממשלתי יהיה לא יאוחר מ-45 ימים';
    expect(compareParagraphs([p('2.1', DEFINITIONS)], [p('2.1', rewritten)])).toEqual([
      { kind: 'removed', label: '2.1', text: DEFINITIONS },
      { kind: 'added', label: '2.1', text: rewritten },
    ]);
  });

  it('does not report a paragraph whose section number alone moved, and shows its new number', () => {
    expect(compareParagraphs([p('1.6', GOALS)], [p('1.5', GOALS)])).toEqual([{ kind: 'same', label: '1.5', text: GOALS }]);
  });

  it('shows a removed paragraph under the section number it had in the old edition', () => {
    const older = [p('1.2', INTRO), p('1.3', REGULATIONS), p('1.4', SCOPE)];
    const newer = [p('1.2', INTRO), p('1.3', SCOPE)];
    expect(compareParagraphs(older, newer)).toEqual([
      { kind: 'same', label: '1.2', text: INTRO },
      { kind: 'removed', label: '1.3', text: REGULATIONS },
      { kind: 'same', label: '1.3', text: SCOPE },
    ]);
  });

  it('handles two empty editions, and an empty edition on either side', () => {
    const edition = [p('1', INTRO), p('1.1', SCOPE)];
    expect(compareParagraphs([], [])).toEqual([]);
    expect(compareParagraphs([], edition)).toEqual([
      { kind: 'added', label: '1', text: INTRO },
      { kind: 'added', label: '1.1', text: SCOPE },
    ]);
    expect(compareParagraphs(edition, [])).toEqual([
      { kind: 'removed', label: '1', text: INTRO },
      { kind: 'removed', label: '1.1', text: SCOPE },
    ]);
  });

  it('swaps the added and removed counts when the direction is reversed', () => {
    const older = [p('1', INTRO), p('1.1', RATE_5), p('1.2', DEFINITIONS)];
    const newer = [p('1', INTRO), p('1.1', RATE_475), p('1.2', GOALS), p('1.3', SCOPE)];
    expect(summarize(compareParagraphs(older, newer))).toEqual({ same: 1, changed: 1, added: 2, removed: 1 });
    expect(summarize(compareParagraphs(newer, older))).toEqual({ same: 1, changed: 1, added: 1, removed: 2 });
  });

  it('keeps a paragraph that appears twice as two paragraphs', () => {
    // The header cells of a table repeat.
    const cells = [p('', 'כמות'), p('', 'סכום'), p('', 'כמות'), p('', 'סכום')];
    expect(kinds(compareParagraphs(cells, cells))).toEqual(['same', 'same', 'same', 'same']);
    expect(kinds(compareParagraphs(cells.slice(0, 2), cells))).toEqual(['same', 'same', 'added', 'added']);
  });
});

describe('similarity', () => {
  it('is 1 for the same words, 0 when no word is shared, and the shared part in between', () => {
    expect(similarity(SCOPE, SCOPE)).toBe(1);
    expect(similarity(GOALS, DEFINITIONS)).toBe(0);
    // Five of the six words of each sentence are shared: 2 x 5 / (6 + 6).
    expect(similarity(RATE_5, RATE_475)).toBeCloseTo(10 / 12);
  });
});

describe('the sample, against what the documents say about themselves', () => {
  async function compareSample(file: string, from: number, to: number): Promise<Block[]> {
    return compareParagraphs(
      await readParagraphs(`data/sample/${file}_v${from}.txt`),
      await readParagraphs(`data/sample/${file}_v${to}.txt`),
    );
  }

  it('shows every section that the change table of edition 6 of directive 1.4.3 lists', async () => {
    const blocks = await compareSample('H.1.4.3', 5, 6);
    const changes = blocks.filter((block) => block.kind !== 'same');
    const labelsAtOrUnder = (section: string) =>
      changes.map((block) => block.label).filter((label) => label === section || label.startsWith(`${section}.`));

    // "Section 1" in the table: edition 6 dropped the paragraph that was 1.3 in edition 5.
    // Nothing before it changed, so it is the first change the reader meets.
    expect(changes[0]).toMatchObject({ kind: 'removed', label: '1.3' });
    expect(changes[0]).toHaveProperty('text', expect.stringContaining(REGULATIONS));
    expect(changes).toContainEqual(expect.objectContaining({ kind: 'added', label: '1.5.9' }));
    expect(changes.map((block) => block.label)).toContain('2.3');
    expect(changes.map((block) => block.label)).toContain('2.6');
    expect(labelsAtOrUnder('2.9.2')).not.toEqual([]);
    expect(labelsAtOrUnder('2.12')).not.toEqual([]);

    // Measured in phase 4 and pinned here, so that a later change to the algorithm is noticed.
    expect(summarize(blocks)).toEqual({ same: 107, changed: 26, added: 10, removed: 8 });
  });

  it('shows the rate of the Accountant General going from 5% to 4.75% in message 3.1.1.1', async () => {
    const blocks = await compareSample('HOD.3.1.1.1', 53, 54);
    const summary = summarize(blocks);
    expect(summary.added).toBe(0);
    expect(summary.removed).toBe(0);

    const changedWords = blocks.flatMap((block) => (block.kind === 'changed' ? [block.words] : []));
    expect(changedWords).toContainEqual(
      expect.arrayContaining([
        { kind: 'removed', text: '5%' },
        { kind: 'added', text: '4.75%' },
      ]),
    );

    // Measured in phase 4 and pinned here, so that a later change to the algorithm is noticed.
    expect(summary).toEqual({ same: 6, changed: 3, added: 0, removed: 0 });
  });
});
