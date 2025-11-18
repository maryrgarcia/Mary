const API_BASE = "https://script.google.com/macros/s/AKfycbyNfryd61KHxQr_E3aOQAhiLn1OQiG7Tup9x9ojij44TtH3hTqFrSGVTAxwCWiK_mV8qw/exec";

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
