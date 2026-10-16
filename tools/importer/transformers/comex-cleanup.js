/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: servier.com Comité Exécutif cleanup (templates "comex" and "comex-member").
 * Runs after servier-cleanup.js and before servier-sections.js.
 *
 * Selectors verified against the live source DOM:
 *   https://servier.com/groupe/comex/
 *   https://servier.com/groupe/comex/comite-executif-olivier-laureau/
 *
 * - Banner breadcrumbs: <div class="breadcrumbs lg:w-1/3 lg:pt-20"> inside
 *   #main > .page-header--classic > .page-header-wrap
 *   (<span><a href="https://servier.com/">Accueil</a></span> > ... > <span class="breadcrumb_last">...)
 *   are captured, removed, then re-authored as a <ul> in the hero-page-banner text cell
 *   (blocks/hero-page-banner uses an authored list to override its URL-derived trail).
 * - Intro columns: .wp-block-columns.has-logo has an empty 5% spacer .wp-block-column.
 * - CTA: <div class="wp-block-button"><a class="wp-block-button__link ..." href="https://servier.com/groupe/gouvernance/">
 *   in the last .content-page group (the member cards' "En savoir plus" buttons live in the
 *   .has-indigo-50-background-color group and are left to the comex-members block).
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

const SOURCE_HOSTS = ['servier.com', 'www.servier.com'];

// Breadcrumbs captured in beforeTransform, consumed in afterTransform (same page import).
let capturedCrumbs = [];

function toSiteRelative(href) {
  if (!href) return href;
  try {
    const url = new URL(href, 'https://servier.com/');
    if (SOURCE_HOSTS.includes(url.hostname)) return `${url.pathname}${url.search}${url.hash}`;
  } catch (e) {
    // keep the original value
  }
  return href;
}

function captureBreadcrumbs(element) {
  const crumbsEl = element.querySelector('.page-header--classic .breadcrumbs');
  if (!crumbsEl) return [];
  // Each crumb is the innermost <span> holding either a link or the .breadcrumb_last text.
  const items = [...crumbsEl.querySelectorAll('a, .breadcrumb_last')];
  const crumbs = items
    .map((item) => ({
      text: item.textContent.replace(/\s+/g, ' ').trim(),
      href: item.tagName === 'A' ? toSiteRelative(item.getAttribute('href')) : null,
    }))
    .filter((c) => c.text);
  // The last crumb (current page) never carries a link.
  if (crumbs.length) crumbs[crumbs.length - 1].href = null;
  return crumbs;
}

function buildCrumbList(doc, crumbs) {
  const ul = doc.createElement('ul');
  crumbs.forEach(({ text, href }, i) => {
    const li = doc.createElement('li');
    if (href && i < crumbs.length - 1) {
      const a = doc.createElement('a');
      a.setAttribute('href', href);
      a.textContent = text;
      li.append(a);
    } else {
      li.textContent = text;
    }
    ul.append(li);
  });
  return ul;
}

// Locate the text cell of the hero-page-banner block table (created by
// tools/importer/parsers/hero-page-banner.js: header row "hero-page-banner",
// row 1 = image, row 2 = heading). Falls back to the raw banner title card when
// no parser ran (e.g. standalone transformer validation).
function findBannerTextCell(element) {
  const tables = [...element.querySelectorAll('table')];
  const block = tables.find((t) => {
    const first = t.querySelector('tr');
    // createBlock titles the header cell ("Hero Page Banner"): compare normalised names
    const name = first && first.textContent.trim().toLowerCase().replace(/\s+/g, '-');
    return name && /^hero-page-banner\b/.test(name);
  });
  if (block) {
    const rows = [...block.querySelectorAll(':scope > tbody > tr, :scope > tr')].slice(1);
    const textRow = rows.find((r) => r.querySelector('h1, h2, h3, h4, h5, h6'))
      || rows.find((r) => !r.querySelector('img, picture'));
    return textRow ? textRow.querySelector('td') : null;
  }
  return element.querySelector('.page-header--classic .title-page');
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    const doc = element.ownerDocument;

    // 1. Banner breadcrumbs: capture then remove (non-authored chrome in the source).
    capturedCrumbs = captureBreadcrumbs(element);
    WebImporter.DOMUtils.remove(element, ['.page-header--classic .breadcrumbs']);

    // 2. Empty WP spacer column in the intro columns (style="flex-basis:5%").
    element.querySelectorAll('.wp-block-columns.has-logo > .wp-block-column').forEach((col) => {
      if (!col.textContent.trim() && !col.querySelector('img, picture, video, iframe')) col.remove();
    });

    // 3. CTA button ("En savoir plus" -> /groupe/gouvernance/): bold link => EDS button.
    //    The CTA <h2> keeps its <br> ("Découvrir la gouvernance<br>du groupe Servier").
    element.querySelectorAll('.wp-block-button a.wp-block-button__link').forEach((a) => {
      if (a.closest('.has-indigo-50-background-color')) return; // member cards: handled by their block
      a.setAttribute('href', toSiteRelative(a.getAttribute('href')));
      if (a.closest('strong, b')) return;
      const strong = doc.createElement('strong');
      a.replaceWith(strong);
      strong.append(a);
    });
  }

  if (hookName === TransformHook.afterTransform) {
    if (!capturedCrumbs.length) return;
    const cell = findBannerTextCell(element);
    if (!cell) return;
    const list = buildCrumbList(element.ownerDocument, capturedCrumbs);
    const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading && heading.parentElement === cell) heading.after(list);
    else cell.append(list);
    capturedCrumbs = [];
  }
}
