const API_BASE = "https://script.google.com/macros/s/AKfycbxsuerdXI0qdT40PbJ1fyU_i0o6QqFAL53fKMD89i7BZNo8uVv_qrQ-5t-AXOgBkXZFuQ/exec";

// Safe API POST helper
async function apiPost(endpoint, data = {}) {
    const response = await fetch(`${API_BASE}?endpoint=${endpoint}`, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return response.json();
}

// Wait until DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("loginBtn");

    if (!loginBtn) return; // Exit if no login button on this page

    loginBtn.addEventListener("click", async () => {
        const usernameField = document.getElementById("username");
        const passwordField = document.getElementById("password");

        if (!usernameField || !passwordField) {
            alert("Login fields are missing on this page.");
            return;
        }

        const username = usernameField.value.trim();
        const password = passwordField.value.trim();

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
});
