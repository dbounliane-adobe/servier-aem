/* eslint-disable */
/* global WebImporter */
/**
 * Parser for comex-members. Base: comex-members (custom, key-value config block).
 * Source: https://servier.com/groupe/comex/ (template "comex"). Generated: 2026-10-16.
 *
 * Source DOM (validated in migration-work/block-context/comex-members/source.html):
 *   div.wp-block-group.has-indigo-50-background-color
 *     div.wp-block-group.alignwide
 *       div.wp-block-columns.alignwide × 4 (rows of 3)
 *         div.wp-block-column > div.wp-block-group            <- one card (iteration key)
 *           figure.wp-block-image > img (photo)
 *           p.mb-0 > strong                                    (name)
 *           p.has-small-font-size                              (position)
 *           div.wp-block-columns.is-not-stacked-on-mobile
 *             .wp-block-button > a.wp-block-button__link       ("En savoir plus" -> detail URL)
 *             figure > a[href*=linkedin] > img[alt]            ("Logo de LinkedIn")
 *
 * Card data (photo, position, LinkedIn) comes from the COMEX Content Fragments at runtime,
 * so the block only carries the key-value config (model blocks/comex-members/_comex-members.json):
 *   members        ordered list (source DOM order) of links /groupe/comex/<slug>, text = name
 *                  (slug = detail URL slug, "comite-executif-" prefix removed, lowercase, no accents)
 *   readMore       card button text
 *   linkedinLabel  LinkedIn icon alt
 * Like article-list, key-value rows carry no field hints (md2jcr maps rows by key).
 * Cards are iterated on their block wrapper (div.wp-block-group), never on anchors.
 */
export default function parse(element, { document }) {
  const clean = (node) => (node ? node.textContent.replace(/\s+/g, ' ').trim() : '');

  const toSlug = (href) => {
    let path = href || '';
    try { path = new URL(href, 'https://servier.com').pathname; } catch (e) { /* keep raw */ }
    const last = path.replace(/\/+$/, '').split('/').pop() || '';
    return last
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/^comite-executif-/, '')
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const isDetailLink = (a) => /\/groupe\/comex\/[^/]+/.test(a.getAttribute('href') || '')
    && !/linkedin\.com/i.test(a.getAttribute('href') || '');

  // Cards: block-level group wrappers holding a detail link. Keep only the innermost
  // wrappers so the outer .alignwide group is not counted.
  let cards = [...element.querySelectorAll('.wp-block-column > .wp-block-group')]
    .filter((g) => [...g.querySelectorAll('a[href]')].some(isDetailLink));
  if (!cards.length) {
    // Fallback: any column holding a detail link
    cards = [...element.querySelectorAll('.wp-block-column')]
      .filter((c) => !c.querySelector('.wp-block-column') && [...c.querySelectorAll('a[href]')].some(isDetailLink));
  }

  const seen = new Set();
  const members = [];
  cards.forEach((card) => {
    const link = card.querySelector('a.wp-block-button__link[href]')
      || [...card.querySelectorAll('a[href]')].find(isDetailLink);
    if (!link) return;
    const slug = toSlug(link.getAttribute('href'));
    if (!slug || seen.has(slug)) return;
    seen.add(slug);
    const nameEl = card.querySelector('p.mb-0 strong, p strong, h2, h3, h4');
    const name = clean(nameEl) || slug;
    members.push({ slug, name });
  });

  if (!members.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const list = document.createElement('ul');
  members.forEach(({ slug, name }) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `/groupe/comex/${slug}`;
    a.textContent = name;
    li.append(a);
    list.append(li);
  });

  const readMoreEl = element.querySelector('.wp-block-button a.wp-block-button__link, a.wp-element-button');
  const readMore = clean(readMoreEl);

  const linkedinImg = element.querySelector('a[href*="linkedin.com"] img[alt], img[src*="linkedin"][alt], img[data-lazy-src*="linkedin"][alt]');
  const linkedinLabel = linkedinImg ? linkedinImg.getAttribute('alt').trim() : '';

  const cells = [
    ['members', list],
    ['readMore', readMore],
    ['linkedinLabel', linkedinLabel],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'comex-members', cells });
  element.replaceWith(block);
}
