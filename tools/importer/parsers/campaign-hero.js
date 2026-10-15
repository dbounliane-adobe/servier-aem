/* eslint-disable */
/* global WebImporter */
/**
 * Parser for campaign-hero. Base: hero (custom Servier campaign hero with background video).
 * Source: https://servier.com/ (template "home"). Generated: 2026-10-15.
 *
 * Source DOM (validated in migration-work/block-context/campaign-hero/source.html and live page):
 *   .home-header-front-page
 *     > div > video > source[src$=".mp4"]        (background video, no poster on source)
 *     > div.prose > h1, p, form.search-form[action] > label > input[name=s][placeholder]
 *
 * UE model (blocks/campaign-hero/_campaign-hero.json), 4 rows:
 *   1. image (+imageAlt)                                   -> poster image (empty when none)
 *   2. content_heading, content_description, content_link  -> grouped "content_" cell
 *   3. video                                               -> link to MP4
 *   4. search_action, search_placeholder                   -> grouped "search_" cell (empty = no search)
 */
export default function parse(element, { document }) {
  const hint = (name) => document.createComment(` field:${name} `);

  // Row 1: poster / fallback image (video[poster] or a real <img> outside the search form).
  const imageCell = [];
  const video = element.querySelector('video');
  let posterImg = null;
  const poster = video && video.getAttribute('poster');
  if (poster) {
    posterImg = document.createElement('img');
    posterImg.src = poster;
    posterImg.alt = '';
  } else {
    posterImg = [...element.querySelectorAll('img')]
      .find((img) => !img.closest('form, button') && !(img.getAttribute('src') || '').startsWith('data:')) || null;
  }
  if (posterImg) imageCell.push(hint('image'), posterImg);

  // Row 4 (read first, then drop the form so it never leaks into the content cell):
  // WordPress search form -> action link + placeholder text (the query param is always "s").
  const searchCell = [];
  const searchForm = element.querySelector('form.search-form, form[role="search"]');
  if (searchForm) {
    const searchInput = searchForm.querySelector('input[name="s"], input[type="search"]');
    const action = searchForm.getAttribute('action') || '';
    if (action && searchInput) {
      const actionLink = document.createElement('a');
      actionLink.href = action;
      actionLink.textContent = action;
      searchCell.push(hint('search_action'), actionLink);
      const placeholder = (searchInput.getAttribute('placeholder') || '').trim();
      if (placeholder) {
        const placeholderP = document.createElement('p');
        placeholderP.textContent = placeholder;
        searchCell.push(hint('search_placeholder'), placeholderP);
      }
    }
    searchForm.remove();
  }

  // Row 2: heading, description, optional CTA.
  const contentRoot = element.querySelector('.prose') || element;
  const heading = contentRoot.querySelector('h1, h2');
  const description = [...contentRoot.querySelectorAll(':scope > p')]
    .filter((p) => p.textContent.trim() && !p.closest('form'));
  const cta = [...contentRoot.querySelectorAll('a[href]')].find((a) => !a.closest('form'));

  const contentCell = [];
  if (heading) contentCell.push(hint('content_heading'), heading);
  if (description.length) contentCell.push(hint('content_description'), ...description);
  if (cta) contentCell.push(hint('content_link'), cta);

  // Row 3: MP4 video URL.
  const videoCell = [];
  const sourceEl = video && (video.querySelector('source[src]') || (video.getAttribute('src') ? video : null));
  const videoSrc = sourceEl ? sourceEl.getAttribute('src') : '';
  if (videoSrc) {
    const link = document.createElement('a');
    link.href = videoSrc;
    link.textContent = videoSrc;
    videoCell.push(hint('video'), link);
  }

  if (!heading && !videoSrc) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [
    [imageCell.length ? imageCell : ''],
    [contentCell.length ? contentCell : ''],
    [videoCell.length ? videoCell : ''],
  ];
  if (searchCell.length) cells.push([searchCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'campaign-hero', cells });
  element.replaceWith(block);
}
