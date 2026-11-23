// server/text.ts: the text file of an edition becomes numbered paragraphs (PLAN.md, Design D and G1).
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { normalize, parseParagraphs, readParagraphs } from '../server/text';

describe('normalize', () => {
  it('gives the same text with and without the invisible direction marks', () => {
    const marks = ['‎', '‏', '‪', '‫', '‬', '‭', '‮', '⁦', '⁧', '⁨', '⁩', '﻿'];
    for (const mark of marks) {
      const code = `U+${mark.charCodeAt(0).toString(16).toUpperCase()}`;
      expect(normalize(`המפורטים בסעיף ${mark}2.12${mark} להלן`), code).toBe('המפורטים בסעיף 2.12 להלן');
      // A mark between two spaces must not leave two spaces behind.
      expect(normalize(`המפורטים בסעיף ${mark} 2.12 להלן`), code).toBe('המפורטים בסעיף 2.12 להלן');
    }
  });

  it('collapses spaces, tabs and non-breaking spaces into one space, and trims the ends', () => {
    expect(normalize('  שיעור "ריבית החשב הכללי" יעמוד על  4.75%\t\tלשנה, דהיינו 1.1875% לרבעון. \t')).toBe(
      'שיעור "ריבית החשב הכללי" יעמוד על 4.75% לשנה, דהיינו 1.1875% לרבעון.',
    );
  });
});

describe('parseParagraphs', () => {
  it('keeps a section number apart from the wording', () => {
    expect(parseParagraphs('            1.5.9. תשלומים שאינם בתחולת החוק')).toEqual([
      { label: '1.5.9', text: 'תשלומים שאינם בתחולת החוק' },
    ]);
  });

  it('reads a section number of one level', () => {
    expect(parseParagraphs('    1. מבוא')).toEqual([{ label: '1', text: 'מבוא' }]);
  });

  it('does not take a number that ends a sentence for a section number', () => {
    const line = 'ראה הוראת תכ"ם מס\' 3.1.3.';
    expect(parseParagraphs(line)).toEqual([{ label: '', text: line }]);
  });

  it('does not take a table cell that holds a date, a decimal or a bare number for a section number', () => {
    expect(parseParagraphs('19.09.2024\n2.7\n6')).toEqual([
      { label: '', text: '19.09.2024' },
      { label: '', text: '2.7' },
      { label: '', text: '6' },
    ]);
  });

  it('reads a table row, whose cells are apart by tabs, as one paragraph without a section number', () => {
    // Two rows of the change table of directive 1.4.3, as LibreOffice writes them.
    const rows =
      '6\t19.09.2024\t‏1\tהסרת התייחסות לתקנות מוסר תשלומים\n' +
      '\t\t‏1.5.9\tהוספת תשלומים עליהם לא חלה הוראה זו';
    expect(parseParagraphs(rows)).toEqual([
      { label: '', text: '6 19.09.2024 1 הסרת התייחסות לתקנות מוסר תשלומים' },
      { label: '', text: '1.5.9 הוספת תשלומים עליהם לא חלה הוראה זו' },
    ]);
  });

  it('skips empty lines, \\r\\n line endings and the byte-order mark at the start of a file', () => {
    const fileText = '﻿    1. מבוא\r\n\r\n  \t \r\n        1.1. מוסר תשלומים יעיל ותקין\r\n‏\r\n';
    expect(parseParagraphs(fileText)).toEqual([
      { label: '1', text: 'מבוא' },
      { label: '1.1', text: 'מוסר תשלומים יעיל ותקין' },
    ]);
  });
});

describe('readParagraphs', () => {
  it('reads edition 6 of directive 1.4.3 from the sample', async () => {
    const file = 'data/sample/H.1.4.3_v6.txt';
    const paragraphs = await readParagraphs(file);

    expect(paragraphs[0]).toEqual({ label: '1', text: 'מבוא' });
    expect(paragraphs.map((paragraph) => paragraph.label)).toContain('1.5.9');
    expect(paragraphs.filter((paragraph) => paragraph.text === '')).toEqual([]);
    // One paragraph for every line that holds something: no line is merged and none is lost.
    const nonEmptyLines = (await readFile(file, 'utf8')).split('\n').filter((line) => line.trim() !== '');
    expect(paragraphs).toHaveLength(nonEmptyLines.length);
  });

  it('rejects when the file is missing', async () => {
    await expect(readParagraphs('data/sample/H.9.9.9_v1.txt')).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
