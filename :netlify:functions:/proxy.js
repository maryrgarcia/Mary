// netlify/functions/proxy.js
const fetch = require("node-fetch");

exports.handler = async function(event, context) {
  try {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const payload = JSON.parse(event.body);

    // Forward request to your Google Apps Script Web App
    const response = await fetch("https://script.google.com/macros/s/AKfycbzrcp42cLgTrdttpe2XQds6RoLXJAcyHQUIItt2huaV6triutQGoaQpo2RwCiK_siIlSQ/exec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", 
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
      },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: String(err) })
    };
  }
};
