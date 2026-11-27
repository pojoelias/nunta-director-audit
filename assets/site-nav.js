(() => {
  const media=matchMedia('(max-width:700px)');
  const button=document.querySelector('.menu-toggle');
  const nav=document.getElementById('main-nav');
  let opened=false;
  function draw(){
    button.hidden=!media.matches;
    nav.hidden=media.matches && !opened;
    button.setAttribute('aria-expanded',String(!nav.hidden));
  }
  button.addEventListener('click',()=>{opened=!opened;draw()});
  nav.addEventListener('keydown',e=>{
    if(e.key==='Escape' && media.matches){opened=false;draw();button.focus()}
  });
  document.addEventListener('click',e=>{
    if(opened && !e.target.closest('.mast')){opened=false;draw()}
  });
  media.addEventListener('change',()=>{opened=false;draw()});
  draw();
})();
