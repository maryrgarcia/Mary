// wrapper for API
const API_BASE = 'https://script.google.com/macros/s/https://script.google.com/macros/s/AKfycbxsuerdXI0qdT40PbJ1fyU_i0o6QqFAL53fKMD89i7BZNo8uVv_qrQ-5t-AXOgBkXZFuQ/exec'; // replace
export async function callApi(action, payload) {
  const res = await fetch(API_BASE, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action, payload }) });
  return res.json();
}
