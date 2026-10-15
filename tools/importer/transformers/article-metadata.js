/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: servier.com newsroom dossier ARTICLE page metadata (template "article").
 *
 * Appends the page Metadata block (fields from models/_page.json):
 *   Title / Description / Image (via WebImporter.Blocks.getMetadata: <title>, meta description, og:image)
 *   template = article, theme = servier, language = fr (from <html lang>),
 *   category (e.g. "Décryptages"), publication-date (YYYY-MM-DD).
 *
 * The import script using this transformer must NOT append its own getMetadataBlock()
 * (import-home.js does it inline; the article script should rely on this transformer instead).
 *
 * Values are read in beforeTransform (before the article-header parser consumes
 * <time class="single--date">) and stashed as data-* attributes on the root element,
 * then written out and cleared in afterTransform.
 *
 * Sources verified in migration-work/cleaned.html / metadata.json:
 *   <time class="single--date">6 octobre 2026</time> (no datetime attr on this page; supported if present)
 *   <article class="... category_folder-decryptages tag_folder-...">
 *   <div class="page-header--classic"> ... <div class="title-page"><h2>Retrouvez nos <strong>décryptages</strong>
 *   JSON-LD (Yoast) WebPage.datePublished "2026-10-06T07:47:34+00:00" (fallback)
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

const ATTR_DATE = 'data-excat-article-date';
const ATTR_CATEGORY = 'data-excat-article-category';
const ATTR_TAGS = 'data-excat-article-tags';

const FR_MONTHS = {
  janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12,
};

// Known category slugs (article class "category_folder-<slug>") -> display label.
const CATEGORY_LABELS = {
  decryptages: 'Décryptages',
};

const pad = (n) => String(n).padStart(2, '0');
// Strip diacritics so "février"/"août"/"décembre" match FR_MONTHS keys.
const stripAccents = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function toIsoDate(value) {
  if (!value) return '';
  const text = value.trim();
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  // French long date: "6 octobre 2026" / "1er mars 2025"
  const fr = stripAccents(text.toLowerCase()).match(/(\d{1,2})(?:er)?\s+([a-z]+)\s+(\d{4})/);
  if (fr && FR_MONTHS[fr[2]]) return `${fr[3]}-${pad(FR_MONTHS[fr[2]])}-${pad(fr[1])}`;
  // dd/mm/yyyy
  const num = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (num) return `${num[3]}-${pad(num[2])}-${pad(num[1])}`;
  return '';
}

function jsonLdDatePublished(doc) {
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const s of scripts) {
    try {
      const data = JSON.parse(s.textContent);
      const nodes = Array.isArray(data['@graph']) ? data['@graph'] : [data];
      const hit = nodes.find((n) => n && n.datePublished);
      if (hit) return hit.datePublished;
    } catch (e) { /* ignore malformed JSON-LD */ }
  }
  return '';
}

function readCategory(element) {
  // 1. Article taxonomy class: category_folder-decryptages (the banner says
  //    "décryptages" on every dossier, so it is only a fallback)
  const article = element.querySelector('article[class*="category_folder-"]');
  const m = article && article.className.match(/category_folder-([a-z0-9-]+)/);
  if (m) {
    const slug = m[1];
    return CATEGORY_LABELS[slug] || (slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '));
  }
  // 2. Banner title highlight: "Retrouvez nos <strong>décryptages</strong>"
  const strong = element.querySelector('.page-header--classic .title-page h2 strong');
  const fromBanner = strong && strong.textContent.trim();
  if (fromBanner) return fromBanner.charAt(0).toUpperCase() + fromBanner.slice(1);
  return '';
}

// Article tags (class "tag_folder-<slug>") -> labels, e.g. "Comprendre les pathologies"
const TAG_LABELS = {
  'comprendre-les-pathologies': 'Comprendre les pathologies',
  'comprendre-la-recherche': 'Comprendre la recherche',
  'comprendre-nos-engagements': 'Comprendre nos engagements',
};

function readTags(element) {
  const article = element.querySelector('article[class*="tag_folder-"]');
  if (!article) return [];
  return [...article.className.matchAll(/tag_folder-([a-z0-9-]+)/g)].map(([, slug]) => TAG_LABELS[slug]
    || (slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')));
}

export default function transform(hookName, element, payload) {
  const doc = (payload && payload.document) || element.ownerDocument || document;

  if (hookName === TransformHook.beforeTransform) {
    const time = element.querySelector('time.single--date');
    let date = '';
    if (time) date = toIsoDate(time.getAttribute('datetime')) || toIsoDate(time.textContent);
    if (!date) date = toIsoDate(jsonLdDatePublished(doc));
    if (!date) {
      const meta = doc.querySelector('meta[property="article:published_time"]');
      date = toIsoDate(meta && meta.getAttribute('content'));
    }
    if (date) element.setAttribute(ATTR_DATE, date);

    const category = readCategory(element);
    if (category) element.setAttribute(ATTR_CATEGORY, category);

    const tags = readTags(element);
    if (tags.length) element.setAttribute(ATTR_TAGS, tags.join(', '));
  }

  if (hookName === TransformHook.afterTransform) {
    let meta = {};
    try {
      meta = WebImporter.Blocks.getMetadata(doc) || {};
    } catch (e) { meta = {}; }

    // page template: "article" by default; an import script may set
    // PAGE_TEMPLATE.pageTemplate (e.g. "listing" for /newsroom/dossiers/)
    const pageTemplate = (payload && payload.template && payload.template.pageTemplate) || 'article';
    meta.template = pageTemplate;
    meta.theme = 'servier';
    const lang = (doc.documentElement.getAttribute('lang') || 'fr').split('-')[0].toLowerCase();
    meta.language = lang || 'fr';

    // category / publication date only describe articles
    const category = element.getAttribute(ATTR_CATEGORY);
    if (category && pageTemplate === 'article') meta.category = category;
    const date = element.getAttribute(ATTR_DATE);
    if (date && pageTemplate === 'article') meta['publication-date'] = date;
    // tags → page "keywords" (models/_page.json), indexed for the article-list Étiquettes filter
    const tags = element.getAttribute(ATTR_TAGS);
    if (tags && pageTemplate === 'article') meta.keywords = tags;
    element.removeAttribute(ATTR_CATEGORY);
    element.removeAttribute(ATTR_DATE);
    element.removeAttribute(ATTR_TAGS);

    // own section: the page metadata block must not share a section with content
    element.append(doc.createElement('hr'), WebImporter.Blocks.getMetadataBlock(doc, meta));
  }
}
