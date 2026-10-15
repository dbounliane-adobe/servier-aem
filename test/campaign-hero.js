const results = document.getElementById('results');
const fixtures = document.getElementById('fixtures');
const width = Number(new URLSearchParams(window.location.search).get('width'));
const resource = 'urn:aemconnection:/content/test/campaign-hero';
let count = 0;

function assert(condition, message) {
  if (!condition) throw new Error(message);
  count += 1;
}

async function waitFor(condition) {
  const deadline = Date.now() + 10000;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error('Hero decoration timed out.');
    // eslint-disable-next-line no-await-in-loop
    await new Promise((done) => { setTimeout(done, 25); });
  }
}

function heroMarkup(author, title = 'Bienvenue chez Servier', videoURL = '') {
  return `<div class="campaign-hero"${author ? ` data-aue-resource="${resource}"` : ''}>
    <div><div><picture><img src="/drafts/media/science.svg" alt="Recherche"></picture></div></div>
    <div><div><h1>${title}</h1><p>La science au service des patients.</p>
      <p><a href="#suite">En savoir plus</a></p></div></div>
    <div><div>${videoURL ? `<a href="${videoURL}">Video</a>` : ''}</div></div>
  </div>`;
}

async function createPage(author, videoURL = '', reducedMotion = false) {
  const frame = document.createElement('iframe');
  frame.title = author ? 'Universal Editor hero' : 'Public hero';
  frame.style.width = `${width}px`;
  frame.style.height = '700px';
  frame.style.border = '0';
  fixtures.append(frame);
  frame.srcdoc = `<!DOCTYPE html><html lang="fr"><head>
    <meta name="theme" content="servier">
    <link rel="stylesheet" href="/styles/styles.css">
    ${videoURL ? `<script>
      window.videoPlayCalls = 0;
      Object.defineProperty(HTMLMediaElement.prototype, 'src', {
        configurable: true,
        get() { return this.dataset.testSource || ''; },
        set(value) { this.dataset.testSource = value; },
      });
      HTMLMediaElement.prototype.play = function () {
        window.videoPlayCalls += 1;
        Object.defineProperty(this, 'paused', { configurable: true, value: false });
        this.dispatchEvent(new Event('play'));
        return Promise.resolve();
      };
      HTMLMediaElement.prototype.pause = function () {
        Object.defineProperty(this, 'paused', { configurable: true, value: true });
        this.dispatchEvent(new Event('pause'));
      };
      const originalSetTimeout = window.setTimeout;
      window.heroTimers = [];
      window.setTimeout = (callback, delay, ...args) => {
        if (delay === 3000) {
          window.heroTimers.push(callback);
          return 0;
        }
        return originalSetTimeout(callback, delay, ...args);
      };
      const originalMatchMedia = window.matchMedia.bind(window);
      window.matchMedia = (query) => query === '(prefers-reduced-motion: reduce)'
        ? { matches: ${reducedMotion}, addEventListener() {} }
        : originalMatchMedia(query);
    </script>` : ''}
    <script type="module">
      import '/scripts/scripts.js';
      ${author ? "await import('/scripts/editor-support.js');" : ''}
      document.documentElement.dataset.ready = 'true';
    </script>
    </head><body><header></header><main>
      <div>${heroMarkup(author, undefined, videoURL)}</div>
      <div><h2 id="suite">La suite de la page</h2><p>Contenu sous le hero.</p></div>
    </main><footer></footer></body></html>`;
  await waitFor(() => frame.contentDocument?.documentElement.dataset.ready
    && frame.contentDocument.querySelector('.campaign-hero[data-block-status="loaded"]')
    && frame.contentDocument.querySelectorAll('main .section[data-section-status="loaded"]').length === 2);
  await frame.contentDocument.fonts.ready;
  assert(frame.contentWindow.innerWidth === width, `Viewport is exactly ${width}px.`);
  return frame;
}

function assertMediaCoverage(frame) {
  const hero = frame.contentDocument.querySelector('.campaign-hero');
  const { height } = hero.getBoundingClientRect();
  const image = hero.querySelector('img');
  assert(image.getBoundingClientRect().height === height, 'Background image covers the hero.');
  const video = frame.contentDocument.createElement('video');
  hero.querySelector('.campaign-hero-video > div').append(video);
  assert(video.getBoundingClientRect().height === height, 'Background video covers the hero.');
  video.remove();
}

async function resizeToContent(frame) {
  const heights = [];
  for (let step = 0; step < 5; step += 1) {
    frame.style.height = `${frame.contentDocument.documentElement.scrollHeight}px`;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((done) => { setTimeout(done, 25); });
    heights.push(frame.contentDocument.querySelector('.campaign-hero').getBoundingClientRect().height);
  }
  return heights;
}

async function run() {
  const asset = 'https://delivery-p199354-e2062419.adobeaemcloud.com/adobe/assets/urn:aaid:aem:2e3152d0-1d24-44d4-9928-a46e706e397b';
  const videoCases = [
    [`${asset}/play`, `${asset}/original/as/video.mp4`],
    [`${asset}/play/?token=example&expiryTime=123`, `${asset}/original/as/video.mp4?token=example&expiryTime=123`],
    ['https://example.com/video.mp4?version=2', 'https://example.com/video.mp4?version=2'],
    ['https://example.com/other/play', 'https://example.com/other/play'],
  ];
  await videoCases.reduce(async (previous, [input, expected]) => {
    await previous;
    const frame = await createPage(false, input);
    try {
      const video = frame.contentDocument.querySelector('.campaign-hero video');
      const toggle = frame.contentDocument.querySelector('.campaign-hero-toggle');
      assert(!video.getAttribute('src'), 'Video loading is deferred until playback.');
      assert(video.muted && video.loop && video.playsInline, 'Background playback is muted, looping and inline.');
      assert(frame.contentWindow.videoPlayCalls === 0, 'Autoplay waits for its timer.');
      frame.contentWindow.heroTimers.forEach((callback) => callback());
      assert(video.dataset.testSource === expected, `Video source resolves to ${expected}.`);
      assert(frame.contentWindow.videoPlayCalls === 1, 'Autoplay starts playback.');
      assert(toggle.getAttribute('aria-pressed') === 'true', 'Toggle reflects automatic playback.');
      toggle.click();
      assert(video.paused, 'Toggle pauses playback.');
      toggle.click();
      assert(frame.contentWindow.videoPlayCalls === 2, 'Toggle resumes playback.');
    } finally {
      frame.remove();
    }
  }, Promise.resolve());
  const reduced = await createPage(false, `${asset}/play`, true);
  try {
    reduced.contentWindow.heroTimers.forEach((callback) => callback());
    assert(reduced.contentWindow.videoPlayCalls === 0, 'Reduced motion prevents autoplay.');
    reduced.contentDocument.querySelector('.campaign-hero-toggle').click();
    assert(reduced.contentWindow.videoPlayCalls === 1, 'Reduced motion still permits manual playback.');
  } finally {
    reduced.remove();
  }
  const author = await createPage(true);
  try {
    const hero = author.contentDocument.querySelector('.campaign-hero');
    const initialHeight = hero.getBoundingClientRect().height;
    const heights = await resizeToContent(author);
    assert(
      heights.every((height) => height === initialHeight),
      `Editor iframe resizing must not grow the hero: ${initialHeight} -> ${heights.join(' -> ')}.`,
    );
    const settledHeight = author.contentWindow.innerHeight;
    await resizeToContent(author);
    assert(author.contentWindow.innerHeight === settledHeight, 'Editor document height converges.');
    assertMediaCoverage(author);

    hero.dispatchEvent(new author.contentWindow.CustomEvent('aue:content-update', {
      bubbles: true,
      detail: {
        request: { target: { resource } },
        response: { updates: [{ content: heroMarkup(true, 'Un titre modifié dans Universal Editor') }] },
      },
    }));
    await waitFor(() => author.contentDocument.querySelector('.campaign-hero[data-block-status="loaded"] h1')
      ?.textContent === 'Un titre modifié dans Universal Editor');
    const updated = author.contentDocument.querySelector('.campaign-hero');
    const updatedHeight = updated.getBoundingClientRect().height;
    const updatedHeights = await resizeToContent(author);
    assert(
      updatedHeights.every((height) => height === updatedHeight),
      'Editing the hero must not restart the iframe growth loop.',
    );
    const title = updated.querySelector('h1').getBoundingClientRect();
    const bounds = updated.getBoundingClientRect();
    assert(title.top >= bounds.top && title.bottom <= bounds.bottom, 'Edited title stays inside the hero.');
    assert(updated.getAttribute('data-aue-resource') === resource, 'Hero instrumentation survives the update.');
    assertMediaCoverage(author);
  } finally {
    author.remove();
  }

  const publicPage = await createPage(false);
  try {
    const hero = publicPage.contentDocument.querySelector('.campaign-hero');
    assert(
      hero.getBoundingClientRect().height === publicPage.contentWindow.innerHeight,
      'Public hero keeps its full-viewport height.',
    );
    publicPage.style.height = '1000px';
    await waitFor(() => publicPage.contentWindow.innerHeight === 1000);
    assert(hero.getBoundingClientRect().height === 1000, 'Public hero follows viewport height changes.');
    assertMediaCoverage(publicPage);
  } finally {
    publicPage.remove();
  }
  results.dataset.status = 'passed';
  results.textContent = `${count} assertions passed`;
}

run().catch((error) => {
  results.dataset.status = 'failed';
  results.textContent = `${count} assertions passed; ${error.stack}`;
});
