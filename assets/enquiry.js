const enquiry = document.querySelector('.enquiry');
enquiry.addEventListener('submit', event => {
  event.preventDefault();
  const date = enquiry.elements.date.value;
  const on = date ? ' în data de ' + date.split('-').reverse().join('.') : '';
  const venue = document.querySelector('h1').textContent;
  const guests = enquiry.elements.guests.value;
  const message = 'Bună ziua! Ne interesează o nuntă la ' + venue + on + ', pentru ' + guests + ' de invitați. Câte persoane pot sta pe scaune la cununia în aer liber? Încap mesele și un ring pentru acest grup? Ce spațiu acoperit ne puteți rezerva dacă plouă și care este costul? Mulțumim!';
  enquiry.querySelectorAll('.draft').forEach(element => element.hidden = false);
  const output = enquiry.querySelector('textarea');
  output.value = message;
  output.focus();
  output.select();
});
