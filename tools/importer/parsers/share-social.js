/* eslint-disable */
/* global WebImporter */
/**
 * Parser for share-social. Base: share (custom, no library convention).
 * Source: https://servier.com/newsroom/dossiers/dystrophie-musculaire-becker-maladie-evolutions-multiples/
 * (template "article"). Generated: 2026-10-15.
 *
 * Source DOM (validated in migration-work/block-context/share-social/source.html and live page):
 *   .single-wrapper > article > footer.wp-block-group                 <- element
 *     > section
 *         > span "Partager sur :"                                    (label - the only authored field)
 *         > div > a[href*=facebook|twitter|linkedin] (icon only), button.js-copy-link
 *           -> NOT authored: the block JS builds the network links from the canonical URL/og:title
 *
 * UE model (blocks/share-social/_share-social.json), 1 row:
 *   classes (skipped per hinting rules), label (text) -> "Partager sur :"
 */
export default function parse(element, { document }) {
  const hint = (name) => document.createComment(` field:${name} `);
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

  // Label: first short text element that is not inside a share link/button.
  const labelEl = [...element.querySelectorAll('span, p, h2, h3, h4, strong')]
    .find((el) => !el.closest('a, button') && norm(el.textContent));
  const label = labelEl ? norm(labelEl.textContent) : 'Partager sur :';

  const p = document.createElement('p');
  p.textContent = label;

  const cells = [[[hint('label'), p]]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'share-social', cells });
  element.replaceWith(block);
}
