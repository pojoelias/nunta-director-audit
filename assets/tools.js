'use strict';
const byId = id => document.getElementById(id);
const el = (tag, text) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; return node; };
const currency = (n,unit) => new Intl.NumberFormat('ro-RO', {style:'currency', currency:unit}).format(n);
function field(label, input) { const node = el('label', label); node.append(input); return node; }
function option(label, value) { return new Option(label,value); }
function amount(id) { const v = byId(id); return v.reportValidity && v.validity.valid && v.value.trim() !== '' ? v.valueAsNumber : NaN; }
if (byId('buget')) {
const allocations = [['Locație și mobilier',20],['Catering și băuturi',40],['Muzică și sonorizare',10],['Fotografie și film',10],['Decor și flori',7],['Coordonare',5],['Rezervă și alte cheltuieli',8]];
const budgetRows = allocations.map(([name,value]) => {
  const row = el('div'); row.className = 'allocation';
  const range = el('input'); range.type = 'range'; range.min=0; range.max=100; range.value=value;
  const result=el('output');row.append(field(name,range),result);byId('allocations').append(row);
  range.addEventListener('input', updateBudget); return {range,result};
});
function updateBudget() {
  const money=n=>currency(n,byId('budgetCurrency').value);
  const total=amount('totalBudget'); let sum=0;
  for(const {range,result} of budgetRows){const pct=+range.value;sum+=pct;result.textContent=pct+'% · '+(Number.isFinite(total)?money(total*pct/100):'—');}
  byId('budgetResult').textContent=!Number.isFinite(total)?'Introdu un buget valid.':sum===100?'Buget repartizat integral: '+money(total):sum<100?'Disponibil pentru repartizare: '+money(total*(100-sum)/100):'Peste buget cu '+money(total*(sum-100)/100);
}
byId('budgetCurrency').addEventListener('change',updateBudget);
byId('totalBudget').addEventListener('input',updateBudget); updateBudget();
}
if (byId('cost')) {
function updateCost(){
  const money=n=>currency(n,byId('costCurrency').value);
  const [fixed,meal,bar,other,n,m,minimum]=['fixed','meal','bar','extras','headcount','alternative','minimumMeals'].map(amount);
  if (![fixed,meal,bar,other,n,m,minimum].every(Number.isFinite)) {byId('guestResult').textContent='Completează sumele și un număr întreg de cel puțin un invitat pentru fiecare scenariu.';return;}
  const totalFor=guests=>fixed+Math.max(guests,minimum)*meal+guests*(bar+other);
  const total=totalFor(n),diff=totalFor(m)-total;
  byId('guestResult').textContent='Total: '+money(total)+' · '+money(total/n)+' / invitat. Pentru '+m+' invitați: '+money(totalFor(m))+' ('+(diff===0?'același cost':money(Math.abs(diff))+(diff<0?' mai puțin':' în plus'))+').';
}
byId('cost').addEventListener('input',updateCost);updateCost();
}
if (byId('comparatie')) {
const indexed = new Map(), compareSelects = [], offerInputs=[];
const preselected = new URLSearchParams(location.search).get('locatie');
const message = el('p', 'Alege o locație pentru a încărca lista.'); message.setAttribute('role','status');
const summary=el('p'); summary.className='answer';summary.setAttribute('aria-live','polite');summary.hidden=true;
function compareTotals(){
  const quotes=offerInputs.map(({select,price})=>({name:indexed.get(select.value)?.name,price:price.value.trim() && price.validity.valid ? price.valueAsNumber : NaN})).filter(v=>v.name && Number.isFinite(v.price)).sort((a,b)=>a.price-b.price);
  summary.hidden=quotes.length<2;
  if(summary.hidden)return;
  const low=quotes[0].price, high=quotes[quotes.length-1].price;
  const cheapest=quotes.filter(q=>q.price===low).map(q=>q.name).join(', ');
  summary.textContent=high===low?'Ofertele introduse au același total: '+currency(low,'RON')+'.':'Totalul cel mai mic: '+currency(low,'RON')+' ('+cheapest+'). Diferența până la oferta cea mai mare: '+currency(high-low,'RON')+'.';
}
let ready;

function compareChoices(){
 const taken=compareSelects.map(s=>s.value).filter(Boolean);
 for(const s of compareSelects) for(const o of s.options)o.disabled=Boolean(o.value && o.value!==s.value && taken.includes(o.value));
}
for(let n=1;n<=3;n++){
  const box=el('article'), select=el('select'),facts=el('p'),price=el('input'),notes=el('textarea');
  select.append(option('Alege locația',''));
  price.type='number';price.min='0';price.step='.01';notes.rows=2;offerInputs.push({select,price});price.addEventListener('input',compareTotals);
  box.append(field('Locația '+n,select),facts,field('Oferta totală (lei)',price),field('Condiții și servicii incluse',notes));byId('compare').append(box);compareSelects.push(select);
  select.addEventListener('change',()=>{const v=indexed.get(select.value);facts.replaceChildren();price.value='';notes.value='';
    if(v){for(const [k,label] of [['ceremony_max','Cununie așezată'],['outdoor_dinner_with_dancing_max','Cină cu dans'],['rain_backup_seated_max','Plan de ploaie']])facts.append(el('span',label+': '+(v[k]?v[k]+' locuri':'De confirmat')),el('br'));const actions=el('span');actions.className='maps-actions';const a=el('a','Deschide fișa locației');a.href=v.href || v.url;actions.append(a);facts.append(actions);}
    compareChoices();compareTotals();
  });
}
byId('compare').before(message);byId('compare').after(summary);
function loadChoices() {
  if (!ready) {
    message.textContent='Se încarcă lista locațiilor…';
    const fetchData = window.locatii ? Promise.resolve(window.locatii) : window.loadPlanningVenues();
    ready = fetchData.then(data => {
      const directory = [...data].sort((a,b)=>a.name.localeCompare(b.name,'ro'));
      for(const v of directory) {
        const id = v.place_id || v.id;
        indexed.set(id,{...v,ceremony_max:v.ceremony_max || v.ceremony,outdoor_dinner_with_dancing_max:v.outdoor_dinner_with_dancing_max || v.dinner,rain_backup_seated_max:v.rain_backup_seated_max || v.rain});
        for(const select of compareSelects)select.append(option(v.name+' · '+v.county,id));
      }
      message.hidden=true;
      if(indexed.has(preselected)) {
        compareSelects[0].value=preselected;
        compareSelects[0].dispatchEvent(new Event('change'));
      } else if (preselected) {
        message.textContent='Locația solicitată nu apare în director. Alege una din listă.';message.hidden=false;
      }
    }).catch(()=>{
      ready=undefined; message.replaceChildren(document.createTextNode('Lista locațiilor nu s-a încărcat. '));
      const retry=el('button','Încearcă din nou'); retry.type='button';retry.onclick=loadChoices;message.append(retry);message.hidden=false;
    });
  }
  return ready;
}
for(const select of compareSelects) {
  // Pointerdown starts loading before opening choices; focus also covers the keyboard.
  select.addEventListener('focus',loadChoices);select.addEventListener('pointerdown',loadChoices);
}
if(preselected)loadChoices();
else if(window.requestIdleCallback)requestIdleCallback(loadChoices,{timeout:2000});
else setTimeout(loadChoices,0);
}
if (byId('vizionare')) {
const questions=['Capacitate cu scaune la ceremonie și culoar de acces','Locuri la masă cu ring de dans și spațiu pentru muzicieni','Spațiu acoperit rezervat, capacitate și cost','Exclusivitate, oră de încheiere și limite pentru muzică','Acces fără trepte, toalete, parcare și transport','Catering extern, băuturi, taxe și meniuri speciale','Curent pentru furnizori, iluminat, montaj și demontare','Avans, anulare, reprogramare și termenul ofertei'];
for(const q of questions){const label=el('label'),input=el('input');input.type='checkbox';label.className='check';label.append(input,document.createTextNode(q));byId('checklist').append(label);}
}
for(const button of document.querySelectorAll('[data-print]'))button.onclick=()=>{document.body.dataset.printSection=button.closest('.worksheet').id;window.print();};
window.addEventListener('afterprint',()=>delete document.body.dataset.printSection);

if (byId('mese')) {
const key='nunta-plan-mese-v1';let state={tables:[],guests:[]}, selected='', moving=null;
try {const saved=JSON.parse(localStorage.getItem(key));if(saved&&Array.isArray(saved.guests)&&Array.isArray(saved.tables))state=saved;} catch {}
function save(){try{localStorage.setItem(key,JSON.stringify(state));}catch{byId('seatStatus').append(' Salvarea în browser este indisponibilă.');}}
const uid=()=>globalThis.crypto?.randomUUID?.() || [Date.now(),Math.random().toString(36).slice(2)].join('-');
const occupancy=id=>state.guests.filter(g=>g.table===id).length;
function tableName(t){return 'Masa '+t.number;}
function refresh(){
  const floor=byId('floor'),position=byId('position'),rows=byId('guestRows');floor.replaceChildren();rows.replaceChildren();position.replaceChildren();
  byId('seatStatus').textContent=state.guests.length+' invitați · '+state.guests.filter(g=>g.rsvp==='Confirmat').length+' confirmați · '+state.guests.filter(g=>g.table).length+' așezați';
  for(const t of state.tables){const button=el('button',tableName(t)+' · '+occupancy(t.id)+'/'+t.capacity);button.type='button';button.className='tablepin';button.dataset.id=t.id;button.style.left=t.x+'%';button.style.top=t.y+'%';button.setAttribute('aria-pressed',String(selected===t.id));
    button.onclick=()=>{selected=t.id;refresh();floor.querySelector('[data-id="'+t.id+'"]').focus();};
    button.onpointerdown=e=>{if(e.button!==0)return;moving=t;button.setPointerCapture(e.pointerId);};
    button.onpointermove=e=>{if(moving!==t)return;const r=floor.getBoundingClientRect();t.x=Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100));t.y=Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100));button.style.left=t.x+'%';button.style.top=t.y+'%';};
    button.ondragover=e=>{if(e.dataTransfer.types.includes('application/x-nunta-guest'))e.preventDefault();};
    button.ondrop=e=>{e.preventDefault();const g=state.guests.find(g=>g.id===e.dataTransfer.getData('application/x-nunta-guest'));if(g&&g.rsvp!=='Refuzat'&&g.table!==t.id&&occupancy(t.id)<t.capacity){g.table=t.id;refresh();save();}};
    button.onpointerup=button.onpointercancel=()=>{moving=null;save();};floor.append(button);}
  const t=state.tables.find(t=>t.id===selected);
  if(t){position.append(el('span','Poziție '+tableName(t)+': '));for(const [label,axis,delta] of [['Stânga','x',-5],['Dreapta','x',5],['Sus','y',-5],['Jos','y',5]]){const b=el('button',label);b.onclick=()=>{t[axis]=Math.max(0,Math.min(100,t[axis]+delta));refresh();save();};position.append(b);}
    const del=el('button','Elimină masa');del.onclick=()=>{state.guests.forEach(g=>{if(g.table===t.id)g.table='';});state.tables=state.tables.filter(v=>v!==t);selected='';refresh();save();};position.append(del);}
  for(const g of state.guests){const row=el('div');row.className='guestrow';row.draggable=g.rsvp!=='Refuzat';row.ondragstart=e=>e.dataTransfer.setData('application/x-nunta-guest',g.id);const rsvp=el('select'),seat=el('select'),del=el('button','Elimină');for(const status of ['În așteptare','Confirmat','Refuzat'])rsvp.append(option(status,status));rsvp.value=g.rsvp;rsvp.setAttribute('aria-label','Confirmare pentru '+g.name);
    seat.append(option('Fără masă',''));for(const t of state.tables){const o=option(tableName(t),t.id);o.disabled=g.table!==t.id&&occupancy(t.id)>=t.capacity;seat.append(o);}seat.value=g.table;seat.disabled=g.rsvp==='Refuzat';seat.setAttribute('aria-label','Masa pentru '+g.name);
    rsvp.onchange=()=>{g.rsvp=rsvp.value;if(g.rsvp==='Refuzat')g.table='';refresh();save();}; seat.onchange=()=>{g.table=seat.value;refresh();save();};del.onclick=()=>{state.guests=state.guests.filter(x=>x.id!==g.id);refresh();save();};del.setAttribute('aria-label','Elimină '+g.name);row.append(el('strong',g.name),rsvp,seat,del);rows.append(row);}
}
byId('addTable').onsubmit=e=>{e.preventDefault();const n=Math.max(0,...state.tables.map(t=>t.number))+1;const t={id:uid(),number:n,capacity:amount('seats'),x:((n-1)%4)*22+10,y:(Math.floor((n-1)/4)%4)*22+10};state.tables.push(t);selected=t.id;refresh();save();};
byId('addGuests').onsubmit=e=>{e.preventDefault();for(const name of byId('guestNames').value.split(/\n/).map(n=>n.trim()).filter(Boolean))state.guests.push({id:uid(),name,rsvp:'În așteptare',table:''});byId('guestNames').value='';refresh();save();};
byId('clearGuests').onclick=()=>{if(confirm('Ștergi lista invitaților și planul meselor din acest browser?')){state={tables:[],guests:[]};selected='';refresh();save();}};
byId('exportGuests').onclick=()=>{const quote=s=>'"'+(/^[=+@\-\t\r]/.test(s)?"'":'')+s.replaceAll('"','""')+'"';const rows=[['Invitat','Confirmare','Masă'],...state.guests.map(g=>[g.name,g.rsvp,state.tables.find(t=>t.id===g.table)?tableName(state.tables.find(t=>t.id===g.table)):''])];const a=el('a');a.download='invitati-si-mese.csv';a.href=URL.createObjectURL(new Blob(['\ufeff'+rows.map(row=>row.map(quote).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
refresh();

}
