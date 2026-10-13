import { readBlockConfig } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const fields = new Map([...block.children].map((row) => [
    row.firstElementChild?.textContent.trim().toLowerCase(),
    row.lastElementChild?.querySelector('[data-aue-prop]') || row.lastElementChild,
  ]));
  const french = document.documentElement.lang.startsWith('fr');
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  status.textContent = french ? 'Chargement de l’article…' : 'Loading article…';
  block.replaceChildren(status);
  try {
    if (!config.source) throw new Error('Scientific teaser needs an article URL.');
    const url = new URL(config.source, window.location.href);
    if (url.origin !== window.location.origin) throw new Error('Scientific article must belong to this site.');
    const path = url.pathname.replace(/\/$/, '').replace(/(\.plain)?\.html$/, '');
    const response = await fetch(`${path}.plain.html`);
    if (!response.ok) throw new Error(`Scientific article returned HTTP ${response.status}.`);
    const page = new DOMParser().parseFromString(await response.text(), 'text/html');
    const header = page.querySelector('.article-header');
    const title = header?.querySelector('h1');
    if (!title) throw new Error('Scientific article is missing its article-header title.');
    const heading = document.createElement('h2');
    heading.textContent = config.headline || title.textContent;
    if (config.headline) moveInstrumentation(fields.get('headline'), heading);
    const summary = document.createElement('p');
    summary.textContent = config.summary
      || title.nextElementSibling?.textContent || '';
    if (config.summary) moveInstrumentation(fields.get('summary'), summary);
    const content = document.createElement('div');
    content.className = 'scientific-teaser-content';
    const link = document.createElement('a');
    link.href = url.href;
    link.className = 'button primary';
    link.textContent = config.cta || (french ? 'Lire la suite' : 'Read more');
    moveInstrumentation(fields.get('source'), link);
    const cta = document.createElement('p');
    if (config.cta) moveInstrumentation(fields.get('cta'), cta);
    cta.append(link);
    content.append(heading, summary, cta);
    const image = header.querySelector('img');
    const children = [];
    if (image) {
      const media = document.createElement('div');
      media.className = 'scientific-teaser-media';
      const copy = document.createElement('img');
      copy.src = new URL(image.getAttribute('src'), url).href;
      copy.alt = image.alt;
      copy.loading = 'lazy';
      media.append(copy);
      children.push(media);
    }
    children.push(content);
    block.replaceChildren(...children);
  } catch (error) {
    status.textContent = french ? 'Cet article est indisponible pour le moment.' : 'This article is currently unavailable.';
    status.setAttribute('role', 'alert');
    // eslint-disable-next-line no-console
    console.error('Scientific teaser failed', error);
  }
}
