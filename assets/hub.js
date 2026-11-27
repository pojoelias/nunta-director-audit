(() => {
  const controls = document.getElementById('hub-controls');
  const list = document.querySelector('ul.venue-cards');
  if (!controls || !list) return;
  const rows = [...list.querySelectorAll(':scope > .venue-card')];
  const locality = document.getElementById('localitate');
  const sorter = document.getElementById('hub-sort');
  const status = document.getElementById('rezultat');
  const showMap = document.getElementById('showMap');
  const collator = new Intl.Collator('ro', {sensitivity:'base',numeric:true});
  let map, pins;

  function plot() {
    pins.clearLayers();
    const points = [];
    for (const row of rows.filter(entry => !entry.hidden)) {
      const point = [Number(row.dataset.lat),Number(row.dataset.lon)];
      if (!point.every(Number.isFinite)) continue;
      const link = row.querySelector('.card-primary').cloneNode(true);
      const pin = L.circleMarker(point,{radius:9,color:'#193829',fillColor:'#f8f5ec',fillOpacity:1,weight:3}).addTo(pins);
      pin.bindPopup(link);
      points.push(point);
    }
    if (points.length) map.fitBounds(points,{padding:[30,30],maxZoom:13});
  }
  function update() {
    let count=0;
    for (const row of rows) {
      row.hidden = Boolean(locality?.value && row.dataset.locality !== locality.value);
      if (!row.hidden) count++;
    }
    const ordered = rows.slice().sort((a,b) => sorter.value === 'name'
      ? collator.compare(a.dataset.name,b.dataset.name) || Number(a.dataset.rank)-Number(b.dataset.rank)
      : Number(a.dataset.rank)-Number(b.dataset.rank));
    list.append(...ordered);
    status.textContent = count === 1 ? '1 locație în selecție' : count+(count%100>=20||count%100===0?' de':'')+' locații în selecție';
    if (map) plot();
  }
  sorter.addEventListener('change',update);
  locality?.addEventListener('change',update);
  if (showMap) {
    showMap.addEventListener('click', () => {
      if (!window.L) {status.textContent='Harta nu s-a încărcat. Indicațiile de drum sunt disponibile în fiecare fișă.'; return;}
      document.getElementById('countyMap').hidden=false;
      showMap.hidden=true;
      map=L.map('countyMap',{scrollWheelZoom:false});
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
      pins=L.layerGroup().addTo(map);
      plot();
    });
  }
  controls.hidden=false;
})();
