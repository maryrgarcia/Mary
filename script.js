// script.js
// Single-file app storing data in localStorage for demo purposes.
// Replace or connect to a backend as needed.

const DEFAULT_CRITERIA = [
  "Communication",
  "Relationship Building",
  "Problem-Solving",
  "Task Management",
  "Customer Service",
  "Analytical & Reporting Skills",
  "Accuracy & Attention to Detail"
];

let data = {
  members: ["Alice Santos","Ben Cruz","Carla Reyes","David Lim"],
  users: ["Manager 1","Manager 2","Coach A"],
  criteria: [...DEFAULT_CRITERIA],
  evaluations: [],
  coaching: []
};

const STORAGE_KEY = "rv_coaching_data_v1";

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { data = JSON.parse(raw); } catch(e){ console.error(e) }
  } else {
    // seed example data
    data.evaluations = [
      { member:"Alice Santos", evaluator:"Manager 1", date:"2025-10-05", scores: {Communication:4, "Customer Service":4, "Task Management":3, "Problem-Solving":4, "Relationship Building":4, "Analytical & Reporting Skills":3, "Accuracy & Attention to Detail":4}, comments:"Great phone skills."},
      { member:"Ben Cruz", evaluator:"Manager 2", date:"2025-09-21", scores: {Communication:3, "Customer Service":3, "Task Management":3, "Problem-Solving":2, "Relationship Building":3, "Analytical & Reporting Skills":3, "Accuracy & Attention to Detail":3}, comments:"Needs improvement on problem solving."}
    ];
    data.coaching = [
      { member:"Ben Cruz", coach:"Coach A", date:"2025-10-10", topics:"Problem solving practice", actions:"Complete 3 case studies", followup:"2025-10-24", acknowledged:false },
    ];
    save();
  }
}
load();

// ----- Helpers -----
function $(sel){ return document.querySelector(sel) }
function $all(sel){ return Array.from(document.querySelectorAll(sel)) }
function showPage(pageId){
  $all('.page').forEach(p=>p.classList.add('hidden'));
  $('#'+pageId).classList.remove('hidden');
  $all('.nav-link').forEach(b=>b.classList.remove('active'));
  $all(`.nav-link[data-page="${pageId}"]`).forEach(b=>b.classList.add('active'));
  if (pageId==='dashboard') refreshDashboard();
  if (pageId==='evaluations') renderEvalTable();
  if (pageId==='coaching') renderCoachTable();
  if (pageId==='reports') renderReports();
  if (pageId==='admin') renderAdmin();
}

// Navigation buttons
$all('.nav-link').forEach(btn=>{
  btn.addEventListener('click',()=> showPage(btn.dataset.page));
});

// INITIALIZE: populate selects and criteria
function populateSelects(){
  const memberOptions = ['<option value="">-- Select --</option>'].concat(data.members.map(m=>`<option value="${m}">${m}</option>`)).join('');
  $all('#filter-member, #eval-member, #coach-member, #coach-filter-member').forEach(el=> el.innerHTML = memberOptions);
  const userOptions = ['<option value="">-- Select --</option>'].concat(data.users.map(u=>`<option value="${u}">${u}</option>`)).join('');
  $all('#filter-evaluator, #eval-evaluator, #coach-coach, #coach-filter-coach, #filter-evaluator').forEach(el=> el.innerHTML = userOptions);
}
function renderCriteriaList(){
  $('#criteria-list').innerHTML = data.criteria.map((c, idx)=>`<li>${c} <button data-idx="${idx}" class="btn small remove-crit">Remove</button></li>`).join('');
}
populateSelects();
renderCriteriaList();

// Modal helpers
function openModal(modalId){
  $('#modal-overlay').classList.remove('hidden');
  $(modalId).classList.remove('hidden');
}
function closeModal(modalEl){
  $('#modal-overlay').classList.add('hidden');
  modalEl.classList.add('hidden');
}
$all('.close-modal').forEach(btn=> btn.addEventListener('click', e=> {
  const modal = e.target.closest('.modal');
  closeModal(modal);
}));

// Add Evaluation flow
$('#add-eval').addEventListener('click', ()=>{
  buildSkillsGrid();
  openModal('#eval-modal');
});
$('#new-eval-btn').addEventListener('click', ()=> {
  buildSkillsGrid();
  openModal('#eval-modal');
});

// build skills inputs dynamically from criteria
function buildSkillsGrid(){
  const grid = $('#skills-grid');
  grid.innerHTML = '';
  data.criteria.forEach(crit=>{
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <label style="font-weight:600">${crit}</label>
      <input type="number" min="1" max="5" value="3" data-crit="${crit}" class="skill-input input">
    `;
    grid.appendChild(wrapper);
  });
  // attach listeners for recalculation
  $all('.skill-input').forEach(inp=> inp.addEventListener('input', updateTotalScore));
  updateTotalScore();
}

// calculate total score (average)
function updateTotalScore(){
  const inputs = $all('.skill-input');
  if (!inputs.length) { $('#total-score').innerText = '0'; return; }
  let sum = 0;
  inputs.forEach(i=> sum += Number(i.value || 0));
  const avg = (sum / inputs.length);
  $('#total-score').innerText = (Math.round(avg*100)/100).toFixed(2);
}

// handle evaluation form submit
$('#eval-form').addEventListener('submit', e=>{
  e.preventDefault();
  const member = $('#eval-member').value;
  const date = $('#eval-date').value;
  const evaluator = $('#eval-evaluator').value;
  const comments = $('#eval-comments').value;
  const scores = {};
  $all('.skill-input').forEach(i=> scores[i.dataset.crit] = Number(i.value));
  const total = Number($('#total-score').innerText);
  data.evaluations.push({ member, evaluator, date, scores, comments, total });
  save();
  closeModal($('#eval-modal'));
  renderEvalTable();
  refreshDashboard();
  alert('Evaluation added.');
});

// Evaluations table and filters
function renderEvalTable(){
  populateSelects();
  const tbody = $('#eval-table tbody');
  const filters = {
    member: $('#filter-member').value,
    month: $('#filter-month').value,
    evaluator: $('#filter-evaluator').value,
    scoreRange: $('#filter-score').value,
    search: $('#filter-search').value.toLowerCase()
  };
  let rows = data.evaluations.slice().reverse();
  rows = rows.filter(r=>{
    if (filters.member && r.member !== filters.member) return false;
    if (filters.evaluator && r.evaluator !== filters.evaluator) return false;
    if (filters.month && r.date){
      const yM = r.date.slice(0,7);
      if (yM !== filters.month) return false;
    }
    if (filters.scoreRange){
      const [min,max] = filters.scoreRange.split('-').map(Number);
      if (!(r.total >= min && r.total <= max)) return false;
    }
    if (filters.search){
      const combined = `${r.member} ${r.evaluator} ${r.comments}`.toLowerCase();
      if (!combined.includes(filters.search)) return false;
    }
    return true;
  });

  tbody.innerHTML = rows.map(r=>{
    // key strength and area for improvement: pick top score and lowest score
    const entries = Object.entries(r.scores || {});
    const sorted = entries.sort((a,b)=> b[1]-a[1]);
    const top = sorted[0] ? sorted[0][0] : "";
    const low = sorted[sorted.length-1] ? sorted[sorted.length-1][0] : "";
    return `<tr>
      <td>${r.member}</td>
      <td>${r.evaluator}</td>
      <td>${r.total ? r.total : (calcAvg(Object.values(r.scores||{})) || '-')}</td>
      <td>${top}</td>
      <td>${low}</td>
      <td><button class="btn small view-eval" data-index="${data.evaluations.indexOf(r)}">View</button></td>
    </tr>`;
  }).join('');
  // attach view listeners
  $all('.view-eval').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const idx = Number(btn.dataset.index);
      const r = data.evaluations[idx];
      alert(`Evaluation for ${r.member}\nDate: ${r.date}\nEvaluator: ${r.evaluator}\nTotal: ${r.total || calcAvg(Object.values(r.scores||{}))}\nComments: ${r.comments}`);
    });
  });
}

// filters
['#filter-member','#filter-month','#filter-evaluator','#filter-score','#filter-search'].forEach(sel=>{
  $(sel).addEventListener('input', renderEvalTable);
});
$('#clear-filters').addEventListener('click', ()=>{
  $('#filter-member').value=''; $('#filter-month').value=''; $('#filter-evaluator').value=''; $('#filter-score').value=''; $('#filter-search').value='';
  renderEvalTable();
});

// Coaching logs
$('#add-coach').addEventListener('click', ()=> openModal('#coach-modal'));
$('#new-coach-btn').addEventListener('click', ()=> openModal('#coach-modal'));
$('#coach-form').addEventListener('submit', e=>{
  e.preventDefault();
  const member = $('#coach-member').value;
  const coach = $('#coach-coach').value;
  const date = $('#coach-date').value;
  const topics = $('#coach-topics').value;
  const actions = $('#coach-actions').value;
  const followup = $('#coach-followup').value;
  const acknowledged = $('#ack-checkbox').checked;
  const ackDate = $('#ack-date').value || null;
  data.coaching.push({ member, coach, date, topics, actions, followup, acknowledged, ackDate });
  save();
  closeModal($('#coach-modal'));
  renderCoachTable();
  refreshDashboard();
  alert('Coaching log added.');
});
function renderCoachTable(){
  populateSelects();
  const tbody = $('#coach-table tbody');
  const filters = {
    member: $('#coach-filter-member').value,
    from: $('#coach-date-from').value,
    to: $('#coach-date-to').value,
    coach: $('#coach-filter-coach').value,
    topic: $('#coach-filter-topic').value.toLowerCase()
  };
  let rows = data.coaching.slice().reverse();
  rows = rows.filter(r=>{
    if (filters.member && r.member !== filters.member) return false;
    if (filters.coach && r.coach !== filters.coach) return false;
    if (filters.from && r.date < filters.from) return false;
    if (filters.to && r.date > filters.to) return false;
    if (filters.topic && !(`${r.topics} ${r.actions}`.toLowerCase().includes(filters.topic))) return false;
    return true;
  });
  tbody.innerHTML = rows.map(r=>{
    return `<tr>
      <td>${r.member}</td>
      <td>${r.coach}</td>
      <td>${r.topics}</td>
      <td>${r.followup || '-'}</td>
      <td>${r.acknowledged ? 'Acknowledged' : 'Pending'}</td>
      <td><button class="btn small view-coach">View</button></td>
    </tr>`;
  }).join('');
  $all('.view-coach').forEach((b,i)=> b.addEventListener('click', ()=>{
    const r = rows[i];
    alert(`Coaching log\nMember: ${r.member}\nCoach: ${r.coach}\nDate: ${r.date}\nTopics: ${r.topics}\nActions: ${r.actions}\nFollow-up: ${r.followup}\nAcknowledged: ${r.acknowledged}${r.ackDate ? ' on '+r.ackDate : ''}`);
  }));
}
['#coach-filter-member','#coach-date-from','#coach-date-to','#coach-filter-coach','#coach-filter-topic'].forEach(sel=>{
  $(sel).addEventListener('input', renderCoachTable);
});
$('#clear-coach-filters').addEventListener('click', ()=>{
  $('#coach-filter-member').value=''; $('#coach-date-from').value=''; $('#coach-date-to').value=''; $('#coach-filter-coach').value=''; $('#coach-filter-topic').value='';
  renderCoachTable();
});

// Reports rendering and exports
let lineChart, skillChart, coachChart;
function refreshDashboard(){
  // compute metrics
  const todayMonth = new Date().toISOString().slice(0,7);
  const monthEvals = data.evaluations.filter(e=> e.date && e.date.slice(0,7) === todayMonth);
  const avg = monthEvals.length ? (monthEvals.reduce((s,e)=> s + (e.total || calcAvg(Object.values(e.scores||{}))),0) / monthEvals.length) : (data.evaluations.length ? (data.evaluations.reduce((s,e)=> s + (e.total || calcAvg(Object.values(e.scores||{}))),0) / data.evaluations.length) : 0);
  $('#avg-score').innerText = avg ? (Math.round(avg*100)/100).toFixed(2) : '-';
  $('#total-coaching').innerText = data.coaching.length;
  $('#members-evaluated').innerText = new Set(data.evaluations.map(e=>e.member)).size;
  // top skill
  const skillSums = {};
  data.evaluations.forEach(ev=>{
    Object.entries(ev.scores || {}).forEach(([k,v])=>{
      skillSums[k] = (skillSums[k]||0) + v;
    });
  });
  let topSkill = '-';
  if (Object.keys(skillSums).length){
    topSkill = Object.entries(skillSums).sort((a,b)=> b[1]-a[1])[0][0];
  }
  $('#top-skill').innerText = topSkill;

  // build line chart (average scores over months)
  const monthly = {};
  data.evaluations.forEach(ev=>{
    if (!ev.date) return;
    const key = ev.date.slice(0,7);
    const val = ev.total || calcAvg(Object.values(ev.scores || {}));
    if (!monthly[key]) monthly[key] = [];
    monthly[key].push(val);
  });
  const labels = Object.keys(monthly).sort();
  const avgVals = labels.map(l=> (monthly[l].reduce((a,b)=>a+b,0)/monthly[l].length));
  const ctx = document.getElementById('lineChart').getContext('2d');
  if (lineChart) lineChart.destroy();
  lineChart = new Chart(ctx, {
    type:'line',
    data:{ labels, datasets:[{ label:'Average Score', data: avgVals, tension:0.3, fill:false }]},
    options:{ plugins:{ legend:{display:false} }, scales:{ y:{ min:0, max:5 } } }
  });
}

// Reports charts
function renderReports(){
  // Average score by skill
  const skillSums = {}, skillCounts = {};
  data.evaluations.forEach(ev=>{
    Object.entries(ev.scores || {}).forEach(([k,v])=>{
      skillSums[k] = (skillSums[k]||0)+v;
      skillCounts[k] = (skillCounts[k]||0)+1;
    });
  });
  const skills = Object.keys(skillSums);
  const avgBySkill = skills.map(k => skillSums[k] / skillCounts[k]);

  const ctx1 = $('#skillChart').getContext('2d');
  if (skillChart) skillChart.destroy();
  skillChart = new Chart(ctx1, {
    type: 'bar',
    data: { labels: skills, datasets:[{ label:'Avg Score', data: avgBySkill }]},
    options:{ indexAxis:'y', plugins:{ legend:{display:false} }, scales:{ x:{ min:0, max:5 } } }
  });

  // Coaching per employee
  const coachCounts = {};
  data.coaching.forEach(c=> coachCounts[c.member] = (coachCounts[c.member]||0)+1 );
  const coachLabels = Object.keys(coachCounts);
  const coachVals = coachLabels.map(l=> coachCounts[l]);
  const ctx2 = $('#coachChart').getContext('2d');
  if (coachChart) coachChart.destroy();
  coachChart = new Chart(ctx2, {
    type:'bar',
    data:{ labels: coachLabels, datasets:[{ label:'Coaching Sessions', data: coachVals }]},
    options:{ plugins:{ legend:{display:false} } }
  });
}

$('#export-csv').addEventListener('click', ()=>{
  // create CSV summarizing evaluations + coaching
  const rows = [["Type","Team Member","Evaluator/Coach","Date","Total/Notes"]];
  data.evaluations.forEach(e=>{
    rows.push(["Evaluation", e.member, e.evaluator, e.date, e.total || calcAvg(Object.values(e.scores||{}))]);
  });
  data.coaching.forEach(c=>{
    rows.push(["Coaching", c.member, c.coach, c.date, c.topics]);
  });
  const csv = rows.map(r=> r.map(item=> `"${String(item||'').replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download = 'royal_vending_report.csv'; a.click(); URL.revokeObjectURL(url);
});

$('#export-pdf').addEventListener('click', async ()=>{
  // simple PDF export using jsPDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16); doc.text("Royal Vending — Report", 12, 18);
  doc.setFontSize(11);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 12, 26);

  let y = 36;
  doc.setFontSize(12); doc.text("Evaluations (recent):", 12, y); y+=6;
  data.evaluations.slice(-10).reverse().forEach(ev=>{
    doc.setFontSize(10);
    const text = `${ev.date} • ${ev.member} • ${ev.evaluator} • total: ${ev.total || calcAvg(Object.values(ev.scores||{}))}`;
    const split = doc.splitTextToSize(text, 180);
    doc.text(split, 12, y);
    y += split.length * 6;
    if (y > 270){ doc.addPage(); y = 20; }
  });
  doc.save('royal_vending_report.pdf');
});

// ADMIN functions
$('#add-member-btn').addEventListener('click', ()=>{
  const name = $('#new-member-name').value.trim();
  if (!name) return alert('Enter a name');
  data.members.push(name);
  $('#new-member-name').value='';
  save(); populateSelects(); renderAdmin();
});
$('#add-user-btn').addEventListener('click', ()=>{
  const name = $('#new-user-name').value.trim();
  if (!name) return alert('Enter a name');
  data.users.push(name);
  $('#new-user-name').value='';
  save(); populateSelects(); renderAdmin();
});
$('#add-criteria-btn').addEventListener('click', ()=>{
  const c = $('#new-criteria').value.trim();
  if (!c) return alert('Enter criteria');
  data.criteria.push(c);
  $('#new-criteria').value='';
  save(); renderCriteriaList();
});

$('#criteria-list').addEventListener('click', (e)=>{
  if (e.target.classList.contains('remove-crit')){
    const idx = Number(e.target.dataset.idx);
    data.criteria.splice(idx,1);
    save(); renderCriteriaList();
  }
});

function renderAdmin(){
  $('#team-list').innerHTML = data.members.map((m,i)=> `<li>${m} <button data-idx="${i}" class="btn small remove-member">Remove</button></li>`).join('');
  $('#users-list').innerHTML = data.users.map((u,i)=> `<li>${u} <button data-idx="${i}" class="btn small remove-user">Remove</button></li>`).join('');
}
document.body.addEventListener('click', (e)=>{
  if (e.target.classList.contains('remove-member')){
    const i = Number(e.target.dataset.idx); if (confirm('Remove member?')) data.members.splice(i,1), save(), populateSelects(), renderAdmin();
  }
  if (e.target.classList.contains('remove-user')){
    const i = Number(e.target.dataset.idx); if (confirm('Remove user?')) data.users.splice(i,1), save(), populateSelects(), renderAdmin();
  }
});

// utility
function calcAvg(arr){
  if (!arr || !arr.length) return 0;
  return arr.reduce((a,b)=>a+b,0)/arr.length;
}

// initial rendering
populateSelects();
renderCriteriaList();
renderEvalTable();
renderCoachTable();
refreshDashboard();


// open modals overlay close
$('#modal-overlay').addEventListener('click', ()=>{
  $all('.modal').forEach(m=> m.classList.add('hidden'));
  $('#modal-overlay').classList.add('hidden');
});

// Quick actions
$('#view-team').addEventListener('click', ()=> showPage('reports'));

// Auto open form when clicking quick buttons
$('#new-eval-btn').addEventListener('click', ()=> { buildSkillsGrid(); openModal('#eval-modal') });
$('#new-coach-btn').addEventListener('click', ()=> openModal('#coach-modal'));