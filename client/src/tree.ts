// The tree of the Takam, as far as the sample goes: chapters, their sub-chapters, and the documents of each.
// Pure functions: the home screen and the side tree of a document both read the same tree.
import type { DocumentEntry } from '../../shared/types';
import { byNumber } from './format';

const RECENT_COUNT = 5;

export interface ListedDocument {
  document: DocumentEntry;
  child: boolean; // a message or a form, listed under its instruction
}

export interface SubChapter {
  number: string; // "1.4"
  name: string;
  documents: ListedDocument[];
}

export interface Chapter {
  number: string; // "1"
  name: string;
  count: number; // the documents of all its sub-chapters
  subChapters: SubChapter[];
}

// The number of a document says where it sits: 7.3.3 belongs to chapter 7 ...
export function chapterNumber(document: DocumentEntry): string {
  return document.number.split('.')[0];
}

// ... and to sub-chapter 7.3.
export function subChapterNumber(document: DocumentEntry): string {
  return document.number.split('.').slice(0, 2).join('.');
}

// The newest edition is the first one of a document, and a date written as YYYY-MM-DD sorts as text.
export function recentlyUpdated(documents: DocumentEntry[]): DocumentEntry[] {
  return [...documents]
    .sort((a, b) => b.editions[0].validFrom.localeCompare(a.editions[0].validFrom))
    .slice(0, RECENT_COUNT);
}

// Instructions by number, each followed by its messages and forms.
// The sort is stable, so a message and a form that share a number keep the order of the manifest.
function inReadingOrder(documents: DocumentEntry[]): ListedDocument[] {
  const sorted = [...documents].sort((a, b) => byNumber(a.number, b.number));
  const ids = new Set(documents.map((document) => document.id));
  // A document whose instruction is not in the list stands on its own.
  const standsAlone = (document: DocumentEntry) => document.parentId === null || !ids.has(document.parentId);
  return sorted.filter(standsAlone).flatMap((parent) => [
    { document: parent, child: false },
    ...sorted.filter((document) => document.parentId === parent.id).map((document) => ({ document, child: true })),
  ]);
}

// Puts every document under the number that `numberOf` gives it, and returns the groups by that number.
function groupByNumber(
  documents: DocumentEntry[],
  numberOf: (document: DocumentEntry) => string,
): [string, DocumentEntry[]][] {
  const groups = new Map<string, DocumentEntry[]>();
  for (const document of documents) {
    const number = numberOf(document);
    groups.set(number, [...(groups.get(number) ?? []), document]);
  }
  return [...groups].sort(([a], [b]) => byNumber(a, b));
}

// The names come from the documents themselves: every document carries the name of its chapter and of its
// sub-chapter.
export function chaptersOf(documents: DocumentEntry[]): Chapter[] {
  return groupByNumber(documents, chapterNumber).map(([number, ofChapter]) => ({
    number,
    name: ofChapter[0].chapter,
    count: ofChapter.length,
    subChapters: groupByNumber(ofChapter, subChapterNumber).map(([subNumber, ofSubChapter]) => ({
      number: subNumber,
      name: ofSubChapter[0].subChapter,
      documents: inReadingOrder(ofSubChapter),
    })),
  }));
}
