console.log("auth.js loaded");

// LOGIN ---------------------------------------
document.addEventListener("DOMContentLoaded", () => {

  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      const result = await apiPost("login", { email, password });
      console.log("Login result:", result);

      alert(result.message || (result.success ? "Login OK" : "Error"));
    });
  }

  // SIGNUP -------------------------------------
  const signupBtn = document.getElementById("signupBtn");
  if (signupBtn) {
    signupBtn.addEventListener("click", async () => {
      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      const result = await apiPost("signup", { name, email, password });
      console.log("Signup result:", result);

      alert(result.message);
    });
  }

});
