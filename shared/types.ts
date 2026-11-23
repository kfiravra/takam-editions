// The only contract between the server and the client: both import it, and a change starts here.
// The manifest types also describe data/sample/manifest.json, which scripts/fetch-sample.ts writes.

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