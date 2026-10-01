/**
 * Describe what you want in plain English and let Maxun build the robot.
 *
 * On Maxun Cloud nothing else is needed. On self-hosted Maxun an LLM is
 * required: set MAXUN_LLM_PROVIDER (anthropic, openai or ollama) and, for
 * anthropic/openai, MAXUN_LLM_API_KEY. They are passed through only when set.
 */
import 'dotenv/config';
import { Maxun, LlmOptions } from 'maxun-sdk';

const maxun = new Maxun();

const llm: LlmOptions = Object.fromEntries(
  Object.entries({
    llmProvider: process.env.MAXUN_LLM_PROVIDER,
    llmModel: process.env.MAXUN_LLM_MODEL,
    llmApiKey: process.env.MAXUN_LLM_API_KEY,
    llmBaseUrl: process.env.MAXUN_LLM_BASE_URL,
  }).filter(([, value]) => value)
);

async function main() {
  // With a URL
  const robot = await maxun.extract('YC Companies', 'https://www.ycombinator.com/companies', {
    prompt: 'Extract the first 15 company names, descriptions and batch',
    ...llm,
  });
  const result = await robot.run();
  console.log(JSON.stringify(result.listData.slice(0, 3), null, 2));

  // Without a URL, Maxun searches for a suitable page first
  const auto = await maxun.extract('YC Companies (auto-search)', {
    prompt: 'Company names and descriptions from the Y Combinator companies directory',
    ...llm,
  });
  console.log(`Robot built for ${auto.url}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
