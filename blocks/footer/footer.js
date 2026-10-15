/**
 * Footer block.
 * Content-first: all copy, links and images come from the footer fragment
 * (content/footer.plain.html). This file only builds the layout shell and
 * interactive controls around that authored content.
 */

/**
 * Fetches the footer fragment. Metadata-independent on purpose:
 * /content/footer.plain.html (local aem up) first, then /footer.plain.html (DA/EDS).
 * @returns {Promise<{html: string, base: string}|null>}
 */
async function fetchFooterFragment() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  return { html: await resp.text(), base: resp.url };
}

/**
 * Parses fragment HTML and rewrites relative media URLs against the fragment URL.
 * @param {string} html fragment markup
 * @param {string} base absolute URL the fragment was served from
 * @returns {HTMLElement} wrapper holding the fragment sections
 */
function parseFragment(html, base) {
  const root = document.createElement('div');
  root.innerHTML = html;
  root.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (!/^([a-z]+:|\/)/i.test(src)) img.src = new URL(src, base).href;
    img.loading = 'lazy';
  });
  return root;
}

const isImageLinkList = (ul) => [...ul.querySelectorAll(':scope > li')]
  .every((li) => li.querySelector('a img'));

/**
 * Sorts the children of a fragment section into content roles by their shape.
 * @param {Element} section top-level fragment section
 */
function classifySectionContent(section) {
  const roles = {
    brand: null, linkLists: [], iconLists: [], texts: [], media: [], scrollTriggers: [],
  };
  [...section.children].forEach((el) => {
    const link = el.querySelector('a');
    const img = el.querySelector('img');
    if (el.tagName === 'UL') {
      (isImageLinkList(el) ? roles.iconLists : roles.linkLists).push(el);
    } else if (link && link.getAttribute('href').startsWith('#')) {
      roles.scrollTriggers.push(el);
    } else if (link && img && !roles.brand) {
      roles.brand = el;
    } else if (img) {
      roles.media.push(el);
    } else {
      roles.texts.push(el);
    }
  });
  return roles;
}

/** Opens links pointing to another origin in a new tab. */
function decorateExternalLinks(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    if (a.origin && a.origin !== window.location.origin) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
  });
}

function createElement(tag, className, children = []) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  children.filter(Boolean).forEach((child) => el.append(child));
  return el;
}

/** Inline arrow icon for the back-to-top control (UI icon, not content). */
function createArrowIcon() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('d', 'M7.5 1v14.5m5-10L7.9.9c-.2-.2-.5-.2-.7 0L2.6 5.5');
  svg.append(path);
  return svg;
}

/**
 * Turns an authored "#top" link into a scroll-to-top button, keeping its text as label.
 * @param {Element} trigger paragraph holding the in-page link
 * @returns {HTMLButtonElement}
 */
function createScrollTopButton(trigger) {
  const label = trigger.textContent.trim();
  const button = createElement('button', 'footer-back-to-top', [createArrowIcon()]);
  button.type = 'button';
  if (label) button.setAttribute('aria-label', label);
  button.addEventListener('click', () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
  return button;
}

/**
 * Builds the footer layout for one fragment section.
 * @param {Element} section top-level fragment section
 * @returns {Element[]} nodes to append to the block
 */
function buildSection(section) {
  const roles = classifySectionContent(section);

  roles.brand?.classList.add('footer-brand');
  roles.linkLists.forEach((ul) => ul.classList.add('footer-links'));
  roles.iconLists.forEach((ul) => ul.classList.add('footer-social'));
  roles.texts.forEach((p) => p.classList.add('footer-legal'));
  roles.media.forEach((p) => p.classList.add('footer-badge'));

  const nav = roles.linkLists.length
    ? createElement('nav', 'footer-menu', roles.linkLists)
    : null;
  const top = createElement('div', 'footer-top', [nav, ...roles.iconLists]);
  const bottom = createElement('div', 'footer-bottom', [...roles.texts, ...roles.media]);
  const main = createElement('div', 'footer-main', [top, bottom]);
  const row = createElement('div', 'footer-row', [roles.brand, main]);
  const inner = createElement('div', 'footer-inner', [row]);

  return [inner, ...roles.scrollTriggers.map(createScrollTopButton)];
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooterFragment();
  block.textContent = '';
  if (!fragment) return;

  const root = parseFragment(fragment.html, fragment.base);
  decorateExternalLinks(root);
  [...root.children]
    .filter((section) => section.tagName === 'DIV')
    .forEach((section) => block.append(...buildSection(section)));
}
