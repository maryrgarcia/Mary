// api.js
const API_BASE = "/.netlify/functions/proxy";

async function apiPost(payload) {
  try {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("API POST error:", err);
    return { success: false, message: "Request failed" };
  }
}
