/**
 * COMEX member profile ("fiche membre").
 *
 * Authored contract — key-value rows (key cell | value cell), see README.md:
 *   photo (picture/img), firstname, lastname, position, linkedin (link),
 *   biography (rich text). Rows are matched by key, so order/missing rows are
 *   tolerated; single-cell rows are read positionally in that order.
 * The same rows are rendered by cf-templates/comex-member.html for COMEX
 * Content Fragments and parsed from the .plain.html by the comex-members block
 * (via parseComexProfile), so the contract must stay stable.
 */
import { moveInstrumentation } from '../../scripts/scripts.js';

export const PROFILE_FIELDS = ['photo', 'firstname', 'lastname', 'position', 'linkedin', 'biography'];

const LABELS = {
  fr: { linkedin: 'Logo de LinkedIn' },
  en: { linkedin: 'LinkedIn logo' },
};

function getLabels() {
  const lang = (document.documentElement.lang || 'fr').slice(0, 2).toLowerCase();
  return LABELS[lang] || LABELS.fr;
}

/** innermost element holding the authored value (UE instruments it) */
function valueCell(row) {
  if (!row) return null;
  const cell = row.lastElementChild || row;
  return cell.querySelector('[data-aue-prop]') || cell;
}

function text(cell) {
  return cell?.textContent.replace(/\s+/g, ' ').trim() || '';
}

/**
 * Reads the profile rows of an (undecorated) comex-profile block element.
 * Pure DOM read, safe on a block parsed from another page's .plain.html.
 * @param {Element} block
 * @returns {{photo: HTMLImageElement|null, firstname: string, lastname: string,
 *   name: string, position: string, linkedin: string, biography: Element|null,
 *   cells: Object<string, Element|null>}}
 */
export function parseComexProfile(block) {
  const rows = [...block.children];
  const keyed = new Map();
  rows.forEach((row) => {
    if (row.children.length < 2) return;
    const key = row.firstElementChild.textContent.trim().toLowerCase().replace(/[^a-z]/g, '');
    if (PROFILE_FIELDS.includes(key) && !keyed.has(key)) keyed.set(key, row);
  });
  // key-value rows (the contract); fallback: single-cell rows in PROFILE_FIELDS order
  const rowOf = (field, i) => (keyed.size ? keyed.get(field) : rows[i]);
  const cells = Object.fromEntries(PROFILE_FIELDS.map((field, i) => [
    field, valueCell(rowOf(field, i)),
  ]));
  const photo = cells.photo?.querySelector('img') || null;
  const linkCell = cells.linkedin;
  const href = linkCell?.querySelector('a[href]')?.getAttribute('href') || text(linkCell);
  const linkedin = /^https?:\/\//i.test(href) ? href : '';
  const firstname = text(cells.firstname);
  const lastname = text(cells.lastname);
  return {
    photo,
    firstname,
    lastname,
    name: [firstname, lastname].filter(Boolean).join(' '),
    position: text(cells.position),
    linkedin,
    biography: cells.biography,
    cells,
  };
}

/** biography paragraphs; plain text without <p> is wrapped in one */
function biographyParagraphs(cell) {
  if (!cell) return [];
  const blocks = [...cell.children];
  if (blocks.length) return blocks;
  if (!cell.textContent.trim()) return [];
  const p = document.createElement('p');
  p.textContent = cell.textContent.trim();
  return [p];
}

export function buildLinkedinLink(href, label, name) {
  const link = document.createElement('a');
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', name ? `${label} – ${name}` : label);
  const icon = document.createElement('span');
  icon.className = 'icon icon-linkedin';
  link.append(icon);
  return link;
}

export default function decorate(block) {
  const profile = parseComexProfile(block);
  const { cells } = profile;

  const intro = document.createElement('div');
  intro.className = 'comex-profile-intro';

  const media = document.createElement('div');
  media.className = 'comex-profile-photo';
  const picture = profile.photo?.closest('picture') || profile.photo;
  if (picture) {
    if (cells.photo) moveInstrumentation(cells.photo, media);
    profile.photo.alt = profile.photo.alt || '';
    profile.photo.width = profile.photo.width || 454;
    profile.photo.height = profile.photo.height || 524;
    media.append(picture);
  } else {
    media.classList.add('comex-profile-photo-empty');
  }

  const summary = document.createElement('div');
  summary.className = 'comex-profile-summary';

  if (profile.name) {
    const heading = document.createElement('h2');
    heading.className = 'comex-profile-name';
    const first = document.createElement('span');
    first.textContent = profile.firstname;
    if (cells.firstname) moveInstrumentation(cells.firstname, first);
    const last = document.createElement('span');
    last.textContent = profile.lastname;
    if (cells.lastname) moveInstrumentation(cells.lastname, last);
    heading.append(first, profile.firstname && profile.lastname ? ' ' : '', last);
    summary.append(heading);
  }

  if (profile.position) {
    const position = document.createElement('p');
    position.className = 'comex-profile-position';
    const strong = document.createElement('strong');
    strong.textContent = profile.position;
    position.append(strong);
    if (cells.position) moveInstrumentation(cells.position, position);
    summary.append(position);
  }

  const [lead, ...rest] = biographyParagraphs(cells.biography);
  if (lead) {
    lead.classList.add('comex-profile-lead');
    if (!rest.length && cells.biography) moveInstrumentation(cells.biography, lead);
    summary.append(lead);
  }

  intro.append(media, summary);
  const children = [intro];

  if (rest.length) {
    const biography = document.createElement('div');
    biography.className = 'comex-profile-biography';
    if (cells.biography) moveInstrumentation(cells.biography, biography);
    biography.append(...rest);
    children.push(biography);
  }

  if (profile.linkedin) {
    const social = document.createElement('p');
    social.className = 'comex-profile-linkedin';
    if (cells.linkedin) moveInstrumentation(cells.linkedin, social);
    const link = buildLinkedinLink(profile.linkedin, getLabels().linkedin, profile.name);
    // source fiche uses its own 48x48 coral LinkedIn tile (block asset, not /icons/)
    const icon = document.createElement('img');
    icon.src = `${window.hlx?.codeBasePath || ''}/blocks/comex-profile/linkedin.svg`;
    icon.alt = '';
    icon.width = 48;
    icon.height = 48;
    icon.loading = 'lazy';
    icon.decoding = 'async';
    link.replaceChildren(icon);
    social.append(link);
    children.push(social);
  }

  // keep machine-readable data on the decorated block too
  block.dataset.firstname = profile.firstname;
  block.dataset.lastname = profile.lastname;
  block.replaceChildren(...children);
}
