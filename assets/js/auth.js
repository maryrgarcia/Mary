const API_BASE = "https://script.google.com/macros/s/AKfycbwPDm0-pMqPOUfyP6OknUuhodt5xpYCdzfImIh-z5BQ3t24Wg02u9T_lY0zyV1uT6-u/exec";

async function apiPost(endpoint, data = {}) {
    const response = await fetch(`${API_BASE}?endpoint=${endpoint}`, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return response.json();
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("auth.js loaded");

    const loginBtn = document.getElementById("loginBtn");
    const createBtn = document.getElementById("createAccountBtn");

    if (loginBtn) {
        loginBtn.addEventListener("click", async () => {
            console.log("Login clicked");

            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value.trim();

            if (!username || !password) {
                alert("Please enter username and password");
                return;
            }

            try {
                const result = await apiPost("login", { username, password });
                console.log("Login result:", result);

                if (result.success) {
                    localStorage.setItem("user", JSON.stringify(result.user));

                    if (result.user.role === "admin") {
                        window.location.href = "dashboard.html";
                    } else if (result.user.role === "evaluator") {
                        window.location.href = "evaluations.html";
                    } else {
                        window.location.href = "dashboard.html";
                    }

                } else {
                    alert(result.message);
                }
            } catch (e) {
                alert("Server error. Please try again.");
            }
        });
    }

    if (createBtn) {
        createBtn.addEventListener("click", () => {
            window.location.href = "signup.html";
        });
    }
});
