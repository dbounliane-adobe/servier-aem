/**
 * Page banner: photo + overlapping title card + breadcrumbs.
 * Authored rows: image (+ alt) and rich text (heading). Breadcrumbs are derived
 * from the current URL unless the author adds a list of links to the text.
 * The same block is reused on the dossiers listing and on every dossier page.
 */

const LABELS = {
  fr: { home: 'Accueil', nav: 'Fil d’Ariane' },
  en: { home: 'Home', nav: 'Breadcrumb' },
};

function getLabels() {
  const lang = (document.documentElement.lang || 'fr').slice(0, 2).toLowerCase();
  return LABELS[lang] || LABELS.fr;
}

function humanize(slug) {
  const text = decodeURIComponent(slug).replace(/[-_]+/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getPageTitle() {
  const h1 = document.querySelector('main h1');
  if (h1?.textContent.trim()) return h1.textContent.trim();
  const og = document.querySelector('meta[property="og:title"]')?.content || document.title || '';
  return og.replace(/\s+[|–-]\s+Servier\s*$/i, '').trim();
}

/**
 * Splits the current path into a site base (AEM author paths such as
 * /content/<site>/...html) and the page segments.
 */
function getPathInfo() {
  let path = window.location.pathname;
  let base = '';
  let suffix = '';
  // AEM author pages live under /content/<site>/; local `aem up` serves the
  // content folder under /content/ (no site segment)
  const isAuthor = window.location.hostname.includes('adobeaemcloud');
  const contentMatch = isAuthor
    ? path.match(/^(\/content\/[^/]+)(\/.*)?$/)
    : path.match(/^(\/content)(\/.*)?$/);
  if (contentMatch) {
    [, base] = contentMatch;
    path = contentMatch[2] || '/';
    if (path.endsWith('.html')) {
      suffix = '.html';
      path = path.slice(0, -5);
    }
  }
  // a folder index page (/newsroom/dossiers/ or …/index) is the folder itself
  const isIndex = path.endsWith('/') || /\/index$/.test(path);
  const segments = path.replace(/\/index$/, '').split('/').filter(Boolean);
  return {
    base, suffix, segments, isIndex,
  };
}

function buildCrumbs() {
  const labels = getLabels();
  const {
    base, suffix, segments, isIndex,
  } = getPathInfo();
  const crumbs = [{ label: labels.home, href: `${base}/${suffix ? `index${suffix}` : ''}` }];
  if (isIndex && segments.length) {
    // Accueil > Dossiers (current folder, as on servier.com)
    crumbs.push({ label: humanize(segments[segments.length - 1]) });
    return crumbs;
  }
  if (segments.length > 1) {
    const parent = segments.slice(0, -1);
    crumbs.push({
      label: humanize(parent[parent.length - 1]),
      href: suffix ? `${base}/${parent.join('/')}${suffix}` : `${base}/${parent.join('/')}/`,
    });
  }
  if (segments.length) {
    crumbs.push({ label: getPageTitle() || humanize(segments[segments.length - 1]) });
  }
  return crumbs;
}

function buildBreadcrumbs(authoredList) {
  const nav = document.createElement('nav');
  nav.className = 'hero-page-banner-breadcrumbs';
  nav.setAttribute('aria-label', getLabels().nav);
  const ol = document.createElement('ol');

  const crumbs = authoredList
    ? [...authoredList.querySelectorAll(':scope > li')].map((li) => {
      const a = li.querySelector('a');
      return { label: li.textContent.trim(), href: a?.getAttribute('href') };
    })
    : buildCrumbs();

  crumbs.forEach(({ label, href }, i) => {
    if (!label) return;
    const li = document.createElement('li');
    const isLast = i === crumbs.length - 1;
    if (href && !isLast) {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      li.append(a);
    } else {
      li.textContent = label;
      if (isLast) li.setAttribute('aria-current', 'page');
    }
    ol.append(li);
  });

  nav.append(ol);
  return nav;
}

/**
 * The source highlights one word of the card heading (authored as <strong>).
 * When no word is marked, highlight the last word, as on servier.com.
 */
function highlightHeading(card) {
  const heading = card.querySelector('h1, h2, h3');
  if (!heading || heading.querySelector('strong, b')) return;
  const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
  let last = null;
  while (walker.nextNode()) {
    if (walker.currentNode.textContent.trim()) last = walker.currentNode;
  }
  if (!last) return;
  const match = last.textContent.match(/^([\s\S]*?)(\S+)(\s*)$/);
  if (!match || !match[1].trim()) return; // keep single-word headings plain
  const [, before, word, after] = match;
  const span = document.createElement('span');
  span.className = 'hero-page-banner-highlight';
  span.textContent = word;
  last.replaceWith(before, span, after);
}

export default function decorate(block) {
  const rows = [...block.children];
  const mediaRow = rows.find((row) => row.querySelector('picture, img'));
  const textRows = rows.filter((row) => row !== mediaRow);

  if (mediaRow) {
    mediaRow.classList.add('hero-page-banner-media');
    mediaRow.querySelectorAll('img').forEach((img) => {
      img.alt = img.alt || '';
    });
  } else {
    block.classList.add('hero-page-banner-no-image');
  }

  let authoredList = null;
  textRows.forEach((row) => {
    if (!row.textContent.trim()) {
      row.remove();
      return;
    }
    const list = row.querySelector('ul, ol');
    if (list && !authoredList) {
      authoredList = list;
      list.remove();
    }
    if (row.textContent.trim()) {
      row.classList.add('hero-page-banner-card');
      highlightHeading(row);
    } else row.remove();
  });

  block.append(buildBreadcrumbs(authoredList));
}
