// Presentation only: no saved state or storage keys.
const runningNumbers = new Map();
export const reducedMotion = () => document.documentElement.dataset.reducedMotion === 'true';

export function settleNumbers() {
  for (const finish of [...runningNumbers.values()]) finish();
}

export function countTo(element, value) {
  runningNumbers.get(element)?.();
  const old = Number(element.textContent);
  if (reducedMotion() || value <= old) {
    element.textContent = value;
    return;
  }
  const start = performance.now();
  let frame;
  const finish = () => {
    cancelAnimationFrame(frame);
    element.textContent = value;
    runningNumbers.delete(element);
  };
  const tick = now => {
    const t = Math.min(1, (now - start) / 420);
    element.textContent = Math.round(old + (value - old) * (1 - (1 - t) ** 3));
    if (t < 1) frame = requestAnimationFrame(tick);
    else finish();
  };
  runningNumbers.set(element, finish);
  frame = requestAnimationFrame(tick);
}

export function prepareTitles() {
  for (const title of document.querySelectorAll('[data-motion-title]')) {
    const accessibleTitle = document.createElement('span');
    accessibleTitle.className = 'motion-title-accessible';
    accessibleTitle.textContent = title.innerText;
    const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const total = nodes.reduce((n, node) => n + [...node.textContent].length, 0);
    let index = 0;
    for (const node of nodes) {
      const fragment = document.createDocumentFragment();
      for (const char of node.textContent) {
        const span = document.createElement('span');
        span.className = 'title-letter';
        span.setAttribute('aria-hidden', 'true');
        span.style.setProperty('--letter-delay', `${index++ * 320 / Math.max(1, total - 1)}ms`);
        span.textContent = char;
        fragment.append(span);
      }
      node.replaceWith(fragment);
    }
    title.querySelectorAll('br').forEach(br => br.setAttribute('aria-hidden', 'true'));
    title.append(accessibleTitle);
  }
}
