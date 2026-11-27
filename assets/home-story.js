// Home page scroll story. The stage is pinned while the chapters scroll over it; scroll position
// maps piecewise onto the film so each chapter lands on its own scene (data-chapters = first frame
// of sketch, colour, garden, table). Neighbouring frames are blended on the canvas, frames load
// coarse-to-fine, and only transform/opacity change on scroll.
(() => {
  const story = document.querySelector('.home-story');
  if (!story) return;
  const canvas = story.querySelector('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const count = +story.dataset.count;
  const marks = story.dataset.chapters.split(',').map(Number);
  const [dreamA, dreamB] = story.dataset.dream.split(',').map(Number);
  const chapters = [...story.querySelectorAll('.story-chapter')];
  const card = story.querySelector('.home-search');
  const dots = [...story.querySelectorAll('[data-dot]')];
  const net = navigator.connection;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (!ctx || reduce.matches || net?.saveData || /(^|slow-)2g/.test(net?.effectiveType || '')) {
    story.classList.add('static-story');
    return;
  }
  const variant = matchMedia('(max-width: 760px)').matches ? 'small' : 'large';
  const frames = new Array(count), pending = new Set();
  const order = [];
  // Coarse-to-fine: every 16th frame first, then fill in, so the whole story plays early.
  for (const step of [16, 8, 4, 2, 1])
    for (let i = 0; i < count; i += step) if (!order.includes(i)) order.push(i);
  let want = 0, drawnKey = '', queued = false, loading = 0, started = false;
  const smooth = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

  function size() {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 1.5);
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (w && (canvas.width !== w || canvas.height !== h)) { canvas.width = w; canvas.height = h; drawnKey = ''; }
  }
  function cover(img, alpha) {
    // object-fit: cover with the focal point slightly left of centre, where the bride stands.
    const cw = canvas.width, ch = canvas.height, s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, (cw - w) * 0.46, (ch - h) * 0.5, w, h);
  }
  function nearest(i) {
    for (let d = 0; d < count; d++) {
      if (frames[i - d]) return i - d;
      if (frames[i + d]) return i + d;
    }
    return -1;
  }
  function paint() {
    const base = Math.floor(want), frac = want - base;
    const a = frames[base] ? base : nearest(base);
    if (a < 0) return;
    const b = frames[base + 1] && a === base ? base + 1 : -1;
    const key = a + ':' + (b < 0 ? 0 : frac.toFixed(2));
    if (key === drawnKey) return;
    drawnKey = key;
    cover(frames[a], 1);
    if (b >= 0 && frac > 0.02) cover(frames[b], frac);
    ctx.globalAlpha = 1;
    canvas.classList.add('ready');
  }
  function load() {
    while (loading < 4) {
      // Frames near the current position jump the queue.
      let i = -1;
      for (let d = 0; d <= 3 && i < 0; d++)
        for (const k of [Math.round(want) + d, Math.round(want) - d])
          if (k >= 0 && k < count && !frames[k] && !pending.has(k)) { i = k; break; }
      if (i < 0) i = order.find(k => !frames[k] && !pending.has(k)) ?? -1;
      if (i < 0) return;
      pending.add(i); loading++;
      const img = new Image();
      img.decoding = 'async';
      img.src = `assets/home-story/${variant}/${String(i).padStart(3, '0')}.webp`;
      img.decode().then(() => { frames[i] = img; paint(); }).catch(() => {}).finally(() => { pending.delete(i); loading--; load(); });
    }
  }

  function update() {
    queued = false;
    const r = story.getBoundingClientRect(), vh = innerHeight;
    if (r.bottom < 0 || r.top > vh) return;
    // Chapter k "arrives" when its centre reaches the middle of the screen.
    const centres = chapters.map(c => { const b = c.getBoundingClientRect(); return b.top + b.height / 2 - vh / 2; });
    let t = 0; // 0..chapters-1, fractional
    if (centres[0] >= 0) t = 0;
    else if (centres[centres.length - 1] <= 0) t = chapters.length - 1;
    else for (let k = 0; k < centres.length - 1; k++)
      if (centres[k] <= 0 && centres[k + 1] > 0) { t = k + -centres[k] / (centres[k + 1] - centres[k]); break; }
    // Map chapter progress onto the film: intro→sketch start … finale→last frame.
    const k = Math.min(marks.length - 2, Math.floor(t)), f = t - k;
    want = Math.min(count - 1, marks[k] + (marks[k + 1] - marks[k]) * f);
    const p = want / (count - 1);
    story.style.setProperty('--p', p.toFixed(4));
    // The drawing stays a dream until colour has spread through the garden take.
    story.style.setProperty('--dream', (1 - smooth(dreamA, dreamB, want)).toFixed(3));
    chapters.forEach((c, i) => {
      if (c.classList.contains('story-finale')) return;
      c.style.setProperty('--focus', (1 - smooth(0.12, 0.42, Math.abs(centres[i]) / vh)).toFixed(3));
    });
    // The search card rises as the table scene settles, then stays.
    const fin = chapters[chapters.length - 1].getBoundingClientRect();
    card.style.setProperty('--pop', smooth(vh * 0.95, vh * 0.35, fin.top).toFixed(3));
    const current = Math.round(t);
    dots.forEach((d, i) => d.toggleAttribute('aria-current', i === current));
    paint();
    if (started) load();
  }
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };

  // Start fetching frames once the page has painted its first frame (keeps LCP on the still).
  const begin = () => { if (started) return; started = true; size(); load(); queue(); };
  addEventListener('scroll', () => { begin(); queue(); }, { passive: true });
  addEventListener('resize', () => { size(); queue(); });
  if (document.readyState === 'complete') setTimeout(begin, 300);
  else addEventListener('load', () => setTimeout(begin, 300), { once: true });
  reduce.addEventListener('change', () => location.reload());
  queue();
})();
