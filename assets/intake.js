const chosen = new URLSearchParams(location.search).get('locatie');
for (const form of document.querySelectorAll('.intake')) {
  const field = form.elements.venue;
  const token = document.createElement('input');
  token.type = 'hidden'; token.name = 'request_id'; token.value = crypto.randomUUID(); form.append(token);
  const dateField = form.elements.date;
  if (dateField) { const today=new Date(); today.setMinutes(today.getMinutes()-today.getTimezoneOffset()); dateField.min=today.toISOString().slice(0,10); }
  const context = document.querySelector('.context');
  if (context) {
    const selected = (window.locatii || []).find(item => item.id === chosen);
    if (selected) {
      field.value = selected.id;
      context.textContent = 'Locația aleasă: ' + selected.name + ' · ' + selected.county;
    } else if (form.elements.kind.value === 'claim' || chosen) {
      context.textContent = 'Alege o fișă din director pentru a continua.';
      const browse = document.createElement('a'); browse.href='index.html';browse.textContent='Vezi locațiile';context.append(' ',browse);form.hidden = true;
      continue;
    } else context.textContent = 'Poți cere ajutor și dacă încă alegi locația.';
  }
  const photos = form.elements.photos;
  if (photos) photos.addEventListener('change', () => {
    const files = Array.from(photos.files);
    photos.setCustomValidity(files.length > 5 || files.some(f => f.size > 5000000) ? 'Alege cel mult 5 fișiere de maximum 5 MB fiecare.' : '');
    form.elements.rights.required = files.length > 0;
    form.elements.credit.required = files.length > 0;
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const status = form.querySelector('.result');
    if (location.protocol === 'file:') {
      status.textContent = 'Pentru trimitere, deschide previzualizarea pe serverul local.';
      return;
    }
    const button = form.querySelector('button');
    button.disabled = true;
    status.textContent = 'Se trimite…';
    try {
      const response = await fetch('/api/cereri', { method: 'POST', body: new FormData(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Cererea nu a fost înregistrată.');
      form.reset();
      if (photos) { form.elements.credit.required = false; form.elements.rights.required = false; }
      status.textContent = 'Cerere înregistrată. Referință: ' + data.reference + '. ' + (form.elements.kind.value === 'claim' ? 'Urmează verificarea editorială.' : 'Echipa va folosi e-mailul indicat pentru a reveni cu detalii.');
    } catch (err) { status.textContent = err.message || 'Trimiterea a eșuat. Încearcă din nou.'; button.disabled = false; }
  });
}
