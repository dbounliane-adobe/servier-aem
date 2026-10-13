import hero from '../blocks/campaign-hero/campaign-hero.js';
import topics from '../blocks/topic-cards/topic-cards.js';
import figures from '../blocks/key-figures/key-figures.js';
import header from '../blocks/article-header/article-header.js';
import intro from '../blocks/section-intro/section-intro.js';
import feature from '../blocks/editorial-feature/editorial-feature.js';
import feed, { loadArticles } from '../blocks/article-feed/article-feed.js';
import teaser from '../blocks/scientific-teaser/scientific-teaser.js';
import { loadCSS } from '../scripts/aem.js';

const results = document.getElementById('results');
const fixtures = document.getElementById('fixtures');
let count = 0;

function assert(condition, message) {
  if (!condition) throw new Error(message);
  count += 1;
}

function fixture(name, markup) {
  const block = document.createElement('div');
  block.className = name;
  block.innerHTML = markup;
  fixtures.append(block);
  return block;
}

async function withFetch(mock, test) {
  const original = window.fetch;
  window.fetch = mock;
  try {
    await test();
  } finally {
    window.fetch = original;
  }
}

async function waitFor(condition) {
  const deadline = Date.now() + 10000;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error('Page decoration timed out.');
    // eslint-disable-next-line no-await-in-loop
    await new Promise((done) => { setTimeout(done, 50); });
  }
}

async function testPages() {
  const frame = document.createElement('iframe');
  frame.style.width = '100%';
  frame.style.height = '800px';
  frame.style.border = '0';
  frame.title = 'Integration test';
  fixtures.append(frame);
  frame.src = '/drafts/index.html';
  await waitFor(() => frame.contentDocument?.querySelectorAll('main .block[data-block-status="loaded"]').length === 10
    && frame.contentDocument.querySelector('header .block[data-block-status="loaded"]'));
  const home = frame.contentDocument;
  assert(home.querySelectorAll('main h1').length === 1, 'Homepage has one H1.');
  assert(home.querySelectorAll('.topic-cards li').length === 3, 'Homepage renders three topic cards.');
  assert(home.querySelectorAll('.key-figures dd').length === 4, 'Homepage renders four metrics.');
  assert(home.querySelector('.scientific-teaser h2').textContent.startsWith('Comment lire'), 'Homepage reuses the CF fixture.');
  assert(home.documentElement.scrollWidth <= frame.contentWindow.innerWidth, 'Homepage has no horizontal overflow.');
  assert(home.querySelector('.campaign-hero img').getBoundingClientRect().height
    === home.querySelector('.campaign-hero').getBoundingClientRect().height, 'Hero image covers its full height.');
  const link = home.querySelector('.article-feed h3 a');
  link.click();
  await waitFor(() => frame.contentDocument?.body.classList.contains('article')
    && frame.contentDocument.querySelector('.article-header[data-block-status="loaded"]'));
  assert(frame.contentDocument.querySelector('h1').textContent.startsWith('Comment lire'), 'Homepage card opens its dedicated article.');
  assert(frame.contentDocument.querySelector('time').dateTime.startsWith('2026-10-13'), 'Dedicated article decorates its date.');
  assert(frame.contentDocument.querySelector('main blockquote'), 'Dedicated article preserves rich editorial content.');
  assert(frame.contentDocument.documentElement.scrollWidth <= frame.contentWindow.innerWidth, 'Article has no horizontal overflow.');
  frame.src = '/test/unthemed.html';
  await waitFor(() => frame.contentDocument?.querySelector('h1')?.textContent === 'Existing boilerplate page'
    && frame.contentDocument.body.classList.contains('appear'));
  assert(!frame.contentDocument.body.classList.contains('servier'), 'Other sites do not receive the Servier theme by default.');
  assert(!frame.contentDocument.querySelector('link[href="/styles/servier.css"]'), 'Unthemed pages do not download the Servier stylesheet.');
  assert(frame.contentDocument.documentElement.lang === 'en', 'Other-site authored language remains unchanged.');
}

async function run() {
  const expectedWidth = Number(new URLSearchParams(window.location.search).get('width'));
  assert(window.innerWidth === expectedWidth, `Viewport must be exactly ${expectedWidth}px, got ${window.innerWidth}px.`);
  await Promise.all(['campaign-hero', 'topic-cards', 'article-feed', 'scientific-teaser'].map((name) => loadCSS(`/blocks/${name}/${name}.css`)));
  const campaign = fixture('campaign-hero', '<div><div></div></div><div><div><h1>Title</h1><p>Subtitle</p><a href="/drafts/science.html">CTA</a></div></div><div><div></div></div>');
  hero(campaign);
  assert(campaign.querySelector('a.button')?.textContent === 'CTA', 'Hero CTA is decorated.');
  assert(!campaign.querySelector('video'), 'Hero works without image or video.');
  const mediaHero = fixture('campaign-hero', '<div><div><picture><img src="/drafts/media/science.svg" alt=""></picture></div></div><div><div><h1>Video</h1></div></div><div><div data-aue-prop="video"><a href="/drafts/demo.mp4">Video</a></div></div>');
  const { matchMedia } = window;
  window.matchMedia = (query) => (query.includes('prefers-reduced-motion')
    ? { matches: true, addEventListener() {} } : matchMedia.call(window, query));
  try {
    hero(mediaHero);
  } finally {
    window.matchMedia = matchMedia;
  }
  const video = mediaHero.querySelector('video');
  assert(!video.hasAttribute('src'), 'Reduced motion prevents video download/autoplay.');
  assert(video.muted && video.loop && video.playsInline, 'Background video is muted, looping and inline.');
  assert(video.dataset.aueProp === 'video', 'Video instrumentation survives.');
  assert(mediaHero.querySelector('button').getAttribute('aria-pressed') === 'false', 'Video has an accessible play control.');
  let paused = true;
  Object.defineProperty(video, 'paused', { get: () => paused });
  video.play = async () => { paused = false; video.dispatchEvent(new Event('play')); };
  video.pause = () => { paused = true; video.dispatchEvent(new Event('pause')); };
  mediaHero.querySelector('button').click();
  assert(video.src.endsWith('/drafts/demo.mp4'), 'Play control starts loading the authored video.');
  assert(mediaHero.querySelector('button').getAttribute('aria-pressed') === 'true', 'Play control reflects playback.');
  mediaHero.querySelector('button').click();
  assert(paused, 'Pause control stops playback.');
  video.removeAttribute('src');
  const delayedHero = fixture('campaign-hero', '<div><div></div></div><div><div><h1>Delayed</h1></div></div><div><div><a href="/drafts/demo.mp4">Video</a></div></div>');
  const timeout = window.setTimeout;
  let delay;
  let autoplay;
  window.matchMedia = (query) => (query.includes('prefers-reduced-motion')
    ? { matches: false, addEventListener() {} } : matchMedia.call(window, query));
  window.setTimeout = (callback, ms) => { autoplay = callback; delay = ms; return 0; };
  try {
    hero(delayedHero);
  } finally {
    window.matchMedia = matchMedia;
    window.setTimeout = timeout;
  }
  assert(delay === 3000 && !delayedHero.querySelector('video').hasAttribute('src'), 'Autoplay is deferred until after eager loading.');
  delayedHero.remove();
  autoplay();
  assert(!delayedHero.querySelector('video').hasAttribute('src'), 'Removed UE hero cannot start its delayed video.');

  const cards = fixture('topic-cards', '<div data-aue-resource="item"><div></div><div data-aue-prop="content"><h3>Topic</h3><p><a href="/drafts/science.html">Go</a></p></div></div>');
  topics(cards);
  assert(cards.querySelector('li').dataset.aueResource === 'item', 'Card item instrumentation survives.');
  assert(cards.querySelector('[data-aue-prop="content"] a.button'), 'Card fields and link survive without an image.');
  const metrics = fixture('key-figures', '<div data-aue-resource="metric"><div data-aue-prop="value">42</div><div data-aue-prop="label">Projects</div></div>');
  figures(metrics);
  assert(metrics.querySelector('dt').textContent === 'Projects', 'Metric uses semantic label/value order.');
  assert(metrics.querySelector('dd').dataset.aueProp === 'value', 'Metric value instrumentation survives.');
  const article = fixture('article-header', '<div><div><h1>Article</h1><p>Summary</p></div></div><div><div><p data-aue-prop="meta_date">2026-10-13</p><p>Author</p></div></div><div><div></div></div>');
  header(article);
  assert(article.querySelector('time').dateTime.startsWith('2026-10-13'), 'Article renders a machine-readable date.');
  assert(article.querySelector('time').dataset.aueProp === 'meta_date', 'Date instrumentation survives.');
  const noDate = fixture('article-header', '<div><div><h1>No date</h1></div></div><div><div><p>Author only</p></div></div>');
  header(noDate);
  assert(!noDate.querySelector('time'), 'Missing date does not convert author into a date.');
  const section = fixture('section-intro', '<div><div><h2>Heading</h2><p>Description</p></div></div>');
  intro(section);
  assert(!section.querySelector('.section-intro-eyebrow'), 'Missing eyebrow does not restyle the description.');
  const editorial = fixture('editorial-feature', '<div><div></div></div><div><div><h2>Editorial</h2><p><a href="/drafts/science.html">Go</a></p></div></div>');
  feature(editorial);
  assert(editorial.querySelector('a.button'), 'Feature supports missing image and optional text.');

  const listing = fixture('article-feed', '<div><div>source</div><div><a href="/drafts/query-index.json">Index</a></div></div><div><div>prefix</div><div>/drafts/</div></div>');
  await feed(listing);
  assert(listing.querySelectorAll('li').length === 3, 'Feed renders all three fixture articles.');
  assert(listing.querySelector('h3').textContent.includes('publication scientifique'), 'Feed sorts newest first.');
  const actualites = [...listing.querySelectorAll('button')].find((button) => button.textContent === 'Actualités');
  actualites.click();
  assert(listing.querySelectorAll('li').length === 1, 'Category filtering updates the cards.');
  assert(actualites.getAttribute('aria-pressed') === 'true', 'Category filter state is accessible.');
  assert(listing.querySelector('a').pathname === '/drafts/science.html', 'Cards navigate to an article page.');
  listing.querySelector('button').click();
  const columns = getComputedStyle(listing.querySelector('ul')).gridTemplateColumns.split(' ').length;
  assert(columns === (window.innerWidth >= 900 ? 3 : 1), 'Feed layout matches mobile/desktop breakpoint.');

  const requests = [];
  await withFetch(async (url) => {
    requests.push(Number(new URL(url).searchParams.get('offset')));
    const data = requests.length === 1 ? [{ title: 'A', path: '/newsroom/a' }] : [{ title: 'B', path: '/newsroom/b' }];
    return Response.json({ total: 2, data });
  }, async () => {
    const records = await loadArticles('/query-index.json');
    assert(records.length === 2 && requests.join(',') === '0,1', 'Index pagination advances and loads all records.');
  });
  await withFetch(async () => new Response('', { status: 503 }), async () => {
    const broken = fixture('article-feed', '');
    await feed(broken);
    assert(broken.querySelector('[role="alert"]')?.textContent.includes('indisponibles'), 'HTTP errors are visible, not empty success states.');
  });
  await withFetch(async () => Response.json({ data: [] }), async () => {
    const empty = fixture('article-feed', '');
    await feed(empty);
    assert(empty.querySelector('[role="status"]').textContent === 'Aucun article publié.', 'Empty published index is explicit.');
  });
  await withFetch(async () => Response.json({
    data: [
      { title: 'Hidden', path: '/newsroom/hidden', robots: 'noindex' },
      { title: 'Other site', path: 'https://example.org/newsroom/other' },
      { title: 'Visible', path: '/newsroom/visible', category: 'Science' },
    ],
  }), async () => {
    const scoped = fixture('article-feed', '<div><div>category</div><div>Science</div></div>');
    await feed(scoped);
    assert(scoped.querySelectorAll('li').length === 1, 'Feed excludes noindex and other-site pages.');
  });
  await withFetch(async () => Response.json({ invalid: [] }), async () => {
    const invalid = fixture('article-feed', '');
    await feed(invalid);
    assert(invalid.querySelector('[role="alert"]'), 'Malformed index has an explicit error state.');
  });
  await withFetch(async () => Response.json({ total: 1, data: [] }), async () => {
    let failed = false;
    try { await loadArticles('/query-index.json'); } catch { failed = true; }
    assert(failed, 'Non-advancing pagination fails instead of looping.');
  });
  let externalFailed = false;
  try { await loadArticles('https://example.org/query-index.json'); } catch { externalFailed = true; }
  assert(externalFailed, 'Index cannot leak into another site.');

  const science = fixture('scientific-teaser', '<div><div>source</div><div data-aue-prop="source"><a href="/drafts/science.html">Article</a></div></div><div><div>headline</div><div data-aue-prop="headline">Local headline</div></div>');
  await teaser(science);
  assert(science.querySelector('h2').textContent === 'Local headline', 'UE local title override takes precedence over CF.');
  assert(science.querySelector('h2').dataset.aueProp === 'headline', 'Override instrumentation survives.');
  assert(science.querySelector('img').alt.includes('atome'), 'CF image and alt are reused.');
  assert(science.querySelector('a').dataset.aueProp === 'source', 'CF source reference remains instrumented.');
  const missing = fixture('scientific-teaser', '<div><div>source</div><div>/drafts/missing.html</div></div>');
  await teaser(missing);
  assert(missing.querySelector('[role="alert"]'), 'Missing CF page is visibly reported.');
  const shared = fixture('scientific-teaser', '<div><div>source</div><div>/drafts/science.html</div></div>');
  await teaser(shared);
  assert(shared.querySelector('h2').textContent.startsWith('Comment lire'), 'Teaser defaults to the CF title.');
  assert(!shared.querySelector('h1'), 'Reused CF content does not add a second page H1.');
  assert(document.documentElement.lang === 'fr', 'Authored language is preserved.');
  assert(document.body.classList.contains('servier'), 'Theme is opt-in through page metadata.');
  fixtures.replaceChildren();
  await testPages();
  fixtures.replaceChildren();
  results.dataset.status = 'passed';
  results.textContent = `${count} assertions passed`;
}

async function start() {
  if (window.self !== window.top) {
    await run();
    return;
  }
  // Chrome headless enforces a 500px outer window minimum; an iframe gives exact CSS viewports.
  const frame = document.createElement('iframe');
  frame.title = 'Exact viewport test';
  frame.style.width = `${new URLSearchParams(window.location.search).get('width')}px`;
  frame.style.height = '1000px';
  frame.style.border = '0';
  fixtures.append(frame);
  frame.src = window.location.href;
  await waitFor(() => ['passed', 'failed'].includes(frame.contentDocument?.getElementById('results')?.dataset.status));
  const child = frame.contentDocument.getElementById('results');
  results.dataset.status = child.dataset.status;
  results.textContent = child.textContent;
  frame.remove();
}

start().catch((error) => {
  results.dataset.status = 'failed';
  results.textContent = `${count} assertions passed; ${error.stack}`;
});
