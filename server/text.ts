// The text file of an edition becomes paragraphs, with the section number kept apart from the wording.
// The comparison reads only the wording, so a section that was merely renumbered does not count as changed.
import { readFile } from 'node:fs/promises';
import type { Paragraph } from '../shared/types';

// Word leaves direction marks next to numbers, and the file starts with a byte-order mark.
// None of them is visible, so none of them may make two texts differ.
const INVISIBLE = /[‎‏‪-‮⁦-⁩﻿]/g;

// A section number has a dot after every number, then whitespace, then text: "1.5.9. text".
// That keeps out a table cell that holds a date ("19.09.2024") or a decimal ("2.7").
const NUMBERED = /^((?:\d+\.)+)\s+(.+)$/;

export function normalize(text: string): string {
  // The marks go first: a mark between two spaces would otherwise leave two spaces behind.
  return text.replace(INVISIBLE, '').replace(/\s+/g, ' ').trim();
}

export function parseParagraphs(fileText: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  for (const line of fileText.split(/\r?\n/)) {
    const text = normalize(line);
    if (text === '') continue;
    const numbered = NUMBERED.exec(text);
    // The label is the number without its last dot: "1.5.9." becomes "1.5.9".
    paragraphs.push(numbered ? { label: numbered[1].slice(0, -1), text: numbered[2] } : { label: '', text });
  }
  return paragraphs;
}

export async function readParagraphs(filePath: string): Promise<Paragraph[]> {
  return parseParagraphs(await readFile(filePath, 'utf8'));
}
