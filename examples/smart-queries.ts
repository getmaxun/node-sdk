/**
 * Ask an LLM a question about a page on every run (Smart Queries).
 *
 * Maxun Cloud runs the LLM for you. On self-hosted Maxun, pass llmProvider
 * (plus llmApiKey for anthropic/openai) in the maxun.scrape() options.
 */
import 'dotenv/config';
import { Maxun } from 'maxun-sdk';

const maxun = new Maxun();

async function main() {
  const robot = await maxun.scrape('https://news.ycombinator.com', {
    smartQueries: 'Which story on this page has the most points?',
  });
  let result = await robot.run();
  console.log(result.smartQueryResult);

  // A different question for one run only:
  result = await robot.run({ smartQueries: 'List the three newest stories.' });
  console.log(result.smartQueryResult);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
