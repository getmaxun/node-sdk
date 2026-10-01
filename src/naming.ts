/**
 * Argument checks shared by `maxun.scrape(...)`, `maxun.crawl(...)` and friends.
 */

const URL_START = /^[a-z][a-z0-9+.-]*:\/\//i;

export function looksLikeUrl(value: unknown): boolean {
  return typeof value === 'string' && URL_START.test(value.trim());
}

/** Every robot needs a name; it is what Maxun shows for it. */
export function checkName(name: unknown, call: string): string {
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error(`${call} needs a robot name first, e.g. ${call.split('(')[0]}('Pricing page', ...).`);
  }
  return name.trim();
}

export function checkUrl(url: unknown, call: string, name?: unknown): string {
  if ((url === undefined || (url !== null && typeof url === 'object')) && looksLikeUrl(name)) {
    throw new TypeError(`${call} takes the robot name first, then the URL, e.g. ${call.split('(')[0]}('My robot', '${name}').`);
  }
  if (typeof url !== 'string' || !url.trim()) {
    throw new Error(`${call} needs a URL, e.g. ${call.split('(')[0]}('My robot', 'https://example.com').`);
  }
  const trimmed = url.trim();
  if (!URL_START.test(trimmed) && (trimmed.includes(' ') || !trimmed.includes('.'))) {
    throw new Error(`${call} expected a URL as its second argument, but got "${trimmed}".`);
  }
  return trimmed;
}
