import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const rows = [...block.children];
  const media = rows.find((row) => row.querySelector('picture, video'));
  if (media) media.classList.add('hero-media');
  rows.filter((row) => row !== media).forEach((row) => row.classList.add('hero-content'));

  const link = [...(media?.querySelectorAll('a[href]') || [])]
    .find((anchor) => !anchor.querySelector('picture'));
  let video = media?.querySelector('video');
  if (link && !video && !link.querySelector('picture')) {
    video = document.createElement('video');
    video.src = link.href;
    const poster = media.querySelector('img');
    if (poster) video.poster = poster.src;
    moveInstrumentation(link, video);
    link.replaceWith(video);
  }

  if (video) {
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.controls = true;
    video.preload = 'none';
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePlayback = () => {
      video.autoplay = !motion.matches;
      if (motion.matches) video.pause();
    };
    updatePlayback();
    motion.addEventListener('change', updatePlayback);
  }
}
