import { readBlockConfig, createOptimizedPicture } from '../../scripts/aem.js';

/* Article list: filterable, paginated listing rendered from the site query index.
   Authored as a key-value config block; every record is data, nothing is retyped by authors. */

/* Filters always render in the source order (sub-category, year, month, tags);
   the authored list only enables or disables them. */
const SUPPORTED_FILTERS = ['category', 'year', 'month', 'tags'];
const INDEX_CHUNK = 500;
const MAX_INDEX_REQUESTS = 50;

/* Month labels as displayed by the source filter (servier.com/newsroom/dossiers/). */
const MONTHS_FR = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEP', 'OCT', 'NOV', 'DÉC'];
const MONTHS_EN = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const LABELS = {
  fr: {
    filterlabel: 'Filtrer',
    categorylabel: 'Sous-catégorie',
    yearlabel: 'Année',
    monthlabel: 'Mois',
    tagslabel: 'Étiquettes',
    submitlabel: 'Filtrer',
    resetlabel: 'Réinitialiser',
    readmore: 'Lire la suite',
    subscribelabel: "Je m'abonne",
    empty: 'Aucun article publié pour le moment.',
    noresults: 'Aucun article ne correspond à vos critères.',
    error: 'Les articles sont indisponibles pour le moment.',
    results: '{count} article(s)',
    loading: 'Chargement des articles…',
    pagination: 'Pagination',
    page: 'Page {page}',
    previous: 'Page précédente',
    next: 'Page suivante',
  },
  en: {
    filterlabel: 'Filter',
    categorylabel: 'Sub-category',
    yearlabel: 'Year',
    monthlabel: 'Month',
    tagslabel: 'Tags',
    submitlabel: 'Filter',
    resetlabel: 'Reset',
    readmore: 'Read more',
    subscribelabel: 'Subscribe',
    empty: 'No published articles yet.',
    noresults: 'No articles match your criteria.',
    error: 'Articles are currently unavailable.',
    results: '{count} article(s)',
    loading: 'Loading articles…',
    pagination: 'Pagination',
    page: 'Page {page}',
    previous: 'Previous page',
    next: 'Next page',
  },
};

const indexCache = new Map();

/**
 * Fetches every record of a same-origin query index, following offset/limit pagination.
 * @param {string} source index URL
 * @returns {Promise<object[]>}
 */
function loadIndex(source) {
  const url = new URL(source, window.location.href);
  if (url.origin !== window.location.origin) {
    return Promise.reject(new Error('Article index must belong to this site.'));
  }
  const key = `${url.pathname}${url.search}`;
  if (!indexCache.has(key)) {
    const promise = (async () => {
      const records = [];
      let offset = 0;
      for (let request = 0; request < MAX_INDEX_REQUESTS; request += 1) {
        url.searchParams.set('offset', offset);
        url.searchParams.set('limit', INDEX_CHUNK);
        // eslint-disable-next-line no-await-in-loop
        const response = await fetch(url);
        if (response.status === 404) return records;
        if (!response.ok) throw new Error(`Article index returned HTTP ${response.status}.`);
        // eslint-disable-next-line no-await-in-loop
        const json = await response.json();
        const data = Array.isArray(json?.data) ? json.data : [];
        records.push(...data);
        offset += data.length;
        const total = Number(json?.total);
        if (!data.length || !Number.isFinite(total) || offset >= total) return records;
      }
      return records;
    })();
    indexCache.set(key, promise);
    promise.catch(() => indexCache.delete(key));
  }
  return indexCache.get(key);
}

/**
 * Parses an index date: ISO/date string, Unix seconds or milliseconds.
 * @param {*} value raw index value
 * @returns {Date|null}
 */
function parseDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const text = String(value).trim();
  let date;
  if (/^\d+(\.\d+)?$/.test(text)) {
    const number = Number(text);
    date = new Date(number < 1e11 ? number * 1000 : number);
  } else {
    date = new Date(text);
  }
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Optional tags: array, JSON array string or comma-separated list.
 * @param {*} value raw index value
 * @returns {string[]}
 */
function parseList(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  const text = String(value ?? '').trim();
  if (!text) return [];
  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.map((v) => String(v).trim()).filter(Boolean);
    } catch { /* fall back to a comma list */ }
  }
  return text.split(',').map((v) => v.trim()).filter(Boolean);
}

function normalizePath(pathname) {
  return pathname.replace(/\/index(\.html)?$/, '/').replace(/\.html$/, '').replace(/\/+$/, '') || '/';
}

function toText(value) {
  return Array.isArray(value) ? value.join(' ') : String(value ?? '').trim();
}

/**
 * Maps raw index records to listing entries under the prefix, newest first.
 */
function prepareArticles(records, prefix) {
  const prefixPath = normalizePath(new URL(prefix || '/', window.location.href).pathname);
  const listingPaths = new Set([prefixPath, normalizePath(window.location.pathname)]);
  const seen = new Set();
  return records.map((record) => {
    if (!record || typeof record.path !== 'string' || !record.title) return null;
    const url = new URL(record.path, window.location.href);
    if (url.origin !== window.location.origin) return null;
    const path = normalizePath(url.pathname);
    if (listingPaths.has(path) || seen.has(path)) return null;
    if (prefixPath !== '/' && !path.startsWith(`${prefixPath}/`)) return null;
    if (String(record.robots || '').toLowerCase().includes('noindex')) return null;
    seen.add(path);
    const date = parseDate(record.date) || parseDate(record.publicationDate);
    return {
      href: record.path,
      title: String(record.title).trim(),
      image: record.image && !String(record.image).includes('default-meta-image') ? record.image : '',
      imageAlt: record.imageAlt || '',
      category: String(record.category || '').trim(),
      tags: parseList(record.tags),
      date,
      year: date ? String(date.getUTCFullYear()) : '',
      month: date ? String(date.getUTCMonth() + 1) : '',
    };
  }).filter(Boolean)
    .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
}

function formatDate(date, lang) {
  return new Intl.DateTimeFormat(lang, {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(date);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function createImage(src, alt) {
  const url = new URL(src, window.location.href);
  if (url.origin === window.location.origin) {
    return createOptimizedPicture(url.pathname, alt, false, [{ media: '(min-width: 600px)', width: '750' }, { width: '600' }]);
  }
  const img = el('img');
  img.src = url.href;
  img.alt = alt;
  img.loading = 'lazy';
  return img;
}

/** Category slug used by the stylesheet to pick the category colour. */
function slugify(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const MORE_ICON = '<svg viewBox="0 0 17 17" aria-hidden="true" focusable="false"><path d="M8.635.703v15.324m7.662-7.662H.973" stroke="currentColor" stroke-width=".719" fill="none"/></svg>';

function createCard(article, labels, lang) {
  const item = el('li');
  const card = el('article', 'article-list-card');
  if (article.category) card.dataset.category = slugify(article.category);

  const media = el('div', 'article-list-media');
  if (article.image) media.append(createImage(article.image, article.imageAlt));
  if (article.category) media.append(el('span', 'article-list-category', article.category));
  card.append(media);

  const body = el('div', 'article-list-body');
  if (article.date) {
    const time = el('time', 'article-list-date', formatDate(article.date, lang));
    time.dateTime = article.date.toISOString().slice(0, 10);
    body.append(time);
  }
  const title = el('h3', 'article-list-title', article.title);
  body.append(title);
  if (article.tags.length) {
    const tags = el('ul', 'article-list-tags');
    article.tags.forEach((tag) => tags.append(el('li', 'article-list-tag', tag)));
    body.append(tags);
  }
  card.append(body);

  const link = el('a', 'article-list-more');
  link.href = article.href;
  link.setAttribute('aria-label', `${labels.readmore} : ${article.title}`);
  link.innerHTML = MORE_ICON;
  card.append(link);

  item.append(card);
  return item;
}

/** Page numbers to show: first, last and a window of two around the current page. */
function pageSequence(current, total) {
  const pages = [];
  for (let page = 1; page <= total; page += 1) {
    if (page === 1 || page === total || Math.abs(page - current) <= 2) {
      if (pages.length && page - pages[pages.length - 1] > 1) pages.push('…');
      pages.push(page);
    }
  }
  return pages;
}

function readState(filters) {
  const params = new URLSearchParams(window.location.search);
  const state = { page: Math.max(1, parseInt(params.get('page'), 10) || 1) };
  filters.forEach((name) => {
    state[name] = params.getAll(name).flatMap((v) => v.split(',')).map((v) => v.trim()).filter(Boolean);
  });
  return state;
}

function stateToSearch(state, filters) {
  const params = new URLSearchParams(window.location.search);
  ['page', ...filters].forEach((name) => params.delete(name));
  filters.forEach((name) => state[name].forEach((value) => params.append(name, value)));
  if (state.page > 1) params.set('page', state.page);
  const search = params.toString();
  return search ? `?${search}` : '';
}

function matches(article, state, filters) {
  return filters.every((name) => {
    const selected = state[name];
    if (!selected.length) return true;
    if (name === 'tags') return article.tags.some((tag) => selected.includes(tag));
    return selected.includes(article[name]);
  });
}

function uniqueSorted(values, compare) {
  return [...new Set(values.filter(Boolean))].sort(compare);
}

/**
 * Builds the filter form. Category and tags are multi-choice checkbox groups,
 * year and month are single-choice selects; options come from the data.
 */
function buildFilters(articles, filters, labels, lang, id) {
  const form = el('form', 'article-list-filters');
  form.setAttribute('role', 'search');
  form.setAttribute('aria-label', labels.filterlabel);
  form.noValidate = true;
  form.append(el('span', 'article-list-filters-label', labels.filterlabel));
  form.firstChild.setAttribute('aria-hidden', 'true');

  const controls = el('div', 'article-list-controls');
  const months = lang.startsWith('fr') ? MONTHS_FR : MONTHS_EN;
  const collator = new Intl.Collator(lang);

  filters.forEach((name) => {
    if (name === 'category' || name === 'tags') {
      const values = uniqueSorted(
        articles.flatMap((a) => (name === 'tags' ? a.tags : [a.category])),
        collator.compare,
      );
      if (!values.length) return;
      const label = name === 'tags' ? labels.tagslabel : labels.categorylabel;
      const details = el('details', `article-list-filter article-list-filter-${name}`);
      const summary = el('summary', '', label);
      const caret = el('span', 'article-list-caret');
      caret.setAttribute('aria-hidden', 'true');
      summary.append(caret);
      details.append(summary);
      const fieldset = el('fieldset');
      fieldset.append(el('legend', 'article-list-sr', label));
      values.forEach((value, index) => {
        const inputId = `${id}-${name}-${index}`;
        const wrapper = el('div', 'article-list-option');
        const input = el('input');
        input.type = 'checkbox';
        input.name = name;
        input.value = value;
        input.id = inputId;
        const text = el('label', '', value);
        text.htmlFor = inputId;
        wrapper.append(input, text);
        fieldset.append(wrapper);
      });
      details.append(fieldset);
      controls.append(details);
      return;
    }
    const values = name === 'year'
      ? uniqueSorted(articles.map((a) => a.year), (a, b) => Number(b) - Number(a))
      : uniqueSorted(articles.map((a) => a.month), (a, b) => Number(b) - Number(a));
    if (!values.length) return;
    const label = name === 'year' ? labels.yearlabel : labels.monthlabel;
    const wrapper = el('div', `article-list-filter article-list-filter-${name}`);
    const selectId = `${id}-${name}`;
    const labelEl = el('label', 'article-list-sr', label);
    labelEl.htmlFor = selectId;
    const select = el('select');
    select.id = selectId;
    select.name = name;
    const placeholder = el('option', '', label);
    placeholder.value = '';
    select.append(placeholder);
    values.forEach((value) => {
      const option = el('option', '', name === 'month' ? months[Number(value) - 1] : value);
      option.value = value;
      select.append(option);
    });
    wrapper.append(labelEl, select);
    controls.append(wrapper);
  });

  const submit = el('button', 'article-list-submit', labels.submitlabel);
  submit.type = 'submit';
  const reset = el('button', 'article-list-reset', labels.resetlabel);
  reset.type = 'button';
  controls.append(submit, reset);
  form.append(controls);
  return form;
}

function syncForm(form, state, filters) {
  if (!form) return;
  filters.forEach((name) => {
    form.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
      input.checked = state[name].includes(input.value);
    });
    const select = form.querySelector(`select[name="${name}"]`);
    if (select) {
      const value = state[name][0] || '';
      select.value = [...select.options].some((o) => o.value === value) ? value : '';
    }
  });
  const active = filters.some((name) => state[name].length);
  form.querySelector('.article-list-reset').hidden = !active;
}

function formToState(form, filters) {
  const data = new FormData(form);
  const state = { page: 1 };
  filters.forEach((name) => {
    state[name] = data.getAll(name).map(String).filter(Boolean);
  });
  return state;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  const lang = document.documentElement.lang || 'fr';
  const defaults = lang.startsWith('en') ? LABELS.en : LABELS.fr;
  const labels = { ...defaults };
  Object.keys(defaults).forEach((key) => {
    const value = toText(config[key]);
    if (value) labels[key] = value;
  });

  const id = `article-list-${Math.random().toString(36).slice(2, 8)}`;
  const status = el('p', 'article-list-status', labels.loading);
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  block.replaceChildren(status);

  const pageSize = Math.max(1, parseInt(toText(config.pagesize), 10) || 9);
  const requested = toText(config.filters || SUPPORTED_FILTERS.join(','))
    .split(',').map((f) => f.trim().toLowerCase()).filter((f) => SUPPORTED_FILTERS.includes(f));
  const filters = SUPPORTED_FILTERS.filter((name) => requested.includes(name));

  let articles;
  try {
    articles = prepareArticles(
      await loadIndex(toText(config.source) || '/query-index.json'),
      toText(config.prefix) || '/newsroom/',
    );
  } catch (error) {
    status.textContent = labels.error;
    status.setAttribute('role', 'alert');
    status.removeAttribute('aria-live');
    // eslint-disable-next-line no-console
    console.error('Article list failed', error);
    return;
  }

  const toolbar = el('div', 'article-list-toolbar');
  const subscribe = toText(config.subscribe);
  if (subscribe) {
    const link = el('a', 'article-list-subscribe', labels.subscribelabel);
    link.href = subscribe;
    toolbar.append(link);
  }

  if (!articles.length) {
    status.textContent = labels.empty;
    block.replaceChildren(...(toolbar.children.length ? [toolbar] : []), status);
    return;
  }

  const form = filters.length ? buildFilters(articles, filters, labels, lang, id) : null;
  if (form) toolbar.prepend(form);

  const results = el('div', 'article-list-results');
  results.tabIndex = -1;
  const list = el('ul', 'article-list-grid');
  results.append(list);
  const nav = el('nav', 'article-list-pagination');
  nav.setAttribute('aria-label', labels.pagination);

  block.replaceChildren(...(toolbar.children.length ? [toolbar] : []), status, results, nav);

  let state = readState(filters);

  const render = () => {
    syncForm(form, state, filters);
    const selected = articles.filter((article) => matches(article, state, filters));
    const totalPages = Math.max(1, Math.ceil(selected.length / pageSize));
    if (state.page > totalPages) state.page = totalPages;
    const start = (state.page - 1) * pageSize;
    list.replaceChildren(...selected.slice(start, start + pageSize)
      .map((article) => createCard(article, labels, lang)));
    status.textContent = selected.length
      ? labels.results.replace('{count}', selected.length)
      : labels.noresults;
    block.classList.toggle('is-empty', !selected.length);

    nav.replaceChildren();
    nav.hidden = totalPages < 2;
    if (totalPages < 2) return;
    const ul = el('ul');
    const pageLink = (page, text, className, ariaLabel) => {
      const li = el('li');
      const a = el('a', className, text);
      a.href = stateToSearch({ ...state, page }, filters) || window.location.pathname;
      a.dataset.page = page;
      if (ariaLabel) a.setAttribute('aria-label', ariaLabel);
      if (page === state.page && !className) a.setAttribute('aria-current', 'page');
      li.append(a);
      return li;
    };
    if (state.page > 1) ul.append(pageLink(state.page - 1, '<', 'article-list-prev', labels.previous));
    pageSequence(state.page, totalPages).forEach((page) => {
      if (page === '…') {
        const li = el('li', 'article-list-ellipsis', '…');
        li.setAttribute('aria-hidden', 'true');
        ul.append(li);
      } else {
        ul.append(pageLink(page, String(page), '', labels.page.replace('{page}', page)));
      }
    });
    if (state.page < totalPages) ul.append(pageLink(state.page + 1, '>', 'article-list-next', labels.next));
    nav.append(ul);
  };

  const navigate = (next, focusResults) => {
    state = next;
    const search = stateToSearch(state, filters);
    window.history.pushState({ articleList: true }, '', `${window.location.pathname}${search}${window.location.hash}`);
    render();
    if (focusResults) {
      results.focus({ preventScroll: true });
      block.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  nav.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-page]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    navigate({ ...state, page: Number(link.dataset.page) }, true);
  });

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      form.querySelectorAll('details[open]').forEach((details) => { details.open = false; });
      navigate(formToState(form, filters), false);
    });
    form.querySelector('.article-list-reset').addEventListener('click', () => {
      const cleared = { page: 1 };
      filters.forEach((name) => { cleared[name] = []; });
      navigate(cleared, false);
      form.querySelector('.article-list-submit').focus();
    });
    form.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const details = event.target.closest('details[open]');
      if (details) {
        details.open = false;
        details.querySelector('summary').focus();
      }
    });
    document.addEventListener('click', (event) => {
      form.querySelectorAll('details[open]').forEach((details) => {
        if (!details.contains(event.target)) details.open = false;
      });
    });
  }

  window.addEventListener('popstate', () => {
    state = readState(filters);
    render();
  });

  render();
}
