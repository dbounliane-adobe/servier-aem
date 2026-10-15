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

function heroMarkup(author, title = 'Bienvenue chez Servier') {
  return `<div class="campaign-hero"${author ? ` data-aue-resource="${resource}"` : ''}>
    <div><div><picture><img src="/drafts/media/science.svg" alt="Recherche"></picture></div></div>
    <div><div><h1>${title}</h1><p>La science au service des patients.</p>
      <p><a href="#suite">En savoir plus</a></p></div></div>
    <div><div></div></div>
  </div>`;
}

async function createPage(author) {
  const frame = document.createElement('iframe');
  frame.title = author ? 'Universal Editor hero' : 'Public hero';
  frame.style.width = `${width}px`;
  frame.style.height = '700px';
  frame.style.border = '0';
  fixtures.append(frame);
  frame.srcdoc = `<!DOCTYPE html><html lang="fr"><head>
    <meta name="theme" content="servier">
    <link rel="stylesheet" href="/styles/styles.css">
    <script type="module">
      import '/scripts/scripts.js';
      ${author ? "await import('/scripts/editor-support.js');" : ''}
      document.documentElement.dataset.ready = 'true';
    </script>
    </head><body><header></header><main>
      <div>${heroMarkup(author)}</div>
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
