/* eslint-disable */
/* global WebImporter */
/**
 * Parser for embed-social. Base: embed. Source: https://servier.com/ (template "home").
 * Generated: 2026-10-15.
 *
 * Source DOM (validated in migration-work/block-context/embed-social/source.html and live page):
 *   div.elfsight-app-<uuid>   (live: empty lazy placeholder with data-elfsight-app-lazy; widget
 *                              markup is injected at runtime and is third-party data, not content)
 *
 * UE model (blocks/embed-social/_embed-social.json), 2 rows:
 *   1. source -> Elfsight widget id (uuid taken from the class name), or a social URL fallback
 *   2. title  -> accessible title (empty unless the widget carries one)
 */
export default function parse(element, { document }) {
  const hint = (name) => document.createComment(` field:${name} `);
  const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

  // Widget id: from class "elfsight-app-<uuid>", fallback to any data attribute / nested class.
  let source = '';
  const classMatch = [...element.classList].find((c) => c.startsWith('elfsight-app-'));
  if (classMatch) {
    const m = classMatch.match(UUID);
    if (m) source = m[0];
  }
  if (!source) {
    const m = (element.outerHTML || '').match(UUID);
    if (m) source = m[0];
  }
  if (!source) {
    const link = element.querySelector('a[href^="https://"]');
    if (link) source = link.getAttribute('href');
  }

  if (!source) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const title = (element.getAttribute('title') || element.getAttribute('aria-label') || '').trim();

  const sourceCell = [hint('source'), document.createTextNode(source)];
  const titleCell = title ? [hint('title'), document.createTextNode(title)] : '';

  const cells = [
    [sourceCell],
    [titleCell],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'embed-social', cells });
  element.replaceWith(block);
}
