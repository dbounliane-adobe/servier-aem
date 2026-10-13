export function decorateRows(block, names) {
  [...block.children].forEach((row, index) => {
    if (names[index]) row.classList.add(names[index]);
  });
}

export function decorateCTA(element) {
  element?.querySelectorAll('a').forEach((link) => {
    if (!link.querySelector('img')) link.classList.add('button', 'primary');
  });
}

export function createDate(value) {
  const time = document.createElement('time');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    // eslint-disable-next-line no-console
    console.warn(`Invalid publication date: ${value}`);
    time.textContent = value;
  } else {
    time.dateTime = date.toISOString();
    time.textContent = new Intl.DateTimeFormat(document.documentElement.lang || 'fr', {
      day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
    }).format(date);
  }
  return time;
}
