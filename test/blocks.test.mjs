/* eslint-env node */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import {
  dirname, extname, join, resolve, sep,
} from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const chrome = process.env.CHROME_BIN;
const image = '<picture><img src="/test-image.svg" alt="Fixture" width="900" height="600"></picture>';
const videoURL = '/fixture-video.mp4?version=1';
const fixture = (content) => `<div><div>${content}</div></div>`;
const hero = (classes, content, media = image) => `<div class="hero ${classes}">
  ${fixture(media)}${fixture(content)}</div>`;
const page = (reduced) => `<!doctype html><html lang="fr"><head>
  <meta name="template" content="article"><meta name="language" content="fr">
  <link rel="stylesheet" href="/styles/styles.css">
  <script type="module" src="/scripts/aem.js"></script>
  <script type="module" src="/scripts/scripts.js"></script>
</head><body><header></header><main>
  <div>${hero('full-screen', '<h1>Fixture title</h1><p>Fixture body</p>')}</div>
  <div>${hero('banner', '<h2>Fixture banner</h2>')}</div>
  <div>${hero(
    'cover',
    '<h2>Fixture video</h2><p><a href="/destination">CTA</a></p>',
    `${image}<p><a data-aue-prop="image_video" href="${videoURL}">Video</a></p>`,
  )}</div>
  <div>${hero('', '<h2>Fixture linked poster</h2>', `<a href="/poster">${image}</a>`)}</div>
  <div><div class="hero">${fixture('<h2>Fixture without media</h2>')}</div></div>
  <div><div class="breadcrumbs" data-aue-resource="fixture-breadcrumbs">
    <div><div>label</div><div>Fixture navigation</div></div>
    <div><div>trail</div><div data-aue-prop="trail"><ol>
      <li><a href="/">Home</a></li><li>Current</li></ol></div></div></div>
    <div class="callout">${fixture('<h2>Fixture aside</h2>')}
      ${fixture('<p>Reference <a href="#ref-1"><sup>1</sup></a></p>')}</div></div>
  <div><div class="cards news"><div data-aue-resource="fixture-card">
    <div>${image}</div><div><h3>Fixture card</h3><p><a href="/card">Link</a></p></div>
    </div></div></div>
  <div><div class="cards carousel"><div><div>${image}</div>
    <div><h3>Fixture collection</h3></div></div></div></div>
  <div><div class="columns figures"><div><div><h3>42</h3><p>Fixture metric</p></div>
    <div><h3>84</h3><p>Fixture metric</p></div></div></div></div>
  <div><div class="columns feature"><div><div>${image}</div>
    <div><h2>Fixture feature</h2><p>Fixture body</p></div></div></div></div>
  <div><p id="ref-1">Fixture reference</p></div>
</main><footer></footer><pre id="results">pending</pre>
<script type="module">
  const results = [];
  const check = (condition, label) => {
    if (!condition) throw new Error(label);
    results.push(label);
  };
  try {
    const [{ default: decorateBreadcrumbs }, { default: decorateHero }] = await Promise.all([
      import('/blocks/breadcrumbs/breadcrumbs.js'), import('/blocks/hero/hero.js'),
    ]);
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (document.querySelectorAll('main [data-block-status="loaded"]').length === 11) break;
      await new Promise((done) => setTimeout(done, 25));
    }
    check(document.querySelectorAll('main [data-block-status="loaded"]').length === 11,
      'all authored blocks load through the actual EDS pipeline');
    check(document.documentElement.lang === 'fr', 'authored page language');
    check(document.body.classList.contains('article'), 'article metadata');
    check(document.querySelector('h1').textContent === 'Fixture title', 'authored title preserved');
    check(document.querySelector('.hero-media img').alt === 'Fixture', 'image alt preserved');
    const video = document.querySelector('.hero video');
    check(video && new URL(video.src).pathname === '/fixture-video.mp4'
      && new URL(video.src).search === '?version=1', 'video source preserved');
    check(video.poster.endsWith('/test-image.svg'), 'video poster preserved');
    check(video.muted && video.loop && video.playsInline && video.controls, 'video controls');
    check(video.autoplay === ${!reduced}, 'reduced-motion autoplay policy');
    check(video.dataset.aueProp === 'image_video', 'video editor instrumentation');
    check(document.querySelector('.hero.cover a').getAttribute('href') === '/destination',
      'CTA is not consumed as media');
    check(document.querySelector('.hero a[href="/poster"] picture'), 'linked image preserved');
    check(document.querySelector('h2').textContent === 'Fixture banner', 'banner heading preserved');
    check(document.querySelector('.breadcrumbs nav').getAttribute('aria-label')
      === 'Fixture navigation', 'authored breadcrumb label');
    check(document.querySelector('.breadcrumbs nav').dataset.aueProp === 'trail',
      'breadcrumb editor instrumentation');
    check(document.querySelector('.breadcrumbs [aria-current="page"]').textContent
      === 'Current', 'breadcrumb current page');
    check(document.querySelector('.breadcrumbs a').getAttribute('href') === '/',
      'breadcrumb source link');
    check(document.querySelector('.callout').getAttribute('role') === 'note', 'aside semantics');
    check(document.querySelector('.callout a').hash === '#ref-1'
      && document.getElementById('ref-1'), 'reference destination preserved');
    check(document.querySelector('.cards li').dataset.aueResource === 'fixture-card',
      'card editor instrumentation');
    check(document.querySelector('.cards img').alt === 'Fixture', 'card image alt preserved');
    check(document.querySelector('.cards.carousel ul').tabIndex === 0, 'keyboard scrolling');
    check(document.querySelector('.columns.feature .columns-img-col'), 'feature image column');
    const empty = document.createElement('div');
    decorateBreadcrumbs(empty);
    decorateHero(empty);
    check(empty.children.length === 0, 'empty optional content');
    const currentLink = document.createElement('div');
    currentLink.innerHTML = '<div><div>trail</div><div><ol><li><a href="/">Current</a>'
      + '</li></ol></div></div>';
    decorateBreadcrumbs(currentLink);
    check(currentLink.querySelector('a').getAttribute('aria-current') === 'page',
      'linked current breadcrumb');
    const width = window.innerWidth;
    check(document.documentElement.scrollWidth <= width, 'no viewport overflow');
    check(getComputedStyle(document.querySelector('.columns.figures > div')).flexDirection
      === (width >= 900 ? 'row' : 'column'), 'responsive figures');
    check(getComputedStyle(document.querySelector('.callout')).gridTemplateColumns.split(' ').length
      === (width >= 900 ? 2 : 1), 'responsive callout');
    check(parseFloat(getComputedStyle(document.querySelector('.hero')).minHeight) >= 360,
      'hero minimum height');
    document.getElementById('results').dataset.status = 'passed';
    document.getElementById('results').textContent = JSON.stringify(results);
  } catch (error) {
    document.getElementById('results').dataset.status = 'failed';
    document.getElementById('results').textContent = error.stack;
  }
</script></body></html>`;

test('Universal Editor catalogs reference the declared models and blocks', async () => {
  const [definitions, models, filters] = await Promise.all([
    'component-definition.json', 'component-models.json', 'component-filters.json',
  ].map(async (name) => JSON.parse(await readFile(join(root, name), 'utf8'))));
  const modelIds = new Set(models.map((model) => model.id));
  const filterIds = new Set(filters.map((filter) => filter.id));
  const components = definitions.groups.flatMap((group) => group.components);
  const componentIds = new Set(components.map((component) => component.id));
  assert.equal(componentIds.size, components.length, 'unique component IDs');
  assert.equal(modelIds.size, models.length, 'unique model IDs');
  assert.equal(filterIds.size, filters.length, 'unique filter IDs');
  components.forEach((component) => {
    const { template } = component.plugins.xwalk.page;
    if (template.model) assert.ok(modelIds.has(template.model), component.id);
    if (template.filter) assert.ok(filterIds.has(template.filter), component.id);
  });
  const section = filters.find((filter) => filter.id === 'section');
  ['hero', 'cards', 'columns', 'callout', 'breadcrumbs'].forEach((id) => {
    assert.ok(section.components.includes(id), `${id} available in sections`);
  });
  assert.equal(components.find((component) => component.id === 'breadcrumbs')
    .plugins.xwalk.page.template['key-value'], true);
  ['hero', 'cards', 'columns'].forEach((id) => {
    assert.ok(models.find((model) => model.id === id).fields
      .some((field) => field.name === 'classes'), `${id} exposes layout options`);
  });
});

test('EDS block decoration and responsive authoring contracts', { timeout: 60000 }, async () => {
  assert.ok(chrome, 'Set CHROME_BIN to an installed Chrome executable');
  const server = createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/test.html') {
      response.setHeader('Content-Type', 'text/html');
      response.end(page(url.searchParams.has('reduced')));
      return;
    }
    if (url.pathname === '/test-image.svg') {
      response.setHeader('Content-Type', 'image/svg+xml');
      response.end('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"></svg>');
      return;
    }
    if (url.pathname === '/nav.plain.html') {
      response.end(`<div><p>${image}</p></div><div><ul><li><a href="/">Fixture</a></li>
        </ul></div><div><p>Fixture tools</p></div>`);
      return;
    }
    if (url.pathname === '/footer.plain.html') {
      response.end('<div><p>Fixture footer</p></div>');
      return;
    }
    const path = resolve(root, `.${url.pathname}`);
    if (!path.startsWith(`${root}${sep}`)) {
      response.writeHead(403).end();
      return;
    }
    try {
      const content = await readFile(path);
      const types = { '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
      response.setHeader('Content-Type', types[extname(path)] || 'application/octet-stream');
      response.end(content);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        response.writeHead(500).end(error.message);
      } else {
        response.writeHead(404).end();
      }
    }
  });
  await new Promise((done) => { server.listen(0, '127.0.0.1', done); });
  try {
    await Promise.all([[390, false], [1440, false], [390, true]].map(async ([width, reduced]) => {
      const profile = await mkdtemp(join(tmpdir(), 'servier-block-tests-'));
      try {
        const output = await new Promise((done, reject) => {
          const child = spawn(chrome, [
            '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
            '--disable-background-networking',
            `--user-data-dir=${profile}`, `--window-size=${width},1000`,
            ...(reduced ? ['--force-prefers-reduced-motion'] : []),
            '--dump-dom', '--virtual-time-budget=10000', '--timeout=15000',
            `http://127.0.0.1:${server.address().port}/test.html?rum=off${reduced ? '&reduced' : ''}`,
          ], { timeout: 20000 });
          let stdout = '';
          let stderr = '';
          child.stdout.on('data', (data) => { stdout += data; });
          child.stderr.on('data', (data) => { stderr += data; });
          child.on('error', reject);
          child.on('close', (code) => {
            if (code === 0) done(stdout);
            else reject(new Error(`Chrome exited ${code}: ${stderr}`));
          });
        });
        const result = output.match(/<pre id="results" data-status="([^"]+)">([\s\S]*?)<\/pre>/);
        assert.ok(result, `Browser completed test harness: ${output.slice(-2000)}`);
        assert.equal(result[1], 'passed', result[2]);
        const checks = JSON.parse(result[2]);
        assert.equal(checks.length, 29);
      } finally {
        await rm(profile, { recursive: true, force: true });
      }
    }));
  } finally {
    server.closeAllConnections();
    await new Promise((done) => { server.close(done); });
  }
});
