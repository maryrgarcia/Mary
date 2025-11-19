const API_BASE = "https://script.google.com/macros/s/AKfycbwPDm0-pMqPOUfyP6OknUuhodt5xpYCdzfImIh-z5BQ3t24Wg02u9T_lY0zyV1uT6-u/exec";

async function apiPost(endpoint, data = {}) {
    try {
        const response = await fetch(`${API_BASE}?endpoint=${endpoint}`, {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        return await response.json();
    } catch (err) {
        console.error("API POST error:", err);
        return { success: false, message: "Request failed" };
    }
}
