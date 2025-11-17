// app.js
import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

import {
  doc, setDoc, getDoc, collection, addDoc, query, onSnapshot, where, updateDoc, deleteDoc, getDocs
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// DOM refs
const authScreen = document.getElementById('auth-screen');
const appEl = document.getElementById('app');
const btnSignIn = document.getElementById('btnSignIn');
const btnSignUp = document.getElementById('btnSignUp');
const showSignup = document.getElementById('showSignup');
const showSignin = document.getElementById('showSignin');
const signinForm = document.getElementById('signin-form');
const signupForm = document.getElementById('signup-form');
const authMessage = document.getElementById('authMessage');
const suMessage = document.getElementById('suMessage');

// Sign in
btnSignIn.addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  authMessage.textContent = '';
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    authMessage.textContent = 'Sign in failed. Check credentials.';
    console.error(err);
  }
});

// Show/hide forms
showSignup.addEventListener('click', ()=> { signinForm.classList.add('hidden'); signupForm.classList.remove('hidden'); });
showSignin.addEventListener('click', ()=> { signupForm.classList.add('hidden'); signinForm.classList.remove('hidden'); });

// Sign up (creates Auth user and Firestore user doc)
btnSignUp.addEventListener('click', async () => {
  const name = document.getElementById('su_name').value.trim();
  const email = document.getElementById('su_email').value.trim();
  const pw = document.getElementById('su_password').value;
  const role = document.getElementById('su_role').value || 'agent';
  suMessage.textContent = '';
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pw);
    // set displayName
    await updateProfile(cred.user, { displayName: name });
    // create user doc with role
    await setDoc(doc(db, 'users', cred.user.uid), {
      displayName: name || email,
      email,
      role
    });
    suMessage.textContent = 'Account created. You are signed in.';
  } catch (err) {
    suMessage.textContent = 'Error creating account: ' + (err.message || err.code);
    console.error(err);
  }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async ()=> {
  await signOut(auth);
});

// UI: Navigation
document.querySelectorAll('.nav-link').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(btn.dataset.page).classList.remove('hidden');
    document.querySelectorAll('.nav-link').forEach(n=>n.classList.remove('active'));
    btn.classList.add('active');
    // refresh page-specific data
    if (btn.dataset.page === 'dashboard') refreshDashboard();
    if (btn.dataset.page === 'evaluations') loadEvaluations();
    if (btn.dataset.page === 'coaching') loadCoachingLogs();
    if (btn.dataset.page === 'reports') renderReports();
    if (btn.dataset.page === 'admin') renderAdmin();
  });
});

// Modal helpers
function openModal(id){ document.getElementById('modal-overlay').classList.remove('hidden'); document.querySelector(id).classList.remove('hidden'); }
function closeModalByEl(el){ document.getElementById('modal-overlay').classList.add('hidden'); el.classList.add('hidden'); }
document.querySelectorAll('.close-modal').forEach(b=> b.addEventListener('click', ()=> { document.getElementById('modal-overlay').classList.add('hidden'); document.querySelectorAll('.modal').forEach(m=>m.classList.add('hidden')); }));

// Auth state & role enforcement
let currentUser = null;
let currentRole = 'agent';
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // show auth screen
    authScreen.classList.remove('hidden');
    appEl.classList.add('hidden');
    currentUser = null; currentRole = 'agent';
    return;
  }
  currentUser = user;
  // fetch role from Firestore
  const docRef = doc(db, 'users', user.uid);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const d = snap.data();
    currentRole = d.role || 'agent';
  } else {
    // default create user doc with agent role
    await setDoc(docRef, { displayName: user.displayName || user.email, email: user.email, role: 'agent' });
    currentRole = 'agent';
  }

  // show app
  authScreen.classList.add('hidden');
  appEl.classList.remove('hidden');

  // show/hide admin tab
  document.getElementById('adminTab').style.display = currentRole === 'admin' ? 'inline-block' : 'none';

  // initial load
  refreshDashboard();
  loadEvaluations();
  loadCoachingLogs();
  renderReports();
  renderAdmin();
});

// ------------------------ Firestore data stores ------------------------
/*
Collections used:
- users (user profile docs with role)
- members (simple list of team members)
- evaluations (evaluation docs)
- coachingLogs (coaching logs)
- criteria (single doc or collection; here we'll use a document 'settings/criteria' for array)
*/

// Utility: realtime list populate
async function populateSelects() {
  // members
  const membersSnap = await getDocs(collection(db, 'members'));
  const members = [];
  membersSnap.forEach(d=> members.push({ id:d.id, ...d.data() }));
  // fill selects
  const memberOptions = ['<option value="">-- Select --</option>'].concat(members.map(m=>`<option value="${m.name}">${m.name}</option>`)).join('');
  document.querySelectorAll('#filter-member,#eval-member,#coach-member,#coach-filter-member').forEach(el=> el.innerHTML = memberOptions);

  // users (for evaluators/coaches)
  const usersSnap = await getDocs(collection(db,'users'));
  const users = [];
  usersSnap.forEach(d=> users.push({ id:d.id, ...d.data() }));
  const userOptions = ['<option value="">-- Select --</option>'].concat(users.map(u=>`<option value="${u.displayName || u.email}">${u.displayName || u.email} (${u.role||'agent'})</option>`)).join('');
  document.querySelectorAll('#filter-evaluator,#eval-evaluator,#coach-coach,#coach-filter-coach').forEach(el=> el.innerHTML = userOptions);

  // criteria
  const critDoc = await getDoc(doc(db,'settings','criteria'));
  if (critDoc.exists()) {
    window.criteria = critDoc.data().list || [];
  } else {
    window.criteria = ["Communication","Relationship Building","Problem-Solving","Task Management","Customer Service","Analytical & Reporting Skills","Accuracy & Attention to Detail"];
    await setDoc(doc(db,'settings','criteria'), { list: window.criteria });
  }
  renderCriteriaList();
}

// criteria UI
function renderCriteriaList(){
  const listEl = document.getElementById('criteria-list');
  listEl.innerHTML = (window.criteria || []).map((c,idx)=> `<li>${c} <button data-idx="${idx}" class="btn small remove-crit">Remove</button></li>`).join('');
}

// Admin: create Auth user + users doc
import { createUserWithEmailAndPassword as createAuthUser } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

document.getElementById('add-user-btn').addEventListener('click', async () => {
  if (currentRole !== 'admin') return alert('Only admin can create users');
  const email = document.getElementById('new-user-email').value.trim();
  const displayName = document.getElementById('new-user-name').value.trim();
  const role = document.getElementById('new-user-role').value;
  const password = document.getElementById('new-user-password').value || 'Password123';
  try {
    // create auth user by signing in as admin isn't ideal - but createUserWithEmailAndPassword works for logged-in admin client-side
    const cred = await createAuthUser(auth, email, password);
    // Set display name
    await setDoc(doc(db,'users', cred.user.uid), { displayName: displayName || email, email, role });
    alert('User created. Password: ' + password + '\nAdvise user to change password on first login.');
    document.getElementById('new-user-email').value=''; document.getElementById('new-user-name').value=''; document.getElementById('new-user-password').value='';
    renderAdmin();
    populateSelects();
  } catch (err) {
    console.error(err); alert('Error creating user: '+(err.message||err.code));
  }
});

// Admin: add member
document.getElementById('add-member-btn').addEventListener('click', async () => {
  if (currentRole !== 'admin') return alert('Only admin can add members');
  const name = document.getElementById('new-member-name').value.trim();
  if (!name) return;
  await addDoc(collection(db,'members'), { name });
  document.getElementById('new-member-name').value = '';
  populateSelects();
  renderAdmin();
});

// Admin: add criteria
document.getElementById('add-criteria-btn').addEventListener('click', async () => {
  if (currentRole !== 'admin') return alert('Only admin can add criteria');
  const c = document.getElementById('new-criteria').value.trim();
  if (!c) return;
  window.criteria.push(c);
  await setDoc(doc(db,'settings','criteria'), { list: window.criteria });
  document.getElementById('new-criteria').value='';
  renderCriteriaList();
});

// criteria remove
document.getElementById('criteria-list').addEventListener('click', async (e) => {
  if (e.target.classList.contains('remove-crit')) {
    if (currentRole !== 'admin') return alert('Only admin can remove criteria');
    const idx = Number(e.target.dataset.idx);
    window.criteria.splice(idx,1);
    await setDoc(doc(db,'settings','criteria'), { list: window.criteria });
    renderCriteriaList();
  }
});

// render admin lists
async function renderAdmin() {
  // only admin sees the tab; function can be called safely
  const teamList = document.getElementById('team-list');
  teamList.innerHTML = '';
  const membersSnap = await getDocs(collection(db,'members'));
  membersSnap.forEach(d => teamList.innerHTML += `<li>${d.data().name} <button data-id="${d.id}" class="btn small remove-member">Remove</button></li>`);

  // users list
  const usersList = document.getElementById('users-list');
  usersList.innerHTML = '';
  const usersSnap = await getDocs(collection(db,'users'));
  usersSnap.forEach(d => {
    const u = d.data();
    usersList.innerHTML += `<li>${u.displayName || u.email} (${u.role}) <button data-id="${d.id}" class="btn small remove-user">Remove</button></li>`;
  });
}

// remove handlers
document.body.addEventListener('click', async (e) => {
  if (e.target.classList.contains('remove-member')) {
    if (!confirm('Remove member?')) return;
    await deleteDoc(doc(db,'members', e.target.dataset.id));
    populateSelects(); renderAdmin();
  }
  if (e.target.classList.contains('remove-user')) {
    if (!confirm('Remove user doc? (This will NOT delete Auth account)')) return;
    await deleteDoc(doc(db,'users', e.target.dataset.id));
    renderAdmin(); populateSelects();
  }
});

// ---------------- Evaluations ----------------
document.getElementById('add-eval').addEventListener('click', async () => {
  await populateSelects();
  buildSkillsGrid();
  openModal('#eval-modal');
});

function buildSkillsGrid(){
  const grid = document.getElementById('skills-grid');
  grid.innerHTML = '';
  (window.criteria || []).forEach(crit => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `<label style="font-weight:600">${crit}</label><input class="skill-input input" type="number" min="1" max="5" value="3" data-crit="${crit}">`;
    grid.appendChild(wrapper);
  });
  document.querySelectorAll('.skill-input').forEach(i=>i.addEventListener('input', updateTotalScore));
  updateTotalScore();
}
function updateTotalScore(){
  const inputs = document.querySelectorAll('.skill-input');
  if (!inputs.length) { document.getElementById('total-score').innerText='0'; return; }
  let sum=0;
  inputs.forEach(i=> sum += Number(i.value || 0));
  const avg = sum / inputs.length;
  document.getElementById('total-score').innerText = (Math.round(avg*100)/100).toFixed(2);
}

// submit evaluation
document.getElementById('eval-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const member = document.getElementById('eval-member').value;
  const date = document.getElementById('eval-date').value;
  const evaluator = document.getElementById('eval-evaluator').value;
  const comments = document.getElementById('eval-comments').value;
  const scores = {};
  document.querySelectorAll('.skill-input').forEach(i=> scores[i.dataset.crit] = Number(i.value));
  const total = Number(document.getElementById('total-score').innerText);
  await addDoc(collection(db,'evaluations'), { member, evaluator, date, scores, comments, total, createdAt: new Date() });
  closeModalByEl(document.getElementById('eval-modal'));
});

// load evaluations into table with filters
async function loadEvaluations(){
  await populateSelects();
  // realtime
  const q = query(collection(db,'evaluations'));
  onSnapshot(q, snap => {
    const tbody = document.querySelector('#eval-table tbody');
    tbody.innerHTML = '';
    const rows = [];
    snap.forEach(d => rows.push({ id:d.id, ...d.data() }));
    rows.sort((a,b)=> (b.date||'').localeCompare(a.date||''));
    rows.forEach(r => {
      const entries = Object.entries(r.scores||{});
      const sorted = entries.sort((a,b)=> b[1]-a[1]);
      const top = sorted[0] ? sorted[0][0] : '';
      const low = sorted[sorted.length-1] ? sorted[sorted.length-1][0] : '';
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.member}</td><td>${r.evaluator}</td><td>${r.total?.toFixed(2)||'-'}</td><td>${top}</td><td>${low}</td><td><button class="btn small view-eval" data-id="${r.id}">View</button></td>`;
      tbody.appendChild(tr);
    });
    // attach view listeners
    document.querySelectorAll('.view-eval').forEach(btn=> btn.addEventListener('click', async (ev)=>{
      const id = ev.target.dataset.id;
      const docSnap = await getDoc(doc(db,'evaluations', id));
      if (!docSnap.exists()) return alert('Not found');
      const r = docSnap.data();
      alert(`Evaluation\nMember: ${r.member}\nDate: ${r.date}\nEvaluator: ${r.evaluator}\nTotal: ${r.total}\nComments: ${r.comments}`);
    }));
  });
}

// filters simple (re-run table on input)
['#filter-member','#filter-month','#filter-evaluator','#filter-score','#filter-search'].forEach(sel=>{
  const el = document.querySelector(sel);
  if (el) el.addEventListener('input', () => loadEvaluations());
});

// ---------------- Coaching Logs ----------------
document.getElementById('add-coach').addEventListener('click', async ()=> {
  await populateSelects();
  openModal('#coach-modal');
});

// submit coaching log
document.getElementById('coach-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const member = document.getElementById('coach-member').value;
  const coach = document.getElementById('coach-coach').value;
  const date = document.getElementById('coach-date').value;
  const topics = document.getElementById('coach-topics').value;
  const actions = document.getElementById('coach-actions').value;
  const followup = document.getElementById('coach-followup').value;
  const ackText = document.getElementById('ack-text').value || '';
  const ackDate = document.getElementById('ack-date').value || null;
  const createdBy = currentUser ? currentUser.uid : null;
  await addDoc(collection(db,'coachingLogs'), {
    member, coach, date, topics, actions, followup, agentAcknowledgement: ackText, acknowledgementDate: ackDate, createdBy, createdAt: new Date()
  });
  closeModalByEl(document.getElementById('coach-modal'));
});

// load coaching logs
async function loadCoachingLogs(){
  await populateSelects();
  const q = query(collection(db,'coachingLogs'));
  onSnapshot(q, snap => {
    const tbody = document.querySelector('#coach-table tbody');
    tbody.innerHTML = '';
    const rows = [];
    snap.forEach(d => rows.push({ id:d.id, ...d.data() }));
    rows.sort((a,b)=> (b.date||'').localeCompare(a.date||''));
    rows.forEach(r=>{
      const tr = document.createElement('tr');
      const status = r.acknowledgementDate ? `Acknowledged (${r.acknowledgementDate})` : 'Pending';
      tr.innerHTML = `<td>${r.member}</td><td>${r.coach}</td><td>${r.topics}</td><td>${r.followup || '-'}</td><td>${status}</td><td><button class="btn small view-coach" data-id="${r.id}">View</button></td>`;
      tbody.appendChild(tr);
    });
    // view coaches
    document.querySelectorAll('.view-coach').forEach(btn => btn.addEventListener('click', async (ev) => {
      const id = ev.target.dataset.id;
      const snap = await getDoc(doc(db,'coachingLogs', id));
      const r = snap.data();
      // show a custom dialog allowing agents to add/edit acknowledgement if they are agent and the log exists
      const isAgent = currentRole === 'agent';
      let msg = `Member: ${r.member}\nCoach: ${r.coach}\nDate: ${r.date}\nTopics: ${r.topics}\nActions: ${r.actions}\nFollow-up: ${r.followup}\n\nAcknowledgement: ${r.agentAcknowledgement || '—'}\nAcknowledged on: ${r.acknowledgementDate || '—'}`;
      if (isAgent) {
        // Prompt agent to add/edit acknowledgement
        const newAck = prompt("Write your acknowledgement (edit allowed):", r.agentAcknowledgement || "");
        if (newAck !== null) {
          const ackDate = new Date().toISOString().slice(0,10);
          await updateDoc(doc(db,'coachingLogs', id), { agentAcknowledgement: newAck, acknowledgementDate: ackDate });
          alert('Acknowledgement saved.');
        }
      } else {
        alert(msg);
      }
    }));
  });
}

// ---------------- Dashboard & Reports ----------------
let lineChart, skillChart, coachChart;
async function refreshDashboard(){
  await populateSelects();
  // compute metrics from evaluations and coachingLogs
  const evalSnap = await getDocs(collection(db,'evaluations'));
  const coachingSnap = await getDocs(collection(db,'coachingLogs'));
  const evals = []; evalSnap.forEach(d=> evals.push(d.data()));
  const coachs = []; coachingSnap.forEach(d=> coachs.push(d.data()));
  // avg (this month)
  const nowMonth = new Date().toISOString().slice(0,7);
  const monthEvals = evals.filter(e => e.date && e.date.slice(0,7) === nowMonth);
  const avg = monthEvals.length ? (monthEvals.reduce((s,e)=> s + (e.total||0),0) / monthEvals.length) : (evals.length ? (evals.reduce((s,e)=> s + (e.total||0),0)/evals.length) : 0);
  document.getElementById('avg-score').innerText = avg ? (Math.round(avg*100)/100).toFixed(2) : '-';
  document.getElementById('total-coaching').innerText = coachs.length;
  document.getElementById('members-evaluated').innerText = new Set(evals.map(e=> e.member)).size;

  // top skill
  const skillSums = {};
  evals.forEach(ev => {
    Object.entries(ev.scores||{}).forEach(([k,v]) => { skillSums[k] = (skillSums[k]||0) + v; });
  });
  const top = Object.keys(skillSums).length ? Object.entries(skillSums).sort((a,b)=> b[1]-a[1])[0][0] : '-';
  document.getElementById('top-skill').innerText = top;

  // line chart: average per month
  const monthly = {};
  evals.forEach(ev => { if (!ev.date) return; const key = ev.date.slice(0,7); if (!monthly[key]) monthly[key]=[]; monthly[key].push(ev.total||0); });
  const labels = Object.keys(monthly).sort();
  const avgVals = labels.map(l => monthly[l].reduce((a,b)=>a+b,0)/monthly[l].length);
  const ctx = document.getElementById('lineChart').getContext('2d');
  if (lineChart) lineChart.destroy();
  lineChart = new Chart(ctx, { type:'line', data:{ labels, datasets:[{ label:'Avg', data:avgVals, tension:0.3, fill:false }]}, options:{ plugins:{ legend:{display:false} }, scales:{ y:{ min:0, max:5 } } }});
}

// Reports charts
async function renderReports(){
  const evalSnap = await getDocs(collection(db,'evaluations'));
  const coachingSnap = await getDocs(collection(db,'coachingLogs'));
  const evals = []; evalSnap.forEach(d=> evals.push(d.data()));
  const coachs = []; coachingSnap.forEach(d=> coachs.push(d.data()));

  // avg by skill
  const skillSums = {}, skillCounts = {};
  evals.forEach(ev => Object.entries(ev.scores||{}).forEach(([k,v]) => { skillSums[k]=(skillSums[k]||0)+v; skillCounts[k]=(skillCounts[k]||0)+1; }));
  const skills = Object.keys(skillSums);
  const avgBySkill = skills.map(k => skillSums[k]/skillCounts[k] || 0);
  const ctx1 = document.getElementById('skillChart').getContext('2d');
  if (skillChart) skillChart.destroy();
  skillChart = new Chart(ctx1, { type:'bar', data:{ labels:skills, datasets:[{ label:'Avg Score', data: avgBySkill }]}, options:{ indexAxis:'y', plugins:{ legend:{display:false} }, scales:{ x:{ min:0, max:5 }}}});

  // coaching per employee
  const coachCounts = {};
  coachs.forEach(c=> coachCounts[c.member] = (coachCounts[c.member]||0)+1 );
  const coachLabels = Object.keys(coachCounts);
  const coachVals = coachLabels.map(l=> coachCounts[l]);
  const ctx2 = document.getElementById('coachChart').getContext('2d');
  if (coachChart) coachChart.destroy();
  coachChart = new Chart(ctx2, { type:'bar', data:{ labels: coachLabels, datasets:[{ label:'Coaching Sessions', data: coachVals }]}, options:{ plugins:{ legend:{display:false} } }});
}

// Export CSV & PDF
document.getElementById('export-csv').addEventListener('click', async () => {
  const evalSnap = await getDocs(collection(db,'evaluations'));
  const coachSnap = await getDocs(collection(db,'coachingLogs'));
  const rows = [["Type","Team Member","Evaluator/Coach","Date","Total/Notes"]];
  evalSnap.forEach(d => { const e = d.data(); rows.push(["Evaluation", e.member, e.evaluator, e.date, e.total || '']); });
  coachSnap.forEach(d => { const c = d.data(); rows.push(["Coaching", c.member, c.coach, c.date, c.topics || '']); });
  const csv = rows.map(r=> r.map(it=> `"${String(it||'').replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'royal_vending_report.csv'; a.click(); URL.revokeObjectURL(url);
});

document.getElementById('export-pdf').addEventListener('click', async () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16); doc.text("Royal Vending — Report", 12, 18);
  doc.setFontSize(11); doc.text(`Generated: ${new Date().toLocaleString()}`, 12, 26);
  const evalSnap = await getDocs(collection(db,'evaluations'));
  let y = 36;
  evalSnap.forEach(d => {
    const e = d.data();
    const text = `${e.date || ''} • ${e.member} • ${e.evaluator} • total: ${e.total || ''}`;
    const split = doc.splitTextToSize(text, 180);
    doc.text(split, 12, y); y += split.length * 6;
    if (y > 270){ doc.addPage(); y = 20; }
  });
  doc.save('royal_vending_report.pdf');
});

// initial population
populateSelects();