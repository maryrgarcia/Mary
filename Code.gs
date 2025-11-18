/**
 * Apps Script backend for Royal Vending Coaching System
 * Spreadsheet name: Royal Vending Coaching System (Master Sheet)
 *
 * The script responds to POST requests with JSON bodies containing:
 * { action: "login"|"signup"|"addEvaluation"|"listEvaluations"|"addCoaching"|"listCoaching"|"acknowledge"|... , payload: {} }
 */

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const p = body.payload || {};
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    // Ensure sheets exist
    const users = getSheet(ss,'Users');
    const evals = getSheet(ss,'Evaluations');
    const coaching = getSheet(ss,'CoachingLogs');
    const members = getSheet(ss,'Members');
    const criteria = getSheet(ss,'Criteria');
    if (action === 'signup') return signup(p);
    if (action === 'login') return login(p);
    if (action === 'addEvaluation') return addEvaluation(p);
    if (action === 'listEvaluations') return listEvaluations();
    if (action === 'addCoaching') return addCoaching(p);
    if (action === 'listCoaching') return listCoaching();
    if (action === 'acknowledge') return acknowledge(p);
    if (action === 'getDashboard') return getDashboard();
    if (action === 'addMember') return addMember(p);
    if (action === 'addCriteria') return addCriteria(p);
    if (action === 'adminList') return adminList();
    return jsonResponse({ success:false, message:'Unknown action' });
  } catch(err) { return jsonResponse({ success:false, message: String(err) }); }
}

function getSheet(ss,name){
  let s = ss.getSheetByName(name);
  if (!s) s = ss.insertSheet(name);
  return s;
}

function jsonResponse(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function signup(p){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const users = getSheet(ss,'Users');
  // columns: email | name | passwordHash | role | createdAt
  const email = p.email;
  const name = p.name || '';
  const pw = p.password || '';
  const role = p.role || 'agent';
  // simple check existing
  const data = users.getDataRange().getValues();
  for (let i=0;i<data.length;i++){ if (data[i][0] === email) return jsonResponse({ success:false, message:'User exists' }); }
  const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, pw);
  const hex = hash.map(function(b){ if (b<0) b+=256; var h = b.toString(16); return h.length===1? '0'+h : h; }).join('');
  users.appendRow([email, name, hex, role, new Date()]);
  return jsonResponse({ success:true, message:'Account created' });
}

function login(p){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const users = getSheet(ss,'Users');
  const data = users.getDataRange().getValues();
  const email = p.email; const pw = p.password || '';
  const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, pw);
  const hex = hash.map(function(b){ if (b<0) b+=256; var h = b.toString(16); return h.length===1? '0'+h : h; }).join('');
  for (let i=0;i<data.length;i++){ if (data[i][0] === email && String(data[i][2]) === hex) { return jsonResponse({ success:true, user:{ email: data[i][0], name: data[i][1], role: data[i][3] } }); } }
  return jsonResponse({ success:false, message:'Invalid credentials' });
}

function addEvaluation(p){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const evals = getSheet(ss,'Evaluations');
  // columns: member | evaluator | date | total | notes | createdAt
  evals.appendRow([p.member, p.evaluator, p.date, p.total, p.notes || '', new Date()]);
  return jsonResponse({ success:true, message:'Saved' });
}

function listEvaluations(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const evals = getSheet(ss,'Evaluations');
  const data = evals.getDataRange().getValues();
  const items = [];
  for (let i=0;i<data.length;i++){ const r = data[i]; if (!r[0]) continue; items.push({ member:r[0], evaluator:r[1], date:r[2], total:r[3], notes:r[4] }); }
  return jsonResponse({ success:true, items });
}

function addCoaching(p){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const c = getSheet(ss,'CoachingLogs');
  // columns: id | member | coach | date | topics | actions | followup | ackText | ackDate | createdAt
  const id = Utilities.getUuid();
  c.appendRow([id, p.member, p.coach, p.date, p.topics || '', p.actions || '', p.followup || '', '', '', new Date()]);
  return jsonResponse({ success:true, message:'Saved' });
}

function listCoaching(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const c = getSheet(ss,'CoachingLogs');
  const data = c.getDataRange().getValues();
  const items = [];
  for (let i=0;i<data.length;i++){ const r=data[i]; if (!r[0]) continue; items.push({ _id:r[0], member:r[1], coach:r[2], date:r[3], topics:r[4], actions:r[5], followup:r[6], ackText:r[7], ackDate:r[8] }); }
  return jsonResponse({ success:true, items });
}

function acknowledge(p){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const c = getSheet(ss,'CoachingLogs');
  const data = c.getDataRange().getValues();
  for (let i=0;i<data.length;i++){ if (data[i][0] === p.id){ c.getRange(i+1,8).setValue(p.text); c.getRange(i+1,9).setValue(new Date()); return jsonResponse({ success:true, message:'Acknowledged' }); } }
  return jsonResponse({ success:false, message:'Not found' });
}

function getDashboard(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const evals = getSheet(ss,'Evaluations').getDataRange().getValues();
  const coach = getSheet(ss,'CoachingLogs').getDataRange().getValues();
  let totalCoaching = 0;
  if (coach && coach.length) totalCoaching = coach.filter(function(r){return r[0];}).length;
  const membersEvaluated = {};
  var avgThisMonth = 0;
  var countThisMonth = 0;
  var now = new Date();
  var nowMonth = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM');
  if (evals) for (var i=0;i<evals.length;i++){ var r=evals[i]; if (!r[0]) continue; membersEvaluated[r[0]] = true; if (r[2] && String(r[2]).indexOf(nowMonth) === 0) { avgThisMonth += Number(r[3])||0; countThisMonth++; } }
  if (countThisMonth) avgThisMonth = avgThisMonth / countThisMonth;
  var topSkill = '-';
  return jsonResponse({ success:true, data: { avgThisMonth: (Math.round(avgThisMonth*100)/100), totalCoaching: totalCoaching, membersEvaluated: Object.keys(membersEvaluated).length, topSkill: topSkill } });
}

function addMember(p){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const m = getSheet(ss,'Members');
  m.appendRow([p.name, new Date()]);
  return jsonResponse({ success:true, message:'Member added' });
}

function addCriteria(p){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const c = getSheet(ss,'Criteria');
  c.appendRow([p.c, new Date()]);
  return jsonResponse({ success:true, message:'Criteria added' });
}

function adminList(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const users = getSheet(ss,'Users').getDataRange().getValues();
  const members = getSheet(ss,'Members').getDataRange().getValues();
  const crit = getSheet(ss,'Criteria').getDataRange().getValues();
  return jsonResponse({ success:true, data: { users: users, members: members, criteria: crit } });
}
