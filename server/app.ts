// The routes. createApp does not listen, so a test can build the app on any data folder.
import { existsSync } from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { ErrorRequestHandler, Express, Response } from 'express';
import type { Catalog } from './catalog';
import { compareParagraphs, summarize } from './compare';
import { readParagraphs } from './text';
import type { ApiError, CompareResult, DocumentDetail, HealthResult, Paragraph } from '../shared/types';

// Express refuses a path that holds a folder whose name starts with a dot, and the folder of a clone is not
// ours to choose. These paths come from the manifest and from the settings, never from a request.
const ANY_FOLDER = { dotfiles: 'allow' } as const;

const DIGITS = /^\d+$/;

// An error crosses the API as a code. The client owns the sentences.
function fail(res: Response, status: number, error: string): void {
  const body: ApiError = { error };
  res.status(status).json(body);
}

export function createApp(catalog: Catalog, clientDir?: string): Express {
  const app = express();

  app.get('/api/health', (_req, res) => {
    const missingFiles = catalog.missingFiles();
    const health: HealthResult = {
      status: missingFiles.length === 0 ? 'ok' : 'degraded',
      documents: catalog.documents.length,
      editions: catalog.documents.reduce((count, document) => count + document.editions.length, 0),
      missingFiles,
    };
    res.status(health.status === 'ok' ? 200 : 503).json(health);
  });

  app.get('/api/documents', (_req, res) => {
    res.json(catalog.documents);
  });

  app.get('/api/documents/:id', (req, res) => {
    const document = catalog.find(req.params.id);
    if (!document) return fail(res, 404, 'document_not_found');

    const detail: DocumentDetail = {
      ...document,
      parent: (document.parentId && catalog.find(document.parentId)) || null,
      children: catalog.childrenOf(document.id),
    };
    res.json(detail);
  });

  app.get('/api/documents/:id/editions/:number/:format', (req, res) => {
    const document = catalog.find(req.params.id);
    if (!document) return fail(res, 404, 'document_not_found');

    const edition = document.editions.find((candidate) => String(candidate.number) === req.params.number);
    if (!edition) return fail(res, 404, 'edition_not_found');

    // The text file feeds the comparison; it is not offered for reading.
    const { format } = req.params;
    if (format !== 'pdf' && format !== 'docx') return fail(res, 404, 'not_found');

    const file = catalog.filePath(edition, format);
    if (!existsSync(file)) return fail(res, 404, 'file_not_found');

    // The PDF is shown inside the page; the Word file is a download under its own name.
    if (format === 'pdf') res.sendFile(file, ANY_FOLDER);
    else res.download(file, `${edition.file}.docx`, ANY_FOLDER);
  });

  app.get('/api/documents/:id/compare', async (req, res) => {
    const document = catalog.find(req.params.id);
    if (!document) return fail(res, 404, 'document_not_found');

    const { from, to } = req.query;
    if (typeof from !== 'string' || typeof to !== 'string' || !DIGITS.test(from) || !DIGITS.test(to) || Number(from) === Number(to)) {
      return fail(res, 400, 'bad_request');
    }

    const older = document.editions.find((edition) => edition.number === Number(from));
    const newer = document.editions.find((edition) => edition.number === Number(to));
    if (!older || !newer) return fail(res, 404, 'edition_not_found');

    // Only the reading is guarded: a fault in the comparison itself must reach the error handler.
    let oldParagraphs: Paragraph[];
    let newParagraphs: Paragraph[];
    try {
      [oldParagraphs, newParagraphs] = await Promise.all([
        readParagraphs(catalog.filePath(older, 'txt')),
        readParagraphs(catalog.filePath(newer, 'txt')),
      ]);
    } catch {
      return fail(res, 500, 'file_unreadable');
    }

    const blocks = compareParagraphs(oldParagraphs, newParagraphs);
    const result: CompareResult = { documentId: document.id, from: older, to: newer, summary: summarize(blocks), blocks };
    res.json(result);
  });

  app.use('/api', (_req, res) => fail(res, 404, 'not_found'));

  // client/dist is missing until `npm run build`. Without it the server is the API alone.
  if (clientDir && existsSync(clientDir)) {
    const dir = path.resolve(clientDir);
    app.use(express.static(dir));
    // Any other address belongs to the router of the client, so /document/H.1.4.3 works on reload.
    // Express 5 rejects the path '*', so the fallback is a handler without a path.
    app.use((_req, res) => {
      res.sendFile(path.join(dir, 'index.html'), ANY_FOLDER);
    });
  }

  const onError: ErrorRequestHandler = (error, _req, res, next) => {
    // Express rejects an address with a broken % escape before any route runs.
    // That is the fault of the caller, so it is answered as a bad request and is not logged as ours.
    if (error instanceof URIError) return fail(res, 400, 'bad_request');
    console.error(error);
    // Once an answer has started it cannot be replaced; Express closes the connection.
    if (res.headersSent) return next(error);
    fail(res, 500, 'server_error');
  };
  app.use(onError);

  return app;
}
