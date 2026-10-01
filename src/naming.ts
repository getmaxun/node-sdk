/**
 * Automatic robot names.
 *
 * When you don't name a robot, the SDK names it after what it does plus a short
 * fingerprint of its settings, e.g. `Scrape: maxun.dev/pricing [3f2a1c]`.
 *
 * The same call always produces the same name, so running a script twice reuses
 * the robot instead of creating a duplicate. Different settings give a different
 * fingerprint, so they never collide with an existing robot. The Python SDK uses
 * the same scheme, so both produce the same name for the same settings.
 */

import { createHash } from 'crypto';

const SECRET_KEYS = new Set(['llmApiKey']);

function sortDeep(value: any): any {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .filter((key) => value[key] !== undefined)
      .reduce((out: Record<string, any>, key) => {
        out[key] = sortDeep(value[key]);
        return out;
      }, {});
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortDeep(value));
}

export function fingerprint(settings: Record<string, any>): string {
  const cleaned = Object.fromEntries(
    Object.entries(settings).filter(([key, value]) => !SECRET_KEYS.has(key) && value !== undefined && value !== null)
  );
  return createHash('sha1').update(canonicalJson(cleaned), 'utf8').digest('hex').slice(0, 6);
}

export function describeUrl(url: string, limit = 60): string {
  const text = url.trim().replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').replace(/^www\./, '').replace(/\/+$/, '');
  return [...text].length <= limit ? text : [...text].slice(0, limit - 1).join('') + '…';
}

export function shorten(text: string, limit = 50): string {
  const clean = text.split(/\s+/).filter(Boolean).join(' ');
  return [...clean].length <= limit ? clean : [...clean].slice(0, limit - 1).join('') + '…';
}

export function autoName(kind: string, subject: string, settings: Record<string, any>): string {
  return `${kind}: ${subject} [${fingerprint(settings)}]`;
}

/** Catch the common mistake of passing a robot name where the URL goes. */
export function checkUrl(url: unknown, call: string): string {
  if (typeof url !== 'string' || !url.trim()) {
    throw new Error(`${call} needs a URL first, e.g. ${call.split('(')[0]}('https://example.com').`);
  }
  const trimmed = url.trim();
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) && (trimmed.includes(' ') || !trimmed.includes('.'))) {
    throw new Error(`${call} takes the URL first, but got "${trimmed}". Pass the robot name as { name }.`);
  }
  return trimmed;
}
