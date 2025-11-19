// Set to your Netlify function URL
const API_BASE = "/.netlify/functions/proxy";

async function apiPost(payload) {
  try {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return await response.json();
  } catch (err) {
    console.error("API POST error:", err);
    return { success: false, message: "Request failed" };
  }
}
