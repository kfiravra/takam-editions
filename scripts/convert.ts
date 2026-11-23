// Converts every Word file of the sample, once, into a PDF (for reading) and a text file (for comparing).
// Run by hand: npm run convert. It needs LibreOffice. The server never opens a Word file.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { config } from '../server/config';

const dir = config.dataDir;

function lacksOutput(docx: string): boolean {
  const name = docx.slice(0, -'.docx'.length);
  return !existsSync(`${name}.pdf`) || !existsSync(`${name}.txt`);
}

const pending = readdirSync(dir)
  .filter((name) => name.endsWith('.docx'))
  .map((name) => path.join(dir, name))
  .filter(lacksOutput);

if (pending.length === 0) {
  console.log('Every Word file already has a PDF and a text file.');
} else {
  try {
    // "Text (encoded)" with UTF8 keeps the Hebrew; the plain "txt" filter writes the system's encoding.
    for (const format of ['pdf', 'txt:Text (encoded):UTF8']) {
      // execFile passes the arguments as they are, without a shell that could read a file name as a command.
      execFileSync(config.sofficePath, ['--headless', '--convert-to', format, '--outdir', dir, ...pending], {
        stdio: 'inherit',
      });
    }
    // LibreOffice can end with success without writing a file, so the files are the proof.
    const failed = pending.filter(lacksOutput);
    if (failed.length > 0) throw new Error(`LibreOffice did not convert ${failed.join(', ')}`);
    console.log(`${pending.length} Word files were converted to PDF and text.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error('Is LibreOffice installed? If it is not on the PATH, set SOFFICE_PATH in .env.');
    process.exit(1);
  }
}
