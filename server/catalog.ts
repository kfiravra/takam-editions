// The catalogue of the sample: manifest.json, read once, and the files it names.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { DocumentEntry, Edition, FileFormat, Manifest } from '../shared/types';

export interface Catalog {
  documents: DocumentEntry[];
  find(id: string): DocumentEntry | undefined;
  childrenOf(id: string): DocumentEntry[];
  filePath(edition: Edition, format: FileFormat): string;
  missingFiles(): string[];
}

const FORMATS: FileFormat[] = ['docx', 'pdf', 'txt'];

export function loadCatalog(dataDir: string): Catalog {
  // res.sendFile and res.download need a full path, and DATA_DIR is usually a relative one.
  const dir = path.resolve(dataDir);
  const manifestPath = path.join(dir, 'manifest.json');
  if (!existsSync(manifestPath)) {
    throw new Error(`manifest.json was not found in ${dir}. Check DATA_DIR in .env.`);
  }
  const manifest: Manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const { documents } = manifest;

  // A file name comes from the manifest only. Nothing from a request is ever joined into a path.
  const filePath = (edition: Edition, format: FileFormat) => path.join(dir, `${edition.file}.${format}`);

  return {
    documents,
    find: (id) => documents.find((document) => document.id === id),
    childrenOf: (id) => documents.filter((document) => document.parentId === id),
    filePath,
    // Checked on the disk at every call, so the health route tells the truth about now.
    missingFiles: () =>
      documents.flatMap((document) =>
        document.editions.flatMap((edition) =>
          FORMATS.filter((format) => !existsSync(filePath(edition, format))).map((format) => `${edition.file}.${format}`),
        ),
      ),
  };
}
