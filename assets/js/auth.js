const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const authMessage = document.getElementById("authMessage");

loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    authMessage.textContent = "Please enter username/email and password";
    return;
  }

  const result = await apiPost({
    action: "login",
    payload: { email, password }
  });

  if (result.success) {
    authMessage.textContent = "Login successful! Redirecting...";
    const role = result.user.role.toLowerCase();
    if (role === "admin") window.location.href = "dashboard.html";
    else if (role === "evaluator") window.location.href = "evaluations.html";
    else window.location.href = "agent.html";
  } else {
    authMessage.textContent = result.message;
  }
});

signupBtn.addEventListener("click", () => {
  window.location.href = "signup.html";
});
