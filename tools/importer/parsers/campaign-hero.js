/* eslint-disable */
/* global WebImporter */
/**
 * Parser for campaign-hero. Base: hero (custom Servier campaign hero with background video).
 * Source: https://servier.com/ (template "home"). Generated: 2026-10-15.
 *
 * Source DOM (validated in migration-work/block-context/campaign-hero/source.html and live page):
 *   .home-header-front-page
 *     > div > video > source[src$=".mp4"]        (background video, no poster on source)
 *     > div.prose > h1, p, form.search-form       (search form is not authorable; removed by cleanup)
 *
 * UE model (blocks/campaign-hero/_campaign-hero.json), 3 rows:
 *   1. image (+imageAlt)                                   -> poster image (empty when none)
 *   2. content_heading, content_description, content_link  -> grouped "content_" cell
 *   3. video                                               -> link to MP4
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

  const block = WebImporter.Blocks.createBlock(document, { name: 'campaign-hero', cells });
  element.replaceWith(block);
}
