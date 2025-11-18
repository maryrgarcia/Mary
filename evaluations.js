// evaluations page
(async ()=>{
  const user = requireLogin(); if (!user) return;
  const listEl = document.getElementById('evalList');
  document.getElementById('btnNewEval').addEventListener('click', async ()=>{
    const member = prompt('Team member name:'); if (!member) return;
    const evaluator = user.name || user.email;
    const date = new Date().toISOString().slice(0,10);
    const total = prompt('Total score (1-5 average):','3');
    const payload = { member, evaluator, date, total };
    const r = await apiPost('addEvaluation', payload);
    alert(r.message || 'Saved');
    load();
  });
  async function load(){
    listEl.textContent = 'Loading…';
    const r = await apiPost('listEvaluations', {});
    if (!r.success) { listEl.textContent = 'Error'; return; }
    listEl.innerHTML = r.items.map(it=> `<div class="card"><strong>${it.member}</strong> — ${it.evaluator} — ${it.date} — total: ${it.total}</div>`).join('');
  }
  load();
})();
