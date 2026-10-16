/**
 * COMEX members grid.
 *
 * Authored config (key-value rows):
 *   members        ordered list of member references (UE aem-content multi field):
 *                  CF page URLs (/groupe/comex/<slug>) or CF paths
 *                  (/content/dam/<site>/comex/<slug>, mapped to /groupe/comex/<slug>)
 *   readmore       optional "En savoir plus" label
 *   linkedinlabel  optional LinkedIn link label ("Logo de LinkedIn")
 *
 * Each member page is fetched as <path>.plain.html (in parallel, authored order
 * kept) and its comex-profile rows are read with parseComexProfile. On the AEM
 * author host (no overlay rendering there) the CF JSON of the Assets HTTP API,
 * the overlay's own data source, is read instead. See README.md.
 */
import { createOptimizedPicture } from '../../scripts/aem.js';
import { parseComexProfile, buildLinkedinLink } from '../comex-profile/comex-profile.js';

/* Mirrors the public.json path mapping /content/dam/<site>/comex/:/groupe/comex/ */
const CF_FOLDER = 'comex';
const PAGE_PREFIX = '/groupe/comex/';
const CF_PATH = new RegExp(`^/content/dam/([^/]+)/${CF_FOLDER}/([^/.]+)`);
const PAGE_PATH = new RegExp(`^(?:/content(?:/([^/]+))?)?${PAGE_PREFIX}([^/.]+)`);

const LABELS = {
  fr: {
    readMore: 'En savoir plus',
    linkedin: 'Logo de LinkedIn',
    loading: 'Chargement des membres…',
    empty: 'Aucun membre à afficher pour le moment.',
  },
  en: {
    readMore: 'Read more',
    linkedin: 'LinkedIn logo',
    loading: 'Loading members…',
    empty: 'No members to display at the moment.',
  },
};

function getLabels() {
  const lang = (document.documentElement.lang || 'fr').slice(0, 2).toLowerCase();
  return LABELS[lang] || LABELS.fr;
}

const isAuthorHost = () => window.location.hostname.includes('adobeaemcloud');

/** reads the key-value rows; members keep their authored order */
function readConfig(block) {
  const config = { members: [] };
  [...block.children].forEach((row) => {
    const key = row.firstElementChild?.textContent.trim().toLowerCase().replace(/[^a-z]/g, '');
    const cell = row.children.length > 1 ? row.lastElementChild : null;
    if (!key || !cell) return;
    if (key === 'members') {
      const links = [...cell.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
      const items = links.length
        ? links
        : [...cell.querySelectorAll('li, p')].map((el) => el.textContent);
      const values = items.length ? items : cell.textContent.split(/[\s,]+/);
      config.members = values.map((v) => v.trim()).filter(Boolean);
    } else {
      config[key] = cell.textContent.trim();
    }
  });
  return config;
}

/**
 * Resolves a member reference to { slug, site, page } where page is the public
 * EDS path (/groupe/comex/<slug>). Returns null for foreign / unknown refs.
 */
export function resolveMember(ref) {
  let url;
  try {
    url = new URL(ref, window.location.href);
  } catch {
    return null;
  }
  if (url.origin !== window.location.origin) return null;
  const path = url.pathname.replace(/(\.plain)?\.html$/, '').replace(/\/$/, '');
  const cf = path.match(CF_PATH);
  if (cf) return { site: cf[1], slug: cf[2], page: `${PAGE_PREFIX}${cf[2]}` };
  const page = path.match(PAGE_PATH);
  if (page) return { site: page[1] || null, slug: page[2], page: `${PAGE_PREFIX}${page[2]}` };
  return null;
}

async function fetchText(paths) {
  let lastError;
  // eslint-disable-next-line no-restricted-syntax
  for (const path of paths) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const resp = await fetch(path);
      // eslint-disable-next-line no-await-in-loop
      if (resp.ok) return { text: await resp.text(), url: new URL(path, window.location.href) };
      lastError = new Error(`${path} returned HTTP ${resp.status}`);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

/** EDS (preview/live/local): parse the comex-profile block of the member page */
async function loadFromPage(member) {
  const paths = [`${member.page}.plain.html`];
  // local `aem up --html-folder content` serves pages under /content/
  if (window.location.pathname.startsWith('/content/')) paths.push(`/content${member.page}.plain.html`);
  const { text, url } = await fetchText(paths);
  const doc = new DOMParser().parseFromString(text, 'text/html');
  const block = doc.querySelector('.comex-profile');
  if (!block) throw new Error(`${url.pathname} has no comex-profile block`);
  const profile = parseComexProfile(block);
  const src = profile.photo?.getAttribute('src');
  return {
    ...profile,
    photo: src ? new URL(src, url).href : '',
    href: member.page,
  };
}

/** AEM author: the overlay is not rendered, read the CF JSON (Assets HTTP API) */
async function loadFromAssetsApi(member) {
  const site = member.site || window.location.pathname.match(/^\/content\/([^/]+)\//)?.[1];
  if (!site) throw new Error(`Cannot infer the site of ${member.slug}`);
  const { text } = await fetchText([`/api/assets/${site}/${CF_FOLDER}/${member.slug}.json`]);
  const elements = JSON.parse(text)?.properties?.elements || {};
  const value = (field) => String(elements[field]?.value ?? '').trim();
  const firstname = value('firstname');
  const lastname = value('lastname');
  const linkedin = value('linkedin');
  return {
    firstname,
    lastname,
    name: [firstname, lastname].filter(Boolean).join(' '),
    position: value('position'),
    linkedin: /^https?:\/\//i.test(linkedin) ? linkedin : '',
    photo: value('photo'),
    href: member.page,
  };
}

function buildPhoto(src) {
  const wrapper = document.createElement('div');
  wrapper.className = 'comex-members-photo';
  if (!src) return wrapper;
  const url = new URL(src, window.location.href);
  // decorative: the member's name follows immediately
  if (url.origin === window.location.origin && url.pathname.includes('/media_')) {
    wrapper.append(createOptimizedPicture(url.pathname, '', false, [{ width: '750' }]));
  } else {
    const img = document.createElement('img');
    img.src = url.href;
    img.alt = '';
    img.loading = 'lazy';
    wrapper.append(img);
  }
  const img = wrapper.querySelector('img');
  img.width = 520;
  img.height = 600;
  return wrapper;
}

function buildCard(member, labels) {
  const li = document.createElement('li');
  li.className = 'comex-members-item';
  li.append(buildPhoto(member.photo));

  const name = document.createElement('h3');
  name.className = 'comex-members-name';
  name.textContent = member.name;
  li.append(name);

  if (member.position) {
    const position = document.createElement('p');
    position.className = 'comex-members-position';
    position.textContent = member.position;
    li.append(position);
  }

  const actions = document.createElement('div');
  actions.className = 'comex-members-actions';
  const more = document.createElement('a');
  // own class: the source's small outline button, not the global white pill (a.button)
  more.className = 'comex-members-more';
  more.href = member.href;
  more.textContent = labels.readMore;
  more.setAttribute('aria-label', `${labels.readMore} – ${member.name}`);
  actions.append(more);
  if (member.linkedin) {
    const linkedin = buildLinkedinLink(member.linkedin, labels.linkedin, member.name);
    linkedin.className = 'comex-members-linkedin';
    // the source's coral LinkedIn square is drawn by the block CSS (./linkedin.svg)
    linkedin.replaceChildren();
    actions.append(linkedin);
  }
  li.append(actions);
  return li;
}

export default async function decorate(block) {
  const config = readConfig(block);
  const defaults = getLabels();
  const labels = {
    readMore: config.readmore || defaults.readMore,
    linkedin: config.linkedinlabel || defaults.linkedin,
  };

  const status = document.createElement('p');
  status.className = 'comex-members-status';
  status.setAttribute('role', 'status');
  status.textContent = defaults.loading;
  block.replaceChildren(status);

  const members = config.members.map((ref) => {
    const member = resolveMember(ref);
    // eslint-disable-next-line no-console
    if (!member) console.warn('comex-members: ignoring unsupported member reference', ref);
    return member;
  }).filter(Boolean);

  const load = isAuthorHost() ? loadFromAssetsApi : loadFromPage;
  const results = await Promise.allSettled(members.map(load));
  const cards = results.map((result, i) => {
    if (result.status === 'fulfilled' && result.value.name) return buildCard(result.value, labels);
    // eslint-disable-next-line no-console
    console.error(`comex-members: skipping ${members[i].page}`, result.reason || 'missing name');
    return null;
  }).filter(Boolean);

  if (!cards.length) {
    status.textContent = defaults.empty;
    status.classList.add('comex-members-empty');
    return;
  }

  const list = document.createElement('ul');
  list.className = 'comex-members-list';
  list.append(...cards);
  block.replaceChildren(list);
}
