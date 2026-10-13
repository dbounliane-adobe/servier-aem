import { decorateRows, decorateCTA } from '../../scripts/block-utils.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  decorateRows(block, ['campaign-hero-media', 'campaign-hero-content', 'campaign-hero-video']);
  const content = block.querySelector('.campaign-hero-content');
  decorateCTA(content);
  const image = block.querySelector('.campaign-hero-media img');
  if (image) {
    image.loading = 'eager';
    image.fetchPriority = 'high';
  }
  const videoCell = block.querySelector('.campaign-hero-video > div');
  const link = videoCell?.querySelector('a');
  if (!link) return;
  const source = new URL(link.href);
  if (!['http:', 'https:'].includes(source.protocol)) {
    throw new Error('Campaign hero requires an HTTP(S) video URL.');
  }
  const video = document.createElement('video');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'none';
  video.setAttribute('aria-hidden', 'true');
  if (image) video.poster = image.src;
  moveInstrumentation(videoCell, video);
  videoCell.replaceChildren(video);
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'campaign-hero-toggle';
  const french = document.documentElement.lang.startsWith('fr');
  const playLabel = french ? 'Lire la vidéo' : 'Play video';
  const pauseLabel = french ? 'Mettre en pause' : 'Pause video';
  const update = () => {
    toggle.textContent = video.paused ? playLabel : pauseLabel;
    toggle.setAttribute('aria-pressed', String(!video.paused));
  };
  const play = async () => {
    if (!video.src) video.src = source.href;
    try {
      await video.play();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Campaign hero video playback failed', error);
      toggle.textContent = french ? 'Vidéo indisponible' : 'Video unavailable';
    }
  };
  video.addEventListener('play', update);
  video.addEventListener('pause', update);
  video.addEventListener('error', () => {
    video.hidden = true;
    toggle.disabled = true;
    toggle.textContent = french ? 'Vidéo indisponible' : 'Video unavailable';
    // eslint-disable-next-line no-console
    console.error('Campaign hero video could not be loaded', source.href);
  });
  let autoplayTimer;
  toggle.addEventListener('click', () => {
    window.clearTimeout(autoplayTimer);
    if (video.paused) play();
    else video.pause();
  });
  update();
  block.append(toggle);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) video.pause();
  });
  if (!reducedMotion.matches) {
    autoplayTimer = window.setTimeout(() => {
      if (block.isConnected && !reducedMotion.matches) play();
    }, 3000);
  }
}
