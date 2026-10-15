import { getMetadata } from './aem.js';

/**
 * Locale convention: /{folder}/{language}/, optionally below an AEM author site root.
 * Language is a two-letter code with an optional two-letter region (e.g. fr-CA).
 * Other paths keep root-level fragments.
 */
export function getLocalePrefix(pathname = window.location.pathname) {
  const authorRoot = pathname.match(/^\/content\/[^/]+(?=\/|$)/)?.[0] || '';
  const sitePath = pathname.slice(authorRoot.length);
  const locale = sitePath.match(/^\/[^/]+\/[a-z]{2}(?:-[a-z]{2})?(?=\/|$)/i)?.[0];
  return locale ? `${authorRoot}${locale}` : '';
}

export function getFragmentPaths(name) {
  const metadata = getMetadata(name);
  if (metadata) {
    const path = new URL(metadata, window.location.href).pathname;
    return [`${path.replace(/(?:\.plain)?\.html$/, '').replace(/\/$/, '')}.plain.html`];
  }
  const paths = [];
  const { hostname, pathname } = window.location;
  const prefix = getLocalePrefix(pathname);
  if (prefix) paths.push(`${prefix}/${name}.plain.html`);
  paths.push(`/${name}.plain.html`);
  const siteRoot = pathname.match(/^\/content\/[^/]+\//);
  if (siteRoot && hostname.includes('adobeaemcloud')) paths.push(`${siteRoot[0]}${name}.plain.html`);
  paths.push(`/content/${name}.plain.html`);
  return [...new Set(paths)];
}

/** Only missing fragments trigger fallback; other HTTP errors remain explicit. */
export async function fetchSiteFragment(name) {
  const paths = getFragmentPaths(name);
  // eslint-disable-next-line no-restricted-syntax
  for (const path of paths) {
    // eslint-disable-next-line no-await-in-loop
    const response = await fetch(path);
    if (response.ok) return response;
    if (response.status !== 404) {
      throw new Error(`${name} fragment returned HTTP ${response.status}: ${path}`);
    }
  }
  // eslint-disable-next-line no-console
  console.warn(`No ${name} fragment found`, paths);
  return null;
}
