(() => {
  const form = document.getElementById('directory-search');
  const input = document.getElementById('venue-search');
  const section = document.getElementById('directory-results');
  const hits = document.getElementById('search-hits');
  const status = document.getElementById('directory-status');
  const more = document.getElementById('show-more');
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  let loading, results = [], shown = 0, version = 0;
  function loadIndex() {
    if (!loading) loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'assets/directory-index.js';
      script.onload = () => resolve(window.directoryIndex.map(([name, town, county, href, aliases = '']) => ({
        name, town, county, href, key:normalize(name), townKey:normalize(town), countyKey:normalize(county), area:normalize(town+' '+county+' '+aliases)
      })));
      script.onerror = () => { loading = undefined; reject(new Error('index')); };
      document.head.append(script);
    });
    return loading;
  }
  function showBatch() {
    const batch = results.slice(shown, shown + 24);
    for (const row of batch) {
      const li = document.createElement('li'), a = document.createElement('a');
      const name = document.createElement('span'), place = document.createElement('span');
      name.className = 'dir-venue-title'; place.className = 'dir-venue-meta';
      name.textContent = row.name; place.textContent = [...new Set([row.town,row.county].filter(Boolean))].join(' · ');
      a.href = row.href; a.append(name, place); li.append(a); hits.append(li);
    }
    shown += batch.length;
    more.hidden = shown >= results.length;
  }
  async function search() {
    const seq = ++version, term = normalize(input.value);
    hits.replaceChildren(); shown = 0; more.hidden = true;
    section.hidden = !term;
    if (!term) return;
    status.textContent = 'Se caută…';
    try {
      const index = await loadIndex();
      if (seq !== version) return;
      const tokens = term.split(' ');
      const metroSearch = term === 'bucuresti' || term === 'bucuresti ilfov' || term === 'ilfov bucuresti';
      const countyMatches = index.filter(row => row.countyKey === term);
      const townMatches = index.filter(row => row.townKey === term);
      if (metroSearch) results = index.filter(row => ['București', 'Ilfov'].includes(row.county));
      else if (countyMatches.length) results = countyMatches;
      else if (townMatches.length) results = townMatches;
      else results = index.filter(row => tokens.every(token => (row.key + ' ' + row.area).includes(token)));
      function rank(r) { return r.key === term ? 0 : r.key.startsWith(term) ? 1 : r.key.includes(term) ? 2 : 3; }
      results.sort((a,b) => rank(a)-rank(b));
      status.textContent = results.length === 0 ? 'Nicio locație găsită. Încearcă numele localității sau alege un județ mai jos.'
        : results.length === 1 ? 'O locație găsită.' : results.length + (results.length%100>=20 || results.length%100===0 ? ' de' : '') + ' locații găsite.';
      if (metroSearch) {
        const cityCount = results.filter(r => r.county === 'București').length;
        status.textContent += ' În municipiul București: ' + cityCount + '. În județul Ilfov: ' + (results.length - cityCount) + '.';
      }
      showBatch();
    } catch {
      if (seq === version) status.textContent = 'Căutarea nu s-a încărcat. Poți explora locațiile după județ mai jos.';
    }
  }
  form.hidden = false;
  let timer;
  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(search, 100); });
  form.addEventListener('submit', e => {
    e.preventDefault(); clearTimeout(timer);
    const url = new URL(location.href);
    if (input.value.trim()) url.searchParams.set('q',input.value.trim()); else url.searchParams.delete('q');
    try { history.replaceState(null,'',url); } catch {}
    search().then(() => { if (!section.hidden) { section.scrollIntoView({block:'start'}); document.getElementById('results-caption').focus({preventScroll:true}); } });
  });
  more.addEventListener('click', showBatch);
  input.value = (new URLSearchParams(location.search).get('q') || '').slice(0,160);
  if (input.value) search();
})();
