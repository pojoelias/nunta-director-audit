/* Fetch planning data on a venue choice, keeping the page's initial rendering independent of it. */
window.loadPlanningVenues = (() => {
  let pending;
  return () => {
    if (!pending) {
      pending = fetch('assets/venues-planning.json').then(response => {
        if (!response.ok) throw Error('Catalog indisponibil.');
        return response.json();
      }).catch(error => { pending = undefined; throw error; });
    }
    return pending;
  };
})();
