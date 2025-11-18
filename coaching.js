// coaching page
(async ()=>{
  const user = requireLogin(); if (!user) return;
  const logsEl = document.getElementById('logs');
  document.getElementById('btnNewLog').addEventListener('click', async ()=>{
    const member = prompt('Team member name:'); if(!member) return;
    const coach = user.name || user.email;
    const date = new Date().toISOString().slice(0,10);
    const topics = prompt('Key topics discussed:');
    const actions = prompt('Action items/goals:');
    const followup = prompt('Follow-up date (YYYY-MM-DD):','');
    const payload = { member, coach, date, topics, actions, followup };
    const r = await apiPost('addCoaching', payload);
    alert(r.message || 'Saved');
    load();
  });
  async function load(){
    logsEl.textContent = 'Loading…';
    const r = await apiPost('listCoaching', {});
    if (!r.success) { logsEl.textContent = 'Error'; return; }
    logsEl.innerHTML = r.items.map(it=> {
      const ack = it.ackText ? `✅ Acknowledged: ${it.ackDate} — ${it.ackText}` : '<button class="ack" data-id="'+it._id+'">Acknowledge</button>';
      return `<div class="card"><strong>${it.member}</strong> — ${it.coach} — ${it.date} — ${it.topics}<div>${ack}</div></div>`;
    }).join('');
    // attach ack listeners
    document.querySelectorAll('.ack').forEach(b=> b.addEventListener('click', async (ev)=>{
      const id = ev.target.dataset.id;
      const text = prompt('Write your acknowledgement:');
      if (text===null) return;
      const r = await apiPost('acknowledge', { id, text });
      alert(r.message || 'Saved');
      load();
    }));
  }
  load();
})();
