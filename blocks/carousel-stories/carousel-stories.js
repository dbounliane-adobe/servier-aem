import { moveInstrumentation } from '../../scripts/scripts.js';

const LABELS = {
  fr: {
    roleDescription: 'Carrousel',
    controls: 'Contrôles du carrousel',
    previous: 'Diapositive précédente',
    next: 'Diapositive suivante',
    show: (n, total) => `Afficher la diapositive ${n} sur ${total}`,
  },
  en: {
    roleDescription: 'Carousel',
    controls: 'Carousel slide controls',
    previous: 'Previous slide',
    next: 'Next slide',
    show: (n, total) => `Show slide ${n} of ${total}`,
  },
};

const ARROW_ICON = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16"><path stroke="currentColor" stroke-linecap="round" d="M7.5 1v14.5m5-10L7.9.9c-.2-.2-.5-.2-.7 0L2.6 5.5"/></svg>';

const SWIPE_THRESHOLD = 50;

let carouselId = 0;

function getLabels() {
  return document.documentElement.lang?.startsWith('fr') ? LABELS.fr : LABELS.en;
}

function updateActiveSlide(block, slideIndex) {
  const slides = block.querySelectorAll('.carousel-stories-slide');
  block.dataset.activeSlide = slideIndex;
  slides.forEach((slide, idx) => {
    const active = idx === slideIndex;
    slide.setAttribute('aria-hidden', String(!active));
    // keep hidden slides out of the tab order (not inert, so Universal Editor can select them)
    slide.querySelectorAll('a, button').forEach((el) => {
      if (active) el.removeAttribute('tabindex');
      else el.setAttribute('tabindex', '-1');
    });
  });
  // like the source, the carousel does not loop: arrows are disabled at both ends
  const prev = block.querySelector('.carousel-stories-prev');
  const next = block.querySelector('.carousel-stories-next');
  if (prev) prev.setAttribute('aria-disabled', String(slideIndex === 0));
  if (next) next.setAttribute('aria-disabled', String(slideIndex === slides.length - 1));
}

function showSlide(block, slideIndex) {
  const slides = block.querySelectorAll('.carousel-stories-slide');
  if (!slides.length) return;
  const index = Math.min(Math.max(slideIndex, 0), slides.length - 1);
  const current = Number(block.dataset.activeSlide);
  if (index === current) return;
  // focus would be left inside a hidden slide (thumbnail click): move it to the new slide
  const moveFocus = slides[current]?.contains(document.activeElement);
  updateActiveSlide(block, index);
  if (moveFocus) slides[index].focus({ preventScroll: true });
}

function createSlide(row, index, id) {
  const slide = document.createElement('li');
  slide.className = 'carousel-stories-slide';
  slide.id = `carousel-stories-${id}-slide-${index}`;
  slide.dataset.slideIndex = index;
  slide.tabIndex = -1;
  moveInstrumentation(row, slide);

  const cells = [...row.children];
  const mediaCell = cells.find((cell) => cell.querySelector('picture, img'));
  const contentCell = cells.find((cell) => cell !== mediaCell && cell.textContent.trim());

  if (contentCell) {
    contentCell.className = 'carousel-stories-slide-content';
    const heading = contentCell.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      const intro = document.createElement('div');
      intro.className = 'carousel-stories-slide-heading';
      intro.append(heading);
      const body = document.createElement('div');
      body.className = 'carousel-stories-slide-body';
      body.append(...contentCell.childNodes);
      contentCell.replaceChildren(intro, body);
      if (!heading.id) heading.id = `${slide.id}-title`;
      slide.setAttribute('aria-labelledby', heading.id);
    }
    slide.append(contentCell);
  }

  const media = document.createElement('div');
  media.className = 'carousel-stories-slide-media';
  if (mediaCell) {
    mediaCell.className = 'carousel-stories-slide-image';
    media.append(mediaCell);
  }
  slide.append(media);
  return slide;
}

function clonePicture(picture) {
  const clone = picture.cloneNode(true);
  [clone, ...clone.querySelectorAll('*')].forEach((el) => {
    [...el.attributes].filter((a) => a.name.startsWith('data-aue') || a.name.startsWith('data-richtext'))
      .forEach((a) => el.removeAttribute(a.name));
  });
  clone.querySelectorAll('img').forEach((img) => {
    img.alt = '';
    img.loading = 'lazy';
  });
  return clone;
}

/**
 * Like the source, each slide shows the images of all slides in their original order:
 * its own (authored) image is the large one, the others are thumbnails that open their slide.
 */
function addThumbnails(block, slides, labels) {
  const pictures = slides.map((slide) => slide.querySelector('.carousel-stories-slide-image picture'));
  slides.forEach((slide, idx) => {
    const media = slide.querySelector('.carousel-stories-slide-media');
    const ownImage = media.querySelector('.carousel-stories-slide-image');
    const items = pictures.map((picture, target) => {
      if (target === idx) return ownImage;
      if (!picture) return null;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'carousel-stories-thumbnail';
      button.setAttribute('aria-label', labels.show(target + 1, slides.length));
      button.setAttribute('aria-controls', slides[target].id);
      button.append(clonePicture(picture));
      button.addEventListener('click', () => showSlide(block, target));
      return button;
    }).filter(Boolean);
    media.replaceChildren(...items);
  });
}

function bindSwipe(block, track) {
  let startX = null;
  track.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
  }, { passive: true });
  track.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const delta = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    showSlide(block, Number(block.dataset.activeSlide) + (delta < 0 ? 1 : -1));
  }, { passive: true });
}

export default function decorate(block) {
  carouselId += 1;
  const id = carouselId;
  const labels = getLabels();
  const rows = [...block.children];

  block.id = block.id || `carousel-stories-${id}`;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', labels.roleDescription);

  const track = document.createElement('ul');
  track.className = 'carousel-stories-slides';
  track.id = `${block.id}-slides`;
  const slides = rows.map((row, idx) => createSlide(row, idx, id));
  track.append(...slides);

  const stage = document.createElement('div');
  stage.className = 'carousel-stories-stage';
  stage.append(track);
  block.replaceChildren(stage);
  block.style.setProperty('--carousel-stories-count', slides.length);

  if (slides.length < 2) {
    block.classList.add('carousel-stories-single');
    updateActiveSlide(block, 0);
    return;
  }

  addThumbnails(block, slides, labels);

  const controls = document.createElement('div');
  controls.className = 'carousel-stories-controls';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', labels.controls);
  ['prev', 'next'].forEach((dir) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `carousel-stories-${dir}`;
    button.setAttribute('aria-label', dir === 'prev' ? labels.previous : labels.next);
    button.setAttribute('aria-controls', track.id);
    button.innerHTML = ARROW_ICON;
    button.addEventListener('click', () => {
      if (button.getAttribute('aria-disabled') === 'true') return;
      showSlide(block, Number(block.dataset.activeSlide) + (dir === 'prev' ? -1 : 1));
    });
    controls.append(button);
  });
  stage.prepend(controls);

  updateActiveSlide(block, 0);
  bindSwipe(block, track);
}
