const savedKey = 'lista-locatii';
function loadSaved() {
  try {
    const values = JSON.parse(localStorage.getItem(savedKey) || '[]');
    return new Set(Array.isArray(values) ? values.filter(v => typeof v === 'string') : []);
  } catch { return new Set(); }
}
let saved = loadSaved();
function showSaved() {
  document.querySelector('#saved-count').textContent = saved.size;
  for (const button of document.querySelectorAll('[data-save]')) {
    const active = saved.has(button.dataset.save);
    button.setAttribute('aria-pressed', String(active));
    const label = button.querySelector('[data-save-label]');
    if (label) label.textContent = active ? 'Salvată' : 'Salvează';
  }
  for (const row of document.querySelectorAll('[data-saved-row]')) row.hidden = !saved.has(row.dataset.savedRow);
  const empty = document.querySelector('#empty-list');
  if (empty) empty.hidden = !!document.querySelector('[data-saved-row]:not([hidden])');
}
for (const button of document.querySelectorAll('[data-save]')) {
  button.addEventListener('click', () => {
    const id = button.dataset.save;
    if (saved.has(id)) saved.delete(id); else saved.add(id);
    try { localStorage.setItem(savedKey, JSON.stringify([...saved])); } catch {}
    showSaved();
  });
}
window.addEventListener('storage', () => { saved = loadSaved(); showSaved(); });
window.addEventListener('pageshow', () => { saved = loadSaved(); showSaved(); });
showSaved();

const guests = document.querySelector('#fit-guests');
if (guests) {
  const field = document.querySelector('.intake [name=guests]');
  const result = document.querySelector('#fit-result');
  function explain() {
    if (!guests.value || !guests.validity.valid) {
      result.textContent = guests.value ? 'Introdu un număr întreg între 1 și 100.000.' : '';
      return;
    }
    const layouts = [...document.querySelectorAll('[data-limit]')];
    if (layouts.every(layout => !Number(layout.dataset.limit))) {
      result.textContent = 'Pentru grupul de ' + guests.value + ', locația trebuie să confirme separat cununia, cina cu dans și spațiul pentru ploaie.';
    } else {
      result.textContent = layouts.map(layout => {
        const limit = Number(layout.dataset.limit);
        return layout.dataset.layout + ': ' + (limit > 0 ? (guests.valueAsNumber <= limit ? 'în limita publicată' : 'depășește limita publicată') : 'de confirmat');
      }).join(' · ');
    }
  }
  guests.addEventListener('input', () => { field.value = guests.validity.valid ? guests.value : ''; explain(); });
  field.addEventListener('input', () => { guests.value = field.value; explain(); });
}
const dock = document.querySelector('#dock');
if (dock && 'IntersectionObserver' in window) {
  const hero = document.querySelector('.hero'), contact = document.querySelector('#contact');
  const update = () => {
    const visible = hero.getBoundingClientRect().bottom <= 0 && contact.getBoundingClientRect().top >= innerHeight;
    dock.classList.toggle('show',visible);
    dock.inert = !visible;
  };
  const observer = new IntersectionObserver(update);
  observer.observe(hero); observer.observe(contact); update();
}
