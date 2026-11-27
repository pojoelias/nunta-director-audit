(() => {
  const links = [...document.querySelectorAll('#buget a, #cost a, #comparatie a, #mese a, #vizionare a')];
  function openBookmark() {
    const link = links.find(a => '#' + a.closest('li').id === location.hash);
    if (link) location.replace(link.href + location.search);
  }
  openBookmark();
  window.addEventListener('hashchange', openBookmark);
})();
