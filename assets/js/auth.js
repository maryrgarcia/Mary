const API_BASE = "https://script.google.com/macros/s/AKfycbxsuerdXI0qdT40PbJ1fyU_i0o6QqFAL53fKMD89i7BZNo8uVv_qrQ-5t-AXOgBkXZFuQ/exec";

// Send POST request to Apps Script
async function apiPost(endpoint, data) {
    const response = await fetch(`${API_BASE}?endpoint=${endpoint}`, {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    return response.json();
}

// Login function
document.getElementById("loginBtn").addEventListener("click", async () => {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
        alert("Please enter username and password");
        return;
    }

    try {
        const result = await apiPost("login", { username, password });

        if (result.success) {
            localStorage.setItem("user", JSON.stringify(result.user));
            window.location.href = "dashboard.html";
        } else {
            alert(result.message || "Invalid login");
        }

    } catch (error) {
        console.error("Login error:", error);
        alert("Cannot connect to server. Check Apps Script deployment.");
    }
});
