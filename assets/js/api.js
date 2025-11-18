const API_BASE = "https://script.google.com/macros/s/AKfycbwvoK-o8GyoSLb6hBZwpm7u2CJy7HSUTxUtQuDOjyz0OqrzsYdkMw4YKh_XNXmAv2-_Pw/exec";

async function apiPost(endpoint, data = {}) {
    const response = await fetch(`${API_BASE}?endpoint=${endpoint}`, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    return response.json();
}

async function apiGet(endpoint) {
    const response = await fetch(`${API_BASE}?endpoint=${endpoint}`, {
        method: "GET",
        mode: "cors"
    });

    return response.json();
}
