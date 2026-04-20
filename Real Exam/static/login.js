console.log("login.js loaded");

window.popupLogin = async function () {
  const email = document.getElementById("popupEmail").value.trim();
  const password = document.getElementById("popupPassword").value.trim();
  const msg = document.getElementById("popupLoginMessage");

  if (!email || !password) {
    msg.textContent = "Please fill all fields.";
    return;
  }

  const { error } = await window.supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    msg.textContent = "Invalid login details.";
    return;
  }

  // ✅ Reload page after login
  window.location.reload();
};