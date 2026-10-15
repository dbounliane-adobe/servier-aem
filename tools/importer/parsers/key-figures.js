/* eslint-disable */
/* global WebImporter */
/**
 * Parser for key-figures. Base: key-figures (custom collection block, no library convention).
 * Source: https://servier.com/newsroom/dossiers/dystrophie-musculaire-becker-maladie-evolutions-multiples/
 * (template "article"). Generated: 2026-10-15.
 *
 * Source DOM (validated in migration-work/block-context/key-figures/source.html and live page):
 *   .single--content .wp-block-columns (only .wp-block-numbers columns)   <- element
 *     > .wp-block-column (x3)
 *         > .wp-block-numbers
 *             > p  value  ("∼50 %", "∼30-40 %", "86 %")
 *             > p  label  (description sentence)
 *
 * Iteration key: .wp-block-numbers (block-level <div>, iterationSafe; structure.json count 3).
 *
 * UE model (blocks/key-figures/_key-figures.json): container with "key-figure" items,
 * one row per item, 2 cells: value (text) | label (text).
 */
export default function parse(element, { document }) {
  const hint = (name) => document.createComment(` field:${name} `);
  const textOf = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

  let items = [...element.querySelectorAll('.wp-block-numbers')];
  if (!items.length) items = [...element.querySelectorAll(':scope > .wp-block-column')];

  const cells = [];
  items.forEach((item) => {
    const paragraphs = [...item.querySelectorAll('p')].filter((p) => textOf(p));
    let value = '';
    let label = '';
    if (paragraphs.length) {
      value = textOf(paragraphs[0]);
      label = paragraphs.slice(1).map(textOf).join(' ');
    } else {
      // Fallback: value/label as dedicated elements (e.g. .number / .text) or headings.
      value = textOf(item.querySelector('[class*="number"], [class*="value"], h2, h3, strong'));
      label = textOf(item).replace(value, '').trim();
    }
    if (!value && !label) return;

    const valueCell = value ? [hint('value'), document.createTextNode(value)] : '';
    const labelCell = label ? [hint('label'), document.createTextNode(label)] : '';
    cells.push([valueCell, labelCell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'key-figures', cells });
  element.replaceWith(block);
}
