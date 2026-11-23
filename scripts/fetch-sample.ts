// Downloads the Word files of the sample from the Takam site and writes manifest.json next to them.
// Run by hand, once: npm run fetch-sample. The server never imports this file.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as pause } from 'node:timers/promises';
import sample from '../sample.config.json';
import { config } from '../server/config';
import type { DocumentEntry, Edition, Manifest } from '../shared/types';

// Only the fields this script reads from the two JSON answers of the site (PLAN.md, Design J).
interface SiteDocument {
  sfid: string;
  name: string;
  documentcodetext: string;
  documenttype: string;
  parentdocument: string | null;
  firstnamechapter: string | null;
  secondnamechapter: string | null;
}

interface SiteEdition {
  rtn_versionnumber__c: number;
  rtn_validfrom__c: string;
  rtn_contentversionid__c: string;
}

const base = config.takamBaseUrl;
const dir = config.dataDir;

async function request(url: string): Promise<Response> {
  // The request says what it is. It is never disguised as a browser.
  const response = await fetch(url, { headers: { 'user-agent': 'takam-editions-poc (sample download)' } });
  // A public site gets a breath after every request.
  await pause(300);
  if (!response.ok) throw new Error(`the site answered ${response.status} for ${url}`);
  return response;
}

async function requestList<T>(url: string): Promise<T[]> {
  const response = await request(url);
  // The firewall in front of the site can answer 200 with an HTML page in place of the JSON.
  const body: unknown = await response.json().catch(() => null);
  if (!Array.isArray(body)) throw new Error(`the site did not answer with a JSON list for ${url}`);
  return body;
}

async function downloadEditions(id: string, sfid: string): Promise<Edition[]> {
  const onSite = await requestList<SiteEdition>(`${base}/api/DocumentVersion/${sfid}`);
  // The site does not promise an order.
  onSite.sort((a, b) => b.rtn_versionnumber__c - a.rtn_versionnumber__c);

  const editions: Edition[] = [];
  for (const edition of onSite.slice(0, sample.editionsPerDocument)) {
    const file = `${id}_v${edition.rtn_versionnumber__c}`;
    // The last part of the address is free text; the site finds the file by the part before it.
    const response = await request(`${base}/api/DocumentSF/DownloadDocument/${edition.rtn_contentversionid__c}/${id}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    // A docx is a zip archive, and a zip starts with "PK". Some old editions are in another format.
    if (bytes.subarray(0, 2).toString('latin1') !== 'PK') {
      console.warn(`skipped ${file}: it is not a Word (docx) file`);
      continue;
    }
    await writeFile(path.join(dir, `${file}.docx`), bytes);
    editions.push({
      number: edition.rtn_versionnumber__c,
      // Cut from the text and not parsed, so a time zone can never move the date by a day.
      validFrom: edition.rtn_validfrom__c.slice(0, 10),
      file,
    });
  }
  return editions;
}

// The local day and not the UTC day: after midnight in Israel the two differ.
function today(): string {
  const now = new Date();
  const twoDigits = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${twoDigits(now.getMonth() + 1)}-${twoDigits(now.getDate())}`;
}

async function main(): Promise<void> {
  await mkdir(dir, { recursive: true });
  const site = await requestList<SiteDocument>(`${base}/api/Document`);

  const documents: DocumentEntry[] = [];
  for (const id of sample.documents) {
    const found = site.find((entry) => entry.documentcodetext === id);
    if (!found) throw new Error(`${id} was not found on the site`);
    const parent = site.find((entry) => entry.sfid === found.parentdocument);

    const type = found.documenttype.toLowerCase();
    if (type !== 'instruction' && type !== 'message' && type !== 'form') {
      throw new Error(`${id} has a type the contract does not know: ${found.documenttype}`);
    }

    // A message or a form has no chapter of its own on the site: it sits in the chapter of its instruction.
    const chapterSource = parent ?? found;
    const editions = await downloadEditions(id, found.sfid);
    documents.push({
      id,
      number: id.slice(id.indexOf('.') + 1),
      // One name on the site ends with an invisible direction mark.
      name: found.name.replace(/[\u200E\u200F]/g, '').trim(),
      type,
      chapter: chapterSource.firstnamechapter ?? '',
      subChapter: chapterSource.secondnamechapter ?? '',
      // A parent outside the sample would be a link to a document the app does not have.
      parentId: parent && sample.documents.includes(parent.documentcodetext) ? parent.documentcodetext : null,
      editions,
    });
    console.log(`${id}: editions ${editions.map((edition) => edition.number).join(', ')}`);
  }

  // Written last, so the manifest never names a file that was not saved.
  const manifest: Manifest = { source: base, fetchedAt: today(), documents };
  await writeFile(path.join(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`manifest.json was written to ${dir}`);
}

main().catch((error: unknown) => {
  console.error(`The sample was not downloaded: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
