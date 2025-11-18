// reports page (simple)
(async ()=>{
  const user = requireLogin(); if (!user) return;
  const el = document.getElementById('reportsContent');
  el.textContent = 'Loading…';
  const r = await apiPost('getReports', {});
  if (!r.success) { el.textContent = 'Error'; return; }
  el.innerHTML = '<pre>'+JSON.stringify(r.reports, null, 2)+'</pre>';
})();
