/**
 * Work with files instead of web pages (PDF, DOCX, XLSX, CSV, JPG, PNG).
 *
 * On self-hosted Maxun, documents.extract() and the 'summary' format need an
 * LLM: pass llmProvider (and llmApiKey for anthropic/openai) in the options.
 *
 * Usage: npx tsx documents.ts path/to/invoice.pdf
 */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { Maxun } from 'maxun-sdk';

const maxun = new Maxun();
const file = process.argv[2] || 'invoice.pdf';

async function main() {
  // Pull specific data out of the file
  const extractor = await maxun.documents.extract(file, 'Invoice number, date, and total amount');
  console.log((await extractor.run()).documentData);

  // Convert the file to Markdown (formats default to markdown, html, links, summary)
  const parser = await maxun.documents.parse(file, { formats: ['markdown'] });
  console.log(((await parser.run()).markdown || '').slice(0, 1000));

  // A Buffer works too; give a file name so the type is known
  await maxun.documents.parse(fs.readFileSync(file), {
    fileName: `copy-${path.basename(file)}`,
    formats: ['markdown'],
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
