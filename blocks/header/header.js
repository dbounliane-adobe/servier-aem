/*
 * Header block — two-row header (primary bar + utility strip), hover dropdowns,
 * fullscreen search overlay and a smart-sticky primary bar. Below 900px the
 * navigation lives in a fullscreen drawer opened by a hamburger, with in-place
 * accordions (label navigates, chevron expands).
 *
 * All copy, links and images are authored in the nav fragment (nav.plain.html):
 *   section 1: brand link + logo image(s) (first = default, second = on light bg);
 *              images may sit inside the link or next to it (AEM / Universal
 *              Editor image components cannot carry a link)
 *   section 2: optional paragraph (menu button label) + main navigation list
 *              (nested list = dropdown)
 *   section 3: search — link (form action) + icon image (inside or next to the
 *              link), then paragraphs: input placeholder, submit label, close label
 *   section 4: utility lists (first = languages, others = utility links)
 * Images may also be authored as icons (:icon-name: → /icons/icon-name.svg).
 */

import { decorateIcons } from '../../scripts/aem.js';

const DESKTOP = window.matchMedia('(width >= 900px)');
let instanceCount = 0;

/**
 * Nav fragment locations, tried in order. Metadata-independent on purpose:
 * - AEM author / Universal Editor: pages live under /content/<site>/
 * - local aem up: /content/nav.plain.html
 * - DA / EDS preview + publish (AEM paths mapped to the site root): /nav.plain.html
 * @returns {string[]}
 */
function navPaths() {
  const paths = [];
  const { hostname, pathname } = window.location;
  const siteRoot = pathname.match(/^\/content\/[^/]+\//);
  if (siteRoot && hostname.includes('adobeaemcloud')) paths.push(`${siteRoot[0]}nav.plain.html`);
  paths.push('/content/nav.plain.html', '/nav.plain.html');
  return paths;
}

/**
 * Rich-text editors wrap list item text in a paragraph (li > p > a); unwrap it
 * so list items hold their link directly, like the plain fragment.
 */
function unwrapListParagraphs(container) {
  container.querySelectorAll('li > p').forEach((p) => p.replaceWith(...p.childNodes));
}

/**
 * Fetches the nav fragment.
 * @returns {Promise<Element|null>} container holding the fragment sections
 */
async function fetchNav() {
  let resp;
  // eslint-disable-next-line no-restricted-syntax
  for (const path of navPaths()) {
    // eslint-disable-next-line no-await-in-loop
    resp = await fetch(path);
    if (resp.ok) break;
  }
  if (!resp?.ok) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  // relative image paths resolve against the fragment location, not the page
  container.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), resp.url).href;
  });
  decorateIcons(container);
  container.querySelectorAll('span.icon img').forEach((img) => {
    img.removeAttribute('width');
    img.removeAttribute('height');
    // decorative: accessible names come from link titles / authored labels
    img.alt = '';
  });
  unwrapListParagraphs(container);
  return container;
}

function textOf(el) {
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
}

/**
 * Builds the brand link (logo) from the first fragment section.
 */
function buildBrand(section) {
  const source = section?.querySelector('a');
  const brand = document.createElement('a');
  brand.className = 'nav-brand';
  const images = section ? [...section.querySelectorAll('img')] : [];
  if (!source && !images.length) return brand;
  brand.href = source?.getAttribute('href') || '/';
  const label = source?.title || (images.length ? textOf(source) : '');
  if (label) brand.setAttribute('aria-label', label);
  images.forEach((img, i) => {
    img.classList.add('nav-logo', i === 0 ? 'nav-logo-default' : 'nav-logo-alt');
    img.loading = 'eager';
    if (i > 0) img.alt = '';
    brand.append(img);
  });
  if (!images.length) brand.textContent = textOf(source);
  return brand;
}

function setExpanded(toggle, expanded) {
  toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
}

/**
 * Builds the main navigation: top-level links, hover dropdowns (desktop) and
 * chevron toggles for the mobile accordions.
 */
function buildSections(section) {
  const nav = document.createElement('nav');
  nav.className = 'nav-sections';
  const list = section?.querySelector('ul');
  if (!list) return nav;
  list.className = 'nav-list';
  [...list.children].forEach((item, i) => {
    item.className = 'nav-item';
    const link = item.querySelector(':scope > a');
    if (link) link.className = 'nav-link';
    const sub = item.querySelector(':scope > ul');
    if (!sub) return;
    item.classList.add('nav-drop');
    sub.className = 'nav-submenu';
    sub.id = `nav-submenu-${instanceCount}-${i}`;
    sub.querySelectorAll(':scope > li > a').forEach((a) => { a.className = 'nav-submenu-link'; });
    if (link) link.setAttribute('aria-haspopup', 'true');

    const chevron = document.createElement('button');
    chevron.type = 'button';
    chevron.className = 'nav-chevron';
    chevron.setAttribute('aria-controls', sub.id);
    chevron.setAttribute('aria-label', textOf(link));
    setExpanded(chevron, false);
    chevron.addEventListener('click', () => {
      setExpanded(chevron, chevron.getAttribute('aria-expanded') !== 'true');
    });
    sub.before(chevron);
  });
  nav.append(list);
  return nav;
}

function closeSearch(overlay, toggle) {
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.inert = true;
  toggle.setAttribute('aria-expanded', 'false');
}

/**
 * Builds the search toggle + fullscreen search overlay from the third section.
 * @returns {{ tools: Element, overlay: Element|null }}
 */
function buildSearch(section) {
  const tools = document.createElement('div');
  tools.className = 'nav-tools';
  const link = section?.querySelector('a');
  if (!link) return { tools, overlay: null };

  const [placeholder, submitLabel, closeLabel] = [...section.querySelectorAll('p')]
    .filter((p) => !p.querySelector('a, img'))
    .map(textOf);
  const icon = link.querySelector('img') || section.querySelector('img');
  const action = new URL(link.getAttribute('href'), window.location.href);
  const paramName = [...action.searchParams.keys()][0] || 'q';
  action.search = '';

  const overlayId = `nav-search-${instanceCount}`;

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-search-toggle';
  toggle.setAttribute('aria-label', icon?.alt || link.title || submitLabel || '');
  toggle.setAttribute('aria-controls', overlayId);
  toggle.setAttribute('aria-expanded', 'false');
  if (icon) {
    const toggleIcon = icon.cloneNode();
    toggleIcon.alt = '';
    toggle.append(toggleIcon);
  }
  tools.append(toggle);

  const overlay = document.createElement('div');
  overlay.className = 'nav-search';
  overlay.id = overlayId;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', submitLabel || placeholder || '');

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'nav-search-close';
  close.setAttribute('aria-label', closeLabel || '');

  const form = document.createElement('form');
  form.className = 'nav-search-form';
  form.setAttribute('role', 'search');
  form.method = 'get';
  form.action = action.href;

  const label = document.createElement('label');
  const labelText = document.createElement('span');
  labelText.className = 'nav-search-label';
  labelText.textContent = submitLabel || placeholder || '';
  const input = document.createElement('input');
  input.type = 'search';
  input.name = paramName;
  input.autocomplete = 'off';
  input.placeholder = placeholder || '';
  label.append(labelText, input);

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'nav-search-submit';
  submit.setAttribute('aria-label', submitLabel || '');
  if (icon) {
    const submitIcon = icon.cloneNode();
    submitIcon.alt = '';
    submit.append(submitIcon);
  }
  form.append(label, submit);
  overlay.append(close, form);
  closeSearch(overlay, toggle);

  toggle.addEventListener('click', () => {
    overlay.inert = false;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    window.requestAnimationFrame(() => input.focus());
  });
  close.addEventListener('click', () => {
    closeSearch(overlay, toggle);
    toggle.focus();
  });
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSearch(overlay, toggle);
      toggle.focus();
    }
  });
  return { tools, overlay };
}

/**
 * Builds the utility nav (language links + utility links) from the fourth section.
 */
function buildUtility(section) {
  const nav = document.createElement('nav');
  nav.className = 'nav-secondary';
  const lists = section ? [...section.querySelectorAll(':scope > ul')] : [];
  const pageLang = (document.documentElement.lang || '').toLowerCase().split('-')[0];
  lists.forEach((list, i) => {
    const isLang = i === 0 && lists.length > 1;
    list.className = isLang ? 'nav-lang' : 'nav-utility-links';
    list.querySelectorAll(':scope > li > a').forEach((a) => {
      a.className = isLang ? 'nav-lang-link' : 'nav-utility-link';
      if (!isLang) return;
      const code = (a.getAttribute('hreflang') || textOf(a)).toLowerCase();
      if (code === pageLang) {
        a.setAttribute('aria-current', 'true');
        a.parentElement.classList.add('is-current');
      }
    });
    nav.append(list);
  });
  return nav;
}

/**
 * Builds the hamburger button (three bars morphing into a cross).
 */
function buildHamburger(label, drawerId) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'nav-hamburger';
  button.setAttribute('aria-controls', drawerId);
  if (label) button.setAttribute('aria-label', label);
  setExpanded(button, false);
  const lines = document.createElement('span');
  lines.className = 'nav-hamburger-lines';
  lines.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 3; i += 1) lines.append(document.createElement('span'));
  button.append(lines);
  return button;
}

/**
 * Smart-sticky primary bar: once the page is scrolled past the header, the bar
 * is pinned (hidden); scrolling up reveals it, scrolling down hides it again.
 */
function initSticky(wrapper) {
  let lastY = window.scrollY;
  let ticking = false;
  const update = () => {
    ticking = false;
    if (wrapper.classList.contains('is-menu-open')) return;
    const y = window.scrollY;
    const threshold = wrapper.offsetHeight;
    if (y <= 0) {
      wrapper.classList.remove('is-sticky', 'is-sticky-visible');
    } else {
      if (y > threshold) wrapper.classList.add('is-sticky');
      // once pinned, scrolling up reveals the bar even within the header zone
      // (short pages would otherwise show an empty header slot)
      if (wrapper.classList.contains('is-sticky')) {
        wrapper.classList.toggle('is-sticky-visible', y < lastY);
      }
    }
    lastY = y;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }, { passive: true });
  update();
}

/**
 * The header overlays the page (transparent, light text) only when the first
 * section is a hero; otherwise it renders on a solid background.
 */
function hasHeroFirst() {
  const first = document.querySelector('main > .section');
  // full-screen heroes only (homepage campaign hero, boilerplate hero) — not the
  // newsroom page banner (hero-page-banner), which sits below a solid header
  return !!first?.querySelector('.campaign-hero, .hero');
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  block.textContent = '';
  if (!fragment) return;
  instanceCount += 1;

  const [brandSection, navSection, searchSection, utilitySection] = [...fragment.children];
  const menuLabel = textOf(navSection?.querySelector(':scope > p'));

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-wrapper';

  const primary = document.createElement('div');
  primary.className = 'nav-primary';
  const bar = document.createElement('div');
  bar.className = 'nav-bar';
  const main = document.createElement('div');
  main.className = 'nav-main';
  main.id = `nav-main-${instanceCount}`;
  const { tools, overlay } = buildSearch(searchSection);
  main.append(buildSections(navSection), tools);
  const hamburger = buildHamburger(menuLabel, main.id);
  bar.append(buildBrand(brandSection), hamburger, main);
  primary.append(bar);

  const utility = document.createElement('div');
  utility.className = 'nav-utility';
  const secondary = buildUtility(utilitySection);
  utility.append(secondary);

  wrapper.append(primary, utility);
  if (overlay) wrapper.append(overlay);
  block.append(wrapper);

  const header = block.closest('header');
  if (hasHeroFirst()) {
    wrapper.classList.add('is-overlay');
    header?.classList.add('header-overlay');
  }

  const searchToggle = tools.querySelector('.nav-search-toggle');

  const toggleMenu = (open) => {
    const isOpen = open && !DESKTOP.matches;
    wrapper.classList.toggle('is-menu-open', isOpen);
    setExpanded(hamburger, isOpen);
    main.inert = !isOpen && !DESKTOP.matches;
    document.body.style.overflowY = isOpen ? 'hidden' : '';
  };

  // the utility nav sits in the drawer on mobile and in its own row on desktop
  const placeUtility = () => {
    if (DESKTOP.matches) utility.append(secondary);
    else tools.before(secondary);
  };

  hamburger.addEventListener('click', () => {
    toggleMenu(hamburger.getAttribute('aria-expanded') !== 'true');
  });

  wrapper.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (wrapper.classList.contains('is-menu-open')) {
      toggleMenu(false);
      hamburger.focus();
      return;
    }
    // desktop: close an open dropdown for keyboard users
    const item = document.activeElement?.closest('.nav-drop');
    if (item) {
      item.querySelector('.nav-link')?.focus();
      item.classList.add('is-dismissed');
    }
  });
  bar.addEventListener('focusout', (e) => {
    if (!e.relatedTarget?.closest('.nav-drop.is-dismissed')) {
      bar.querySelectorAll('.is-dismissed').forEach((el) => el.classList.remove('is-dismissed'));
    }
  });
  bar.addEventListener('mouseleave', () => {
    bar.querySelectorAll('.is-dismissed').forEach((el) => el.classList.remove('is-dismissed'));
  });

  // the search overlay opened from the drawer replaces the drawer
  searchToggle?.addEventListener('click', () => {
    if (wrapper.classList.contains('is-menu-open')) toggleMenu(false);
  });

  const onViewportChange = () => {
    toggleMenu(false);
    main.querySelectorAll('.nav-chevron').forEach((chevron) => setExpanded(chevron, false));
    if (overlay?.classList.contains('is-open')) closeSearch(overlay, searchToggle);
    placeUtility();
  };
  DESKTOP.addEventListener('change', onViewportChange);
  onViewportChange();

  initSticky(wrapper);
}
