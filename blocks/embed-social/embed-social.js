import { moveInstrumentation } from '../../scripts/scripts.js';

const ELFSIGHT_SCRIPT = 'https://elfsightcdn.com/platform.js';
const ELFSIGHT_ID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

let elfsightLoader;

function loadElfsight() {
  if (!elfsightLoader) {
    elfsightLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = ELFSIGHT_SCRIPT;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${ELFSIGHT_SCRIPT}`));
      document.head.append(script);
    });
  }
  return elfsightLoader;
}

/**
 * Resolves once the page has finished loading and the browser is idle,
 * so the third-party widget never competes with LCP (delayed phase).
 */
function afterPageLoad() {
  const loaded = document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise((resolve) => { window.addEventListener('load', resolve, { once: true }); });
  return loaded.then(() => new Promise((resolve) => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(resolve, { timeout: 3000 });
    else setTimeout(resolve, 0);
  }));
}

function whenNearViewport(element) {
  return new Promise((resolve) => {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        resolve();
      }
    }, { rootMargin: '400px 0px' });
    observer.observe(element);
  });
}

/**
 * Resolves once the third-party script has rendered markup into the widget element, or after
 * `timeout` ms (e.g. the widget is not allowed on this domain), so the reserved space is only
 * released once there is content to replace it.
 */
function whenRendered(widget, timeout = 10000) {
  if (widget.childElementCount) return Promise.resolve();
  return new Promise((resolve) => {
    let timer;
    const observer = new MutationObserver(() => {
      if (!widget.childElementCount) return;
      observer.disconnect();
      clearTimeout(timer);
      resolve();
    });
    timer = setTimeout(() => {
      observer.disconnect();
      resolve();
    }, timeout);
    observer.observe(widget, { childList: true });
  });
}

function readSource(cell) {
  if (!cell) return '';
  const link = cell.querySelector('a');
  return (link?.href || cell.textContent || '').trim();
}

function toHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

export default function decorate(block) {
  const [sourceRow, titleRow] = [...block.children];
  const source = readSource(sourceRow?.firstElementChild || sourceRow);
  const defaultTitle = document.documentElement.lang?.startsWith('fr')
    ? 'Fil d’actualités des réseaux sociaux'
    : 'Social media feed';
  const title = titleRow?.textContent.trim() || defaultTitle;

  const container = document.createElement('div');
  container.className = 'embed-social-container';
  if (sourceRow) moveInstrumentation(sourceRow, container);

  const appId = source.match(ELFSIGHT_ID)?.[0];
  const url = toHttpsUrl(source);

  if (appId) {
    const widget = document.createElement('div');
    widget.className = `elfsight-app-${appId}`;
    widget.setAttribute('role', 'region');
    widget.setAttribute('aria-label', title);
    container.append(widget);
    block.classList.add('embed-social-loading');
    Promise.all([afterPageLoad(), whenNearViewport(block)])
      .then(loadElfsight)
      .then(() => whenRendered(widget))
      .then(() => block.classList.remove('embed-social-loading'))
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.warn('Social feed widget could not be loaded', error);
        block.classList.remove('embed-social-loading');
        if (url) {
          const fallback = document.createElement('a');
          fallback.href = url.href;
          fallback.textContent = title;
          container.replaceChildren(fallback);
        }
      });
  } else if (url) {
    // No embeddable widget (e.g. a LinkedIn company page): link out instead of framing it.
    const link = document.createElement('a');
    link.href = url.href;
    link.textContent = title;
    link.className = 'button secondary';
    container.append(link);
  } else {
    // eslint-disable-next-line no-console
    console.warn('embed-social: expected an Elfsight widget id or an https URL, got', source);
  }

  block.replaceChildren(container);
}
