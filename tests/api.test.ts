// The routes of server/app.ts and the catalogue behind them, on the real sample (PLAN.md, Design F and G3).
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../server/app';
import { loadCatalog } from '../server/catalog';
import type { CompareResult, DocumentDetail, DocumentEntry, Manifest } from '../shared/types';

const app = createApp(loadCatalog('data/sample'));

// The cases that need a broken or a different setup build it in a temporary folder.
const temp = mkdtempSync(path.join(os.tmpdir(), 'takam-editions-'));
afterAll(() => rmSync(temp, { recursive: true, force: true }));

function writeManifest(dir: string, documents: DocumentEntry[]): void {
  mkdirSync(dir, { recursive: true });
  const manifest: Manifest = { source: 'test', fetchedAt: '2026-11-23', documents };
  writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest));
}

describe('the catalogue routes', () => {
  it('answers health with 200 and ok on the sample', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', documents: 10, editions: 21, missingFiles: [] });
  });

  it('lists the ten documents in the order of the manifest', async () => {
    const res = await request(app).get('/api/documents');
    expect(res.status).toBe(200);
    const documents: DocumentEntry[] = res.body;
    expect(documents.map((document) => document.id)).toEqual([
      'H.1.4.1',
      'H.1.4.3',
      'H.1.4.5',
      'H.3.1.1',
      'HOD.3.1.1.1',
      'H.3.1.3',
      'H.7.3.1',
      'H.7.3.3',
      'HOD.7.3.3.1',
      'T.7.3.3.1',
    ]);
  });

  it('gives a document with its editions, newest first', async () => {
    const res = await request(app).get('/api/documents/H.1.4.3');
    expect(res.status).toBe(200);
    const document: DocumentDetail = res.body;
    expect(document).toMatchObject({ id: 'H.1.4.3', number: '1.4.3', type: 'instruction', parentId: null });
    expect(document.editions).toEqual([
      { number: 6, validFrom: '2024-09-19', file: 'H.1.4.3_v6' },
      { number: 5, validFrom: '2021-05-09', file: 'H.1.4.3_v5' },
      { number: 4, validFrom: '2020-09-22', file: 'H.1.4.3_v4' },
    ]);
  });

  it('gives an instruction with its messages and forms, and a message with its instruction', async () => {
    const instruction: DocumentDetail = (await request(app).get('/api/documents/H.7.3.3')).body;
    expect(instruction.parent).toBeNull();
    expect(instruction.children.map((child) => child.id)).toEqual(['HOD.7.3.3.1', 'T.7.3.3.1']);

    const message: DocumentDetail = (await request(app).get('/api/documents/HOD.3.1.1.1')).body;
    expect(message.parent).toMatchObject({ id: 'H.3.1.1', number: '3.1.1' });
    expect(message.children).toEqual([]);
  });

  it('answers 404 document_not_found for a document outside the sample', async () => {
    const res = await request(app).get('/api/documents/H.9.9.9');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'document_not_found' });
  });

  it('answers 404 not_found for an unknown address under /api', async () => {
    const res = await request(app).get('/api/x');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'not_found' });
  });
});

describe('the file route', () => {
  it('shows the PDF in place: application/pdf, no Content-Disposition, bytes that start with %PDF', async () => {
    const res = await request(app).get('/api/documents/H.1.4.3/editions/6/pdf').responseType('blob');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toBeUndefined();
    const bytes: Buffer = res.body;
    expect(bytes.subarray(0, 4).toString('latin1')).toBe('%PDF');
  });

  it('sends the Word file as a download named H.1.4.3_v6.docx', async () => {
    const res = await request(app).get('/api/documents/H.1.4.3/editions/6/docx').responseType('blob');
    expect(res.status).toBe(200);
    // The quotes around the name are optional in the header.
    expect(res.headers['content-disposition']).toMatch(/^attachment; filename="?H\.1\.4\.3_v6\.docx"?$/);
    const bytes: Buffer = res.body;
    expect(bytes.subarray(0, 2).toString('latin1')).toBe('PK');
  });

  it('answers 404 for the text format and for an edition outside the sample', async () => {
    const text = await request(app).get('/api/documents/H.1.4.3/editions/6/txt');
    expect(text.status).toBe(404);
    expect(text.body).toEqual({ error: 'not_found' });

    const edition = await request(app).get('/api/documents/H.1.4.3/editions/1/pdf');
    expect(edition.status).toBe(404);
    expect(edition.body).toEqual({ error: 'edition_not_found' });
  });

  it('checks the document first, then the edition, then the format', async () => {
    const noDocument = await request(app).get('/api/documents/H.9.9.9/editions/1/txt');
    expect(noDocument.body).toEqual({ error: 'document_not_found' });

    const noEdition = await request(app).get('/api/documents/H.1.4.3/editions/abc/txt');
    expect(noEdition.body).toEqual({ error: 'edition_not_found' });
  });
});

describe('the compare route', () => {
  it('gives the counts of phase 4 for editions 5 and 6 of directive 1.4.3', async () => {
    const res = await request(app).get('/api/documents/H.1.4.3/compare?from=5&to=6');
    expect(res.status).toBe(200);
    const result: CompareResult = res.body;
    expect(result.documentId).toBe('H.1.4.3');
    expect(result.from).toEqual({ number: 5, validFrom: '2021-05-09', file: 'H.1.4.3_v5' });
    expect(result.to).toEqual({ number: 6, validFrom: '2024-09-19', file: 'H.1.4.3_v6' });
    expect(result.summary).toEqual({ same: 107, changed: 26, added: 10, removed: 8 });
    expect(result.blocks).toHaveLength(107 + 26 + 10 + 8);
    expect(result.blocks.find((block) => block.kind !== 'same')).toMatchObject({ kind: 'removed', label: '1.3' });
  });

  it('answers 400 bad_request for the four bad queries', async () => {
    const queries = ['', '?from=5', '?from=5&to=5', '?from=abc&to=6'];
    for (const query of queries) {
      const res = await request(app).get(`/api/documents/H.1.4.3/compare${query}`);
      expect(res.status, query).toBe(400);
      expect(res.body, query).toEqual({ error: 'bad_request' });
    }
  });

  it('answers 404 edition_not_found for an edition outside the sample', async () => {
    const res = await request(app).get('/api/documents/H.1.4.3/compare?from=3&to=6');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'edition_not_found' });
  });

  it('checks the document before the query', async () => {
    const res = await request(app).get('/api/documents/H.9.9.9/compare');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'document_not_found' });
  });
});

describe('a broken setup', () => {
  it('loadCatalog throws when the folder holds no manifest', () => {
    const dir = path.join(temp, 'no-manifest');
    mkdirSync(dir);
    expect(() => loadCatalog(dir)).toThrow(`manifest.json was not found in ${dir}. Check DATA_DIR in .env.`);
  });

  it('answers health 503 with the missing files, and the comparison 500 file_unreadable, without crashing', async () => {
    const dir = path.join(temp, 'missing-files');
    writeManifest(dir, [
      {
        id: 'H.1.1.1',
        number: '1.1.1',
        name: 'a document whose files are missing',
        type: 'instruction',
        chapter: 'chapter',
        subChapter: 'sub-chapter',
        parentId: null,
        editions: [
          { number: 2, validFrom: '2026-01-02', file: 'H.1.1.1_v2' },
          { number: 1, validFrom: '2025-01-01', file: 'H.1.1.1_v1' },
        ],
      },
    ]);
    const broken = createApp(loadCatalog(dir));

    const health = await request(broken).get('/api/health');
    expect(health.status).toBe(503);
    expect(health.body).toEqual({
      status: 'degraded',
      documents: 1,
      editions: 2,
      missingFiles: ['H.1.1.1_v2.docx', 'H.1.1.1_v2.pdf', 'H.1.1.1_v2.txt', 'H.1.1.1_v1.docx', 'H.1.1.1_v1.pdf', 'H.1.1.1_v1.txt'],
    });

    const compare = await request(broken).get('/api/documents/H.1.1.1/compare?from=1&to=2');
    expect(compare.status).toBe(500);
    expect(compare.body).toEqual({ error: 'file_unreadable' });

    const file = await request(broken).get('/api/documents/H.1.1.1/editions/2/pdf');
    expect(file.status).toBe(404);
    expect(file.body).toEqual({ error: 'file_not_found' });

    // The app is still alive after the failures.
    expect((await request(broken).get('/api/documents')).status).toBe(200);
  });
});

describe('the client folder', () => {
  it('answers an address of the client with index.html, and keeps the API apart', async () => {
    const clientDir = path.join(temp, 'client');
    mkdirSync(path.join(clientDir, 'assets'), { recursive: true });
    writeFileSync(path.join(clientDir, 'index.html'), '<!doctype html><title>the client</title>');
    writeFileSync(path.join(clientDir, 'assets', 'app.js'), 'export {};');
    const withClient = createApp(loadCatalog('data/sample'), clientDir);

    for (const address of ['/document/H.1.4.3', '/']) {
      const page = await request(withClient).get(address);
      expect(page.status, address).toBe(200);
      expect(page.headers['content-type'], address).toMatch(/^text\/html/);
      expect(page.text, address).toBe('<!doctype html><title>the client</title>');
    }

    const asset = await request(withClient).get('/assets/app.js');
    expect(asset.status).toBe(200);
    expect(asset.text).toBe('export {};');

    // An unknown API address is still an API error, not the page of the client.
    const unknown = await request(withClient).get('/api/x');
    expect(unknown.status).toBe(404);
    expect(unknown.body).toEqual({ error: 'not_found' });
    expect((await request(withClient).get('/api/health')).status).toBe(200);
  });

  it('serves the API alone while the client folder is not built yet', async () => {
    const withoutClient = createApp(loadCatalog('data/sample'), path.join(temp, 'not-built'));
    expect((await request(withoutClient).get('/api/health')).status).toBe(200);
    expect((await request(withoutClient).get('/document/H.1.4.3')).status).toBe(404);
  });

  it('serves the files when the project sits under a folder whose name starts with a dot', async () => {
    // Express refuses such a path by default, and the folder of a clone is not ours to choose.
    const dataDir = path.join(temp, '.hidden', 'sample');
    writeManifest(dataDir, [
      {
        id: 'T.7.3.3.1',
        number: '7.3.3.1',
        name: 'a form under a dot folder',
        type: 'form',
        chapter: 'chapter',
        subChapter: 'sub-chapter',
        parentId: null,
        editions: [{ number: 5, validFrom: '2022-08-30', file: 'T.7.3.3.1_v5' }],
      },
    ]);
    for (const format of ['docx', 'pdf', 'txt']) {
      copyFileSync(`data/sample/T.7.3.3.1_v5.${format}`, path.join(dataDir, `T.7.3.3.1_v5.${format}`));
    }
    const clientDir = path.join(temp, '.hidden', 'client');
    mkdirSync(clientDir);
    writeFileSync(path.join(clientDir, 'index.html'), '<!doctype html><title>the client</title>');
    const hidden = createApp(loadCatalog(dataDir), clientDir);

    expect((await request(hidden).get('/api/health')).status).toBe(200);
    expect((await request(hidden).get('/api/documents/T.7.3.3.1/editions/5/pdf')).status).toBe(200);
    expect((await request(hidden).get('/api/documents/T.7.3.3.1/editions/5/docx')).status).toBe(200);
    expect((await request(hidden).get('/document/T.7.3.3.1')).status).toBe(200);
  });
});
