/**
 * Cover banner: full-bleed background photo with a tinted overlay and
 * left-aligned heading, paragraphs and call-to-action buttons.
 * Rows are identified by content so authors can omit the image or reorder rows.
 */

function isLinkOnly(p) {
  const link = p.querySelector('a');
  return link && !link.querySelector('img') && p.textContent.trim() === link.textContent.trim();
}

/* wrap consecutive link-only paragraphs so the buttons sit side by side */
function groupActions(cell) {
  let group = null;
  [...cell.children].forEach((child) => {
    if (child.tagName === 'P' && isLinkOnly(child)) {
      if (!group) {
        group = document.createElement('div');
        group.className = 'hero-cover-actions';
        child.before(group);
      }
      group.append(child);
    } else {
      group = null;
    }
  });
}

export default function decorate(block) {
  const rows = [...block.children];
  const mediaRow = rows.find((row) => row.querySelector('picture, img'));
  const contentRows = rows.filter((row) => row !== mediaRow);

  if (mediaRow) {
    mediaRow.classList.add('hero-cover-media');
    mediaRow.querySelectorAll('img').forEach((img) => {
      img.loading = 'lazy';
      img.alt = img.alt || '';
    });
  } else {
    block.classList.add('hero-cover-no-image');
  }

  contentRows.forEach((row) => {
    if (!row.textContent.trim()) {
      row.remove();
      return;
    }
    row.classList.add('hero-cover-content');
    [...row.children].forEach(groupActions);
  });
}
