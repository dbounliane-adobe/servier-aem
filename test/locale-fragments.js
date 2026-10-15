import { getLocalePrefix, getFragmentPaths, fetchSiteFragment } from '../scripts/locale-fragments.js';
import header from '../blocks/header/header.js';
import footer from '../blocks/footer/footer.js';

const results = document.getElementById('results');
let count = 0;
function assert(condition, message) {
  if (!condition) throw new Error(message);
  count += 1;
}

async function run() {
  assert(getLocalePrefix('/master/fr/article') === '/master/fr', 'French locale.');
  assert(getLocalePrefix('/master/en') === '/master/en', 'Locale landing page.');
  assert(getLocalePrefix('/master/fr-CA/article') === '/master/fr-CA', 'Regional locale.');
  assert(getLocalePrefix('/master/en_us/article') === '/master/en_us', 'AEM underscore locale.');
  assert(getLocalePrefix('/content/site/master/en_us/article') === '/content/site/master/en_us', 'Author underscore locale.');
  assert(getLocalePrefix('/content/site/master/fr/article') === '/content/site/master/fr', 'Author locale.');
  assert(getLocalePrefix('/fr/fr/article') === '/fr/fr', 'Country and language may be identical.');
  assert(getLocalePrefix('/fr/en/article') === '/fr/en', 'Country and language may differ.');
  assert(getLocalePrefix('/canada/fr-CA/article') === '/canada/fr-CA', 'Arbitrary locale parent folder.');
  assert(getLocalePrefix('/content/site/fr/en/article') === '/content/site/fr/en', 'Author country and language.');
  assert(getLocalePrefix('/content/en/article') === '', 'Author root is not mistaken for a locale.');
  assert(getLocalePrefix('/') === '', 'Homepage stays at root.');
  assert(getLocalePrefix('/newsroom/dossiers/article') === '', 'Non-localized pages stay at root.');
  const originalURL = window.location.href;
  const originalFetch = window.fetch;
  try {
    await ['nav', 'footer'].reduce(async (previous, name) => {
      await previous;
      const requests = [];
      let missing = false;
      let status = 200;
      window.fetch = async (path) => {
        requests.push(path);
        const response = new Response('<div><p><a href="/">Servier</a></p></div>', {
          status: missing && path.startsWith('/master/') ? 404 : status,
        });
        Object.defineProperty(response, 'url', { value: new URL(path, window.location).href });
        return response;
      };
      window.history.replaceState(null, '', '/master/fr/newsroom/article');
      assert(getFragmentPaths(name)[0] === `/master/fr/${name}.plain.html`, 'Localized path first.');
      const block = document.createElement('div');
      document.body.append(block);
      const decorate = name === 'nav' ? header : footer;
      await decorate(block);
      assert(requests.join() === `/master/fr/${name}.plain.html`, 'Localized fragment loads without fallback.');
      assert(block.textContent.includes('Servier'), 'Localized block renders content.');
      requests.length = 0;
      missing = true;
      await decorate(block);
      assert(requests.join() === `/master/fr/${name}.plain.html,/${name}.plain.html`, '404 falls back directly to root.');
      assert(block.textContent.includes('Servier'), 'Root fallback renders content.');
      missing = false;
      await ['/fr/fr', '/fr/en', '/canada/fr-CA', '/content/site/fr/en', '/master/en_us', '/content/site/master/en_us'].reduce(async (prior, prefix) => {
        await prior;
        requests.length = 0;
        window.history.replaceState(null, '', `${prefix}/article`);
        await decorate(block);
        assert(requests.join() === `${prefix}/${name}.plain.html`, `Fragment loads from ${prefix}.`);
        assert(block.textContent.includes('Servier'), `Fragment renders from ${prefix}.`);
      }, Promise.resolve());
      requests.length = 0;
      window.history.replaceState(null, '', '/newsroom/article');
      await decorate(block);
      assert(requests.join() === `/${name}.plain.html`, 'Root pages load root fragments.');

      const meta = document.createElement('meta');
      meta.name = name;
      meta.content = `/custom/${name}.html`;
      document.head.append(meta);
      try {
        requests.length = 0;
        window.history.replaceState(null, '', '/master/fr/article');
        await decorate(block);
        assert(requests.join() === `/custom/${name}.plain.html`, 'Metadata overrides locale.');
      } finally {
        meta.remove();
      }
      status = 503;
      missing = false;
      requests.length = 0;
      let failed = false;
      try {
        await fetchSiteFragment(name);
      } catch (error) {
        failed = error.message.includes('503');
      }
      assert(failed && requests.length === 1, 'Non-404 failures remain explicit without fallback.');
      block.remove();
    }, Promise.resolve());
  } finally {
    window.history.replaceState(null, '', originalURL);
    window.fetch = originalFetch;
  }
  results.dataset.status = 'passed';
  results.textContent = `${count} assertions passed`;
}

run().catch((error) => {
  results.dataset.status = 'failed';
  results.textContent = `${count} assertions passed; ${error.stack}`;
});
