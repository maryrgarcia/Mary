// dashboard logic (uses auth.js requireLogin and apiPost)
(function(){
  const user = requireLogin();
  if (!user) return;
  const el = document.getElementById('dashboardContent');
  el.textContent = 'Loading dashboard...';
  (async ()=>{
    const r = await apiPost('getDashboard', {});
    if (!r.success) { el.textContent = 'Error loading'; return; }
    const d = r.data;
    el.innerHTML = `<div class="cards">
      <div><strong>Avg Score (this month):</strong> ${d.avgThisMonth || '-'}</div>
      <div><strong>Total Coaching:</strong> ${d.totalCoaching || 0}</div>
      <div><strong>Members Evaluated:</strong> ${d.membersEvaluated || 0}</div>
      <div><strong>Top Skill:</strong> ${d.topSkill || '-'}</div>
    </div>`;
  })();
})();
