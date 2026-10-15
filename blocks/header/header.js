/*
 * Header block — two-row header (primary bar + utility strip), hover dropdowns,
 * fullscreen search overlay and a smart-sticky primary bar.
 *
 * All copy, links and images are authored in the nav fragment (nav.plain.html):
 *   section 1: brand link with logo image(s) (first = default, second = on light bg)
 *   section 2: main navigation list (nested list = dropdown)
 *   section 3: search — link (form action) wrapping the icon, then paragraphs:
 *              input placeholder, submit label, close label
 *   section 4: utility lists (first = languages, others = utility links)
 */

const DESKTOP = window.matchMedia('(width >= 900px)');
let searchCount = 0;

/**
 * Fetches the nav fragment. Metadata-independent on purpose: /content first
 * (local aem up), then the site root (DA / EDS preview + publish).
 * @returns {Promise<Element|null>} container holding the fragment sections
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  // relative image paths resolve against the fragment location, not the page
  container.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), resp.url).href;
  });
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
  if (!source) return brand;
  brand.href = source.getAttribute('href');
  if (source.title) brand.setAttribute('aria-label', source.title);
  const images = [...source.querySelectorAll('img')];
  images.forEach((img, i) => {
    img.classList.add('nav-logo', i === 0 ? 'nav-logo-default' : 'nav-logo-alt');
    img.loading = 'eager';
    if (i > 0) img.alt = '';
    brand.append(img);
  });
  if (!images.length) brand.textContent = textOf(source);
  return brand;
}

/**
 * Builds the main navigation (top-level links + hover dropdowns).
 */
function buildSections(section) {
  const nav = document.createElement('nav');
  nav.className = 'nav-sections';
  const list = section?.querySelector('ul');
  if (!list) return nav;
  list.className = 'nav-list';
  [...list.children].forEach((item) => {
    item.className = 'nav-item';
    const link = item.querySelector(':scope > a');
    if (link) link.className = 'nav-link';
    const sub = item.querySelector(':scope > ul');
    if (sub) {
      item.classList.add('nav-drop');
      sub.className = 'nav-submenu';
      sub.querySelectorAll(':scope > li > a').forEach((a) => { a.className = 'nav-submenu-link'; });
      if (link) link.setAttribute('aria-haspopup', 'true');
    }
  });
  nav.append(list);
  return nav;
}

function closeSearch(overlay, toggle) {
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.inert = true;
  toggle.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('nav-search-open');
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
  const icon = link.querySelector('img');
  const action = new URL(link.getAttribute('href'), window.location.href);
  const paramName = [...action.searchParams.keys()][0] || 'q';
  action.search = '';

  searchCount += 1;
  const overlayId = `nav-search-${searchCount}`;

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
    document.body.classList.add('nav-search-open');
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
 * Builds the utility strip (language links + utility links) from the fourth section.
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
 * Smart-sticky primary bar: once the page is scrolled past the header, the bar
 * is pinned (hidden); scrolling up reveals it, scrolling down hides it again.
 */
function initSticky(wrapper) {
  let lastY = window.scrollY;
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = window.scrollY;
    const threshold = wrapper.offsetHeight;
    if (y <= 0) {
      wrapper.classList.remove('is-sticky', 'is-sticky-visible');
    } else if (y > threshold) {
      wrapper.classList.add('is-sticky');
      wrapper.classList.toggle('is-sticky-visible', y < lastY);
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
  return !!first?.querySelector('[class*="hero"]');
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  block.textContent = '';
  if (!fragment) return;

  const [brandSection, navSection, searchSection, utilitySection] = [...fragment.children];

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-wrapper';

  const primary = document.createElement('div');
  primary.className = 'nav-primary';
  const bar = document.createElement('div');
  bar.className = 'nav-bar';
  const menu = document.createElement('div');
  menu.className = 'nav-menu';
  const { tools, overlay } = buildSearch(searchSection);
  menu.append(buildSections(navSection), tools);
  bar.append(buildBrand(brandSection), menu);
  primary.append(bar);

  const utility = document.createElement('div');
  utility.className = 'nav-utility';
  utility.append(buildUtility(utilitySection));

  wrapper.append(primary, utility);
  if (overlay) wrapper.append(overlay);
  block.append(wrapper);

  const header = block.closest('header');
  if (hasHeroFirst()) {
    wrapper.classList.add('is-overlay');
    header?.classList.add('header-overlay');
  }

  // close an open dropdown on Escape (keyboard users)
  bar.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const item = document.activeElement?.closest('.nav-drop');
    if (item) item.querySelector('.nav-link')?.focus();
    item?.classList.add('is-dismissed');
  });
  bar.addEventListener('focusout', (e) => {
    if (!e.relatedTarget?.closest('.nav-drop.is-dismissed')) {
      bar.querySelectorAll('.is-dismissed').forEach((el) => el.classList.remove('is-dismissed'));
    }
  });
  bar.addEventListener('mouseleave', () => {
    bar.querySelectorAll('.is-dismissed').forEach((el) => el.classList.remove('is-dismissed'));
  });

  initSticky(wrapper);
  DESKTOP.addEventListener('change', () => {
    if (overlay?.classList.contains('is-open')) {
      closeSearch(overlay, tools.querySelector('.nav-search-toggle'));
    }
  });
}
