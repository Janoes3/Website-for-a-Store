
async function updateAuthUI() {
  const { data: { user } } = await supabaseClient.auth.getUser();

  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const welcomeUser = document.getElementById("welcomeUser");

  if (user) {
    // Logged in
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";

    const { data: customer } = await supabaseClient
      .from("tbl_customer")
      .select("firstname")
      .eq("auth_user_id", user.id)
      .single();

    if (customer) {
      welcomeUser.textContent = "Welcome, " + customer.firstname;
    }
  } else {
    // Logged out
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    welcomeUser.textContent = "";
  }
}

window.onload = updateAuthUI;

