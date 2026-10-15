/**
 * Share links: the author only sets the label ("Partager sur :"); the network
 * links are built from the current page URL and title. Default networks match
 * the source (Facebook, X, LinkedIn, copy link); the "email" option adds a mail link.
 */

const OPTION_CLASSES = ['email'];

const ICONS = {
  facebook: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false"><path fill="currentColor" d="M9.6.4a9.6 9.6 0 0 0-2.319 18.917v-6.383h-1.98V10h1.98V8.736c0-3.268 1.479-4.782 4.687-4.782.608 0 1.658.12 2.087.238v2.66c-.227-.024-.62-.036-1.11-.036-1.573 0-2.181.596-2.181 2.146V10h3.135l-.538 2.934h-2.598v6.596c4.754-.575 8.437-4.622 8.437-9.53 0-5.302-4.298-9.6-9.6-9.6Z"/></svg>',
  x: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false"><path fill="currentColor" d="M14.86 1.923h2.7l-5.896 6.739 6.936 9.17h-5.431L8.915 12.27l-4.867 5.562h-2.7l6.306-7.208L1 1.923h5.569l3.845 5.083 4.447-5.083Zm-.946 14.293h1.495L5.756 3.453H4.151l9.763 12.763Z"/></svg>',
  linkedin: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false"><path fill="currentColor" d="M18.379.4H2.018C1.234.4.6 1.019.6 1.784v16.428c0 .765.634 1.388 1.418 1.388h16.36c.785 0 1.422-.623 1.422-1.384V1.784C19.8 1.019 19.163.4 18.38.4ZM6.296 16.76h-2.85V7.596h2.85v9.165ZM4.871 6.347a1.65 1.65 0 1 1-.005-3.301 1.65 1.65 0 0 1 .005 3.301Zm12.09 10.414h-2.846v-4.455c0-1.061-.019-2.43-1.481-2.43-1.481 0-1.706 1.159-1.706 2.355v4.53H8.085V7.596h2.73V8.85h.038c.378-.72 1.308-1.482 2.692-1.482 2.884 0 3.416 1.898 3.416 4.365v5.03Z"/></svg>',
  email: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" d="M2 4.5h16v11H2zM2 5l8 6 8-6"/></svg>',
  copy: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="19" viewBox="0 0 18 19" fill="none" aria-hidden="true" focusable="false"><path fill="currentColor" d="m8.416 14.605-1.84 1.917c-.561.58-1.316.906-2.104.906a2.92 2.92 0 0 1-2.102-.906 3.1 3.1 0 0 1-.638-1 3.2 3.2 0 0 1 0-2.36c.148-.374.365-.714.638-1L5.88 8.51a2.920 2.920 0 0 1 2.102-.906c.787 0 1.542.325 2.102.906.357.371.615.834.749 1.343q.11-.096.202-.212L12 8.635a4.6 4.6 0 0 0-.86-1.272A4.38 4.38 0 0 0 7.982 6c-1.183 0-2.317.49-3.158 1.363l-3.517 3.684a4.7 4.7 0 0 0-.967 1.51 4.84 4.84 0 0 0 0 3.570c.224.565.553 1.079.967 1.510A4.38 4.38 0 0 0 4.465 19c1.182 0 2.317-.49 3.158-1.363l2.730-2.843H9.980a5.7 5.7 0 0 1-1.564-.189"/><path fill="currentColor" d="M16.71 1.363A4.4 4.4 0 0 0 13.55 0c-1.184 0-2.32.49-3.161 1.363L7.655 4.206h.367c.531 0 1.06.074 1.573.22l1.842-1.916a2.93 2.93 0 0 1 2.105-.906c.787 0 1.544.325 2.104.906.273.286.49.625.638 1a3.2 3.2 0 0 1 0 2.36 3.1 3.1 0 0 1-.638 1l-3.512 3.652c-.56.58-1.317.906-2.105.906a2.93 2.93 0 0 1-2.104-.906 3.07 3.07 0 0 1-.75-1.343 1.5 1.5 0 0 0-.209.18L6 10.365c.216.472.508.902.861 1.272A4.4 4.4 0 0 0 10.021 13c1.184 0 2.32-.49 3.161-1.363l3.513-3.652c.413-.432.742-.946.966-1.511a4.85 4.85 0 0 0 0-3.569 4.7 4.7 0 0 0-.966-1.51z"/></svg>',
};

/* accessible fallbacks only (not visible copy) */
const STRINGS = {
  fr: {
    label: 'Partager sur :', shareOn: (n) => `Partager sur ${n}`, email: 'Partager par e-mail', copy: 'Copier le lien', copied: 'Lien copié !', newWindow: '(nouvelle fenêtre)',
  },
  en: {
    label: 'Share on:', shareOn: (n) => `Share on ${n}`, email: 'Share by email', copy: 'Copy link', copied: 'Link copied!', newWindow: '(opens in a new window)',
  },
};

function getStrings() {
  const lang = (document.documentElement.lang || 'fr').slice(0, 2).toLowerCase();
  return STRINGS[lang] || STRINGS.fr;
}

function getShareData() {
  const canonical = document.querySelector('link[rel="canonical"]')?.href;
  const url = canonical || `${window.location.origin}${window.location.pathname}`;
  const title = document.querySelector('meta[property="og:title"]')?.content
    || document.querySelector('main h1')?.textContent.trim()
    || document.title;
  return { url, title };
}

function createLink(href, icon, label, external, strings) {
  const a = document.createElement('a');
  a.className = 'share-social-button';
  a.href = href;
  a.innerHTML = icon;
  a.setAttribute('aria-label', external ? `${label} ${strings.newWindow}` : label);
  a.title = label;
  if (external) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
  const li = document.createElement('li');
  li.append(a);
  return li;
}

function createCopyButton(url, strings) {
  const li = document.createElement('li');
  li.className = 'share-social-copy';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'share-social-button';
  button.innerHTML = ICONS.copy;
  button.setAttribute('aria-label', strings.copy);
  button.title = strings.copy;

  const feedback = document.createElement('span');
  feedback.className = 'share-social-feedback';
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');

  let timer;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
      feedback.textContent = strings.copied;
      li.classList.add('is-copied');
      clearTimeout(timer);
      timer = setTimeout(() => {
        li.classList.remove('is-copied');
        feedback.textContent = '';
      }, 2000);
    } catch {
      window.prompt(strings.copy, url); // eslint-disable-line no-alert
    }
  });

  li.append(button, feedback);
  return li;
}

export default function decorate(block) {
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));
  const strings = getStrings();
  const { url, title } = getShareData();
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);

  // authored label (first non-empty cell); keep the element so UE instrumentation survives
  const labelCell = [...block.querySelectorAll(':scope > div > div')].find((c) => c.textContent.trim());
  const label = document.createElement('p');
  label.className = 'share-social-label';
  label.id = `share-social-label-${Math.random().toString(36).slice(2, 8)}`;
  if (labelCell) {
    labelCell.classList.add('share-social-label');
    labelCell.id = label.id;
  } else {
    label.textContent = strings.label;
  }

  const list = document.createElement('ul');
  list.className = 'share-social-list';
  list.setAttribute('aria-labelledby', label.id);
  list.append(
    createLink(`https://www.facebook.com/sharer/sharer.php?u=${u}`, ICONS.facebook, strings.shareOn('Facebook'), true, strings),
    createLink(`https://twitter.com/intent/tweet?text=${t}&url=${u}`, ICONS.x, strings.shareOn('X (Twitter)'), true, strings),
    createLink(`https://www.linkedin.com/shareArticle?mini=true&url=${u}&title=${t}`, ICONS.linkedin, strings.shareOn('LinkedIn'), true, strings),
  );
  if (active.includes('email')) {
    list.append(createLink(`mailto:?subject=${t}&body=${u}`, ICONS.email, strings.email, false, strings));
  }
  list.append(createCopyButton(url, strings));

  block.replaceChildren(labelCell || label, list);
}
