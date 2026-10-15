/* eslint-disable */
/* global WebImporter */
/**
 * Parser for callout-did-you-know. Base: callout (custom, no library convention).
 * Source: https://servier.com/newsroom/dossiers/dystrophie-musculaire-becker-maladie-evolutions-multiples/
 * (template "article"). Generated: 2026-10-15.
 *
 * Source DOM (validated in migration-work/block-context/callout-did-you-know/source.html and live page):
 *   .single--content .wp-block-did-you-know             <- element
 *     > .bloc
 *         > div > svg|img (decorative lightbulb icon; rebuilt by the block JS)
 *         > #text "Le saviez-vous ?"                   (bare text node = label)
 *         > .block-border (decorative)
 *     > .content
 *         > p (empty, left by <!-- wp:paragraph --> comments; removed)
 *         > p ... <sup><a href="#_ftnN">N</a></sup>     (footnote anchors unwrapped by article-cleanup.js)
 *
 * UE model (blocks/callout-did-you-know/_callout-did-you-know.json), 2 rows:
 *   1. title (text)     -> label "Le saviez-vous ?"
 *   2. text (richtext)  -> paragraphs of .content
 */
export default function parse(element, { document }) {
  const hint = (name) => document.createComment(` field:${name} `);

  // Row 1: label = text of .bloc minus icon and decorative children.
  const bloc = element.querySelector(':scope > .bloc') || element.querySelector('.bloc');
  let label = '';
  if (bloc) {
    const clone = bloc.cloneNode(true);
    clone.querySelectorAll('svg, img, .block-border').forEach((n) => n.remove());
    label = clone.textContent.replace(/\s+/g, ' ').trim();
  }

  // Row 2: rich text paragraphs (drop WP block comments and empty paragraphs).
  const content = element.querySelector(':scope > .content') || element.querySelector('.content');
  const textParts = [];
  if (content) {
    const walker = document.createTreeWalker(content, 128 /* NodeFilter.SHOW_COMMENT */);
    const comments = [];
    while (walker.nextNode()) comments.push(walker.currentNode);
    comments.forEach((c) => c.remove());
    [...content.children].forEach((child) => {
      if (child.textContent.trim() || child.querySelector('img, a')) textParts.push(child);
    });
    if (!textParts.length && content.textContent.trim()) {
      const p = document.createElement('p');
      p.append(...content.childNodes);
      textParts.push(p);
    }
  }

  if (!label && !textParts.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const labelCell = [];
  if (label) {
    const p = document.createElement('p');
    p.textContent = label;
    labelCell.push(hint('title'), p);
  }

  const cells = [
    [labelCell.length ? labelCell : ''],
    [textParts.length ? [hint('text'), ...textParts] : ''],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'callout-did-you-know', cells });
  element.replaceWith(block);
}
