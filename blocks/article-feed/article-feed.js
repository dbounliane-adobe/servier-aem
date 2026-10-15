import { readBlockConfig, createOptimizedPicture } from '../../scripts/aem.js';
import { createDate } from '../../scripts/block-utils.js';

export async function loadArticles(source) {
  const url = new URL(source, window.location.href);
  if (url.origin !== window.location.origin) throw new Error('Article index must belong to this site.');
  const records = [];
  let offset = 0;
  let more = true;
  while (more) {
    url.searchParams.set('offset', offset);
    url.searchParams.set('limit', 500);
    // eslint-disable-next-line no-await-in-loop
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Article index returned HTTP ${response.status}.`);
    // eslint-disable-next-line no-await-in-loop
    const page = await response.json();
    if (!Array.isArray(page.data)) throw new Error('Article index is missing its data array.');
    if (page.data.some((record) => !record || typeof record.path !== 'string'
      || typeof record.title !== 'string')) throw new Error('Article index contains an invalid record.');
    records.push(...page.data);
    offset += page.data.length;
    more = Number.isInteger(page.total) && offset < page.total;
    if (more && !page.data.length) throw new Error('Article index pagination did not advance.');
  }
  return records;
}

/**
 * Optional sub-category tags: a JSON array string (index default) or a comma-separated list.
 * @param {*} value raw index value
 * @returns {string[]}
 */
function parseTags(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  const text = String(value || '').trim();
  if (!text) return [];
  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch { /* fall through to comma list */ }
  }
  return text.split(',').map((tag) => tag.trim()).filter(Boolean);
}

function createCard(record) {
  const item = document.createElement('li');
  const article = document.createElement('article');
  if (record.image) {
    article.append(createOptimizedPicture(record.image, record.imageAlt || '', false, [
      { width: '600' },
    ]));
  }
  const content = document.createElement('div');
  content.className = 'article-feed-content';
  if (record.category) {
    const category = document.createElement('p');
    category.className = 'article-feed-category';
    category.textContent = record.category;
    content.append(category);
  }
  const tags = parseTags(record.tags);
  if (tags.length) {
    const list = document.createElement('p');
    list.className = 'article-feed-tags';
    tags.forEach((tag) => {
      const label = document.createElement('span');
      label.textContent = tag;
      list.append(label);
    });
    content.append(list);
  }
  const heading = document.createElement('h3');
  const link = document.createElement('a');
  link.href = record.path;
  link.textContent = record.title;
  heading.append(link);
  content.append(heading);
  if (record.date) content.append(createDate(record.date));
  article.append(content);
  item.append(article);
  return item;
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const french = document.documentElement.lang.startsWith('fr');
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  status.textContent = french ? 'Chargement des articles…' : 'Loading articles…';
  block.replaceChildren(status);
  try {
    const limit = Number(config.limit || 3);
    if (!Number.isInteger(limit) || limit < 1) throw new Error('Article limit must be a positive integer.');
    const records = await loadArticles(config.source || '/query-index.json');
    const prefixURL = new URL(config.prefix || '/newsroom/', window.location.href);
    if (prefixURL.origin !== window.location.origin) throw new Error('Article prefix must belong to this site.');
    const prefix = `${prefixURL.pathname.replace(/\/+$/, '')}/`;
    const articles = records.filter((record) => {
      const url = new URL(record.path, window.location.href);
      return url.origin === window.location.origin && url.pathname.startsWith(prefix)
        && !String(record.robots || '').includes('noindex')
        && (!config.category || record.category === config.category);
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const list = document.createElement('ul');
    list.className = 'article-feed-list';
    const filters = document.createElement('div');
    filters.className = 'article-feed-filters';
    filters.setAttribute('role', 'group');
    filters.setAttribute('aria-label', french ? 'Catégories des articles' : 'Article categories');
    const render = (category) => {
      const selected = articles.filter((record) => !category || record.category === category);
      list.replaceChildren(...selected.slice(0, limit).map(createCard));
      status.textContent = selected.length ? '' : (config.empty || (french ? 'Aucun article publié.' : 'No published articles.'));
      filters.querySelectorAll('button').forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.category === category));
      });
    };
    const categories = ['', ...[...new Set(articles.map((record) => record.category).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, document.documentElement.lang || 'fr'))];
    categories.forEach((category) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.category = category;
      button.textContent = category || config.all || (french ? 'Toutes les catégories' : 'All categories');
      button.addEventListener('click', () => render(category));
      filters.append(button);
    });
    block.replaceChildren(filters, list, status);
    render('');
  } catch (error) {
    status.textContent = config.error || (french ? 'Les articles sont indisponibles pour le moment.' : 'Articles are currently unavailable.');
    status.setAttribute('role', 'alert');
    // eslint-disable-next-line no-console
    console.error('Article feed failed', error);
  }
}
