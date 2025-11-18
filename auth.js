// Simple auth using Apps Script API (Google Sheets backend)
const API_BASE = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec'; // replace after deploying Apps Script

async function apiPost(action, payload) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ action, payload })
  });
  return res.json();
}

// Sign in on login page
const emailEl = document.getElementById('email');
const passwordEl = document.getElementById('password');
const btnSignIn = document.getElementById('btnSignIn');
const btnShowSignup = document.getElementById('btnShowSignup');
const authMessage = document.getElementById('authMessage');

if (btnSignIn) btnSignIn.addEventListener('click', async ()=>{
  authMessage.textContent = 'Signing in…';
  const email = emailEl.value.trim();
  const pw = passwordEl.value;
  const r = await apiPost('login', { email, password: pw });
  if (r && r.success) {
    // store session in sessionStorage (simple)
    sessionStorage.setItem('rvc_user', JSON.stringify(r.user));
    location.href = 'dashboard.html';
  } else {
    authMessage.textContent = r.message || 'Login failed';
  }
});

if (btnShowSignup) btnShowSignup.addEventListener('click', ()=>{
  // simple inline signup prompt (for admin provisioning, real deploy should restrict)
  const name = prompt('Full name for account:');
  const email = prompt('Email:');
  const pw = prompt('Password:');
  const role = prompt('Role (admin/evaluator/agent):','agent');
  if (!email || !pw) return alert('Cancelled');
  apiPost('signup', { name, email, password: pw, role }).then(res=> {
    alert(res.message || 'Done');
  });
});

// Logout button (present on app pages)
const btnLogout = document.getElementById('btnLogout');
if (btnLogout) btnLogout.addEventListener('click', ()=>{
  sessionStorage.removeItem('rvc_user'); location.href = 'index.html';
});

// helper: require login on pages
function requireLogin() {
  const user = sessionStorage.getItem('rvc_user');
  if (!user) { location.href = 'index.html'; return null; }
  return JSON.parse(user);
}
