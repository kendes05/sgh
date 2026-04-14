const loginForm = document.getElementById("loginForm");
const changePasswordForm = document.getElementById("changePasswordForm");

const loginScreen = document.getElementById("login-screen");
const changePasswordScreen = document.getElementById("change-password-screen");

let authToken = null;

// LOGIN
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("http://localhost:8080/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error("Credenciais inválidas");
    }

    const data = await response.json();

    authToken = data.token;

    // 👇 lógica principal
    if (data.mustChangePassword) {
      loginScreen.classList.add("hidden");
      changePasswordScreen.classList.remove("hidden");
    } else {
      alert("Login realizado com sucesso!");
      // aqui você pode redirecionar
      // window.location.href = "/dashboard.html";
    }

  } catch (error) {
    document.getElementById("login-error").innerText = error.message;
  }
});


// TROCAR SENHA
changePasswordForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;

  try {
    const response = await fetch("http://localhost:8080/auth/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    if (!response.ok) {
      throw new Error("Erro ao atualizar senha");
    }

    alert("Senha atualizada com sucesso!");

    // depois de trocar senha → segue fluxo normal
    window.location.href = "/dashboard.html";

  } catch (error) {
    document.getElementById("change-error").innerText = error.message;
  }
});