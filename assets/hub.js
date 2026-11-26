const locality = document.querySelector('#localitate');
const entries = [...document.querySelectorAll('[data-locality]')];
locality.addEventListener('change', () => {
  for (const entry of entries) entry.hidden = Boolean(locality.value && entry.dataset.locality !== locality.value);
  const count = entries.filter(entry => !entry.hidden).length;
  document.querySelector('#rezultat').textContent = count === 1 ? '1 locație în selecție' : count + ' locații în selecție';
});
let map, pins;
function plot(){
  pins.clearLayers();
  const points=[];
  for(const entry of entries.filter(item=>!item.hidden)){
    const point=[Number(entry.dataset.lat),Number(entry.dataset.lon)];
    if(!point.every(Number.isFinite))continue;
    const anchor=entry.querySelector('a').cloneNode(true);
    const pin=L.circleMarker(point,{radius:9,color:'#193829',fillColor:'#f8f5ec',fillOpacity:1,weight:3}).addTo(pins);
    pin.bindPopup(anchor);points.push(point);
  }
  if(points.length)map.fitBounds(points,{padding:[30,30],maxZoom:13});
}
document.querySelector('#showMap').onclick=event=>{
  const panel=document.querySelector('#countyMap');panel.hidden=false;event.currentTarget.hidden=true;
  map=L.map(panel,{scrollWheelZoom:false});
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
  pins=L.layerGroup().addTo(map);plot();
};
locality.addEventListener('change',()=>{if(map)plot();});
