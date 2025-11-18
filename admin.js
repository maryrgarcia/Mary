// admin page (add member, criteria)
(async ()=>{
  const user = requireLogin(); if (!user) return;
  const el = document.getElementById('adminContent');
  el.innerHTML = '<div><button id="btnAddMember">Add Member</button> <button id="btnAddCriteria">Add Criteria</button></div><div id="adminList"></div>';
  document.getElementById('btnAddMember').addEventListener('click', async ()=>{
    const name = prompt('Member name:'); if(!name) return;
    const r = await apiPost('addMember',{ name});
    alert(r.message||'Added'); load();
  });
  document.getElementById('btnAddCriteria').addEventListener('click', async ()=>{
    const c = prompt('New criteria:');
    if(!c) return;
    const r = await apiPost('addCriteria',{ c });
    alert(r.message||'Added'); load();
  });
  async function load(){
    const r = await apiPost('adminList',{});
    if(!r.success) return;
    document.getElementById('adminList').innerHTML = '<pre>'+JSON.stringify(r.data, null, 2)+'</pre>';
  }
  load();
})();
