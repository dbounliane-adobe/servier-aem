import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '..');
const browser = process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const execute = promisify(execFile);
const types = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
};
const server = createServer(async (request, response) => {
  const url = new URL(request.url, 'http://localhost');
  const file = resolve(root, `.${decodeURIComponent(url.pathname)}`);
  if (!file.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end();
    return;
  }
  try {
    const content = await readFile(file);
    response.writeHead(200, { 'Content-Type': `${types[extname(file)] || 'text/plain'}; charset=utf-8` });
    response.end(content);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      response.writeHead(500).end(error.message);
      return;
    }
    response.writeHead(404).end();
  }
});
await new Promise((done) => { server.listen(0, '127.0.0.1', done); });
const profile = await mkdtemp(resolve(tmpdir(), 'eds-mvp-'));
try {
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}${process.argv[2] || '/test/mvp.html'}`;
  // Separate processes exercise real layout at both breakpoints.
  await [390, 1440].reduce(async (previous, width) => {
    await previous;
    const { stdout } = await execute(browser, [
      '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      `--user-data-dir=${profile}`, `--window-size=${width},1000`,
      '--virtual-time-budget=20000', '--dump-dom', `${url}?width=${width}`,
    ], { timeout: 60000, maxBuffer: 4 * 1024 * 1024 });
    const result = stdout.match(/<pre id="results" data-status="([^"]+)">([\s\S]*?)<\/pre>/);
    assert.ok(result, 'Browser did not return test results.');
    assert.equal(result[1], 'passed', result[2]);
    process.stdout.write(`${width}px: ${result[2]}\n`);
  }, Promise.resolve());
} finally {
  await new Promise((done) => { server.close(done); });
  await rm(profile, { recursive: true, force: true });
}
