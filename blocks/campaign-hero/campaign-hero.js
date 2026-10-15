import { decorateRows, decorateCTA } from '../../scripts/block-utils.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const SEARCH_LABELS = {
  fr: { label: 'Recherche pour:', submit: 'Rechercher', placeholder: 'Rechercher…' },
  en: { label: 'Search for:', submit: 'Search', placeholder: 'Search…' },
};

const ARROW_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 13" aria-hidden="true" focusable="false">'
  + '<path d="M33 6.24H0M27.215 1 33 6.24 27.215 12" stroke="currentColor" stroke-width=".972" fill="none"/></svg>';

let searchCount = 0;

/**
 * Builds the optional search form from the "search_" row
 * (search_action link + optional search_placeholder text).
 * @param {Element} row The search row (may be missing or empty)
 * @param {boolean} french Whether the page language is French
 * @returns {HTMLFormElement|null} The form, or null when no search is configured
 */
function buildSearch(row, french) {
  const cell = row?.firstElementChild;
  const actionLink = cell?.querySelector('a[href]');
  if (!actionLink) return null;
  const action = new URL(actionLink.href, window.location.href);
  if (!['http:', 'https:'].includes(action.protocol)) {
    // eslint-disable-next-line no-console
    console.warn('Campaign hero search requires an HTTP(S) action URL', actionLink.href);
    return null;
  }
  const labels = SEARCH_LABELS[french ? 'fr' : 'en'];
  const placeholderEl = [...cell.children]
    .find((el) => !el.querySelector('a') && !el.matches('a') && el.textContent.trim());

  searchCount += 1;
  const inputId = `campaign-hero-search-${searchCount}`;
  const form = document.createElement('form');
  form.className = 'campaign-hero-search';
  form.setAttribute('role', 'search');
  form.method = 'get';
  form.action = `${action.origin}${action.pathname}`;
  moveInstrumentation(actionLink, form);

  const label = document.createElement('label');
  label.className = 'campaign-hero-sr-only';
  label.htmlFor = inputId;
  label.textContent = labels.label;

  // GET submissions drop the action's own query string: carry it as hidden fields
  const hidden = [...action.searchParams].filter(([name]) => name !== 's').map(([name, value]) => {
    const field = document.createElement('input');
    field.type = 'hidden';
    field.name = name;
    field.value = value;
    return field;
  });

  const input = document.createElement('input');
  input.type = 'search';
  input.id = inputId;
  input.name = 's';
  input.maxLength = 30;
  input.autocomplete = 'off';
  input.placeholder = placeholderEl?.textContent.trim() || labels.placeholder;
  if (placeholderEl) moveInstrumentation(placeholderEl, input);

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'campaign-hero-search-submit';
  submit.title = labels.submit;
  submit.setAttribute('aria-label', labels.submit);
  submit.innerHTML = ARROW_ICON;

  form.append(label, ...hidden, input, submit);
  return form;
}

export default function decorate(block) {
  decorateRows(block, ['campaign-hero-media', 'campaign-hero-content', 'campaign-hero-video', 'campaign-hero-search-row']);
  const content = block.querySelector('.campaign-hero-content');
  decorateCTA(content);
  const french = document.documentElement.lang.startsWith('fr');
  const searchRow = block.querySelector('.campaign-hero-search-row');
  const search = buildSearch(searchRow, french);
  const searchTarget = content?.lastElementChild || content;
  if (search && searchTarget) searchTarget.append(search);
  // the search row only carries configuration: never render it as a row
  searchRow?.remove();
  const image = block.querySelector('.campaign-hero-media img');
  if (image) {
    image.loading = 'eager';
    image.fetchPriority = 'high';
  }
  const videoCell = block.querySelector('.campaign-hero-video > div');
  const link = videoCell?.querySelector('a');
  if (!link) return;
  const source = new URL(link.href);
  if (!['http:', 'https:'].includes(source.protocol)) {
    throw new Error('Campaign hero requires an HTTP(S) video URL.');
  }
  const video = document.createElement('video');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'none';
  video.setAttribute('aria-hidden', 'true');
  if (image) video.poster = image.src;
  moveInstrumentation(videoCell, video);
  videoCell.replaceChildren(video);
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'campaign-hero-toggle';
  const playLabel = french ? 'Lire la vidéo' : 'Play video';
  const pauseLabel = french ? 'Mettre en pause' : 'Pause video';
  const update = () => {
    toggle.textContent = video.paused ? playLabel : pauseLabel;
    toggle.setAttribute('aria-pressed', String(!video.paused));
  };
  const play = async () => {
    if (!video.src) video.src = source.href;
    try {
      await video.play();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Campaign hero video playback failed', error);
      toggle.textContent = french ? 'Vidéo indisponible' : 'Video unavailable';
    }
  };
  video.addEventListener('play', update);
  video.addEventListener('pause', update);
  video.addEventListener('error', () => {
    video.hidden = true;
    toggle.disabled = true;
    toggle.textContent = french ? 'Vidéo indisponible' : 'Video unavailable';
    // eslint-disable-next-line no-console
    console.error('Campaign hero video could not be loaded', source.href);
  });
  let autoplayTimer;
  toggle.addEventListener('click', () => {
    window.clearTimeout(autoplayTimer);
    if (video.paused) play();
    else video.pause();
  });
  update();
  block.append(toggle);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) video.pause();
  });
  if (!reducedMotion.matches) {
    autoplayTimer = window.setTimeout(() => {
      if (block.isConnected && !reducedMotion.matches) play();
    }, 3000);
  }
}
