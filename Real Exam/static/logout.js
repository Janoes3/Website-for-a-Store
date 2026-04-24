
console.log("logout.js loaded");

window.logout = async function logout() {
  await window.supabaseClient.auth.signOut();
  localStorage.clear();
  window.location.href = "login.html";
}