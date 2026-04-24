console.log("register.js loaded");

const supabaseClient = window.supabaseClient;

/* =====================================================
   ✅ ADDITIVE MESSAGE HELPER (CONSISTENT)
===================================================== */
function showRegisterMessage(text, type = "error") {
  const msg = document.getElementById("registerMessage");
  if (!msg) return;

  msg.textContent = text;
  msg.style.color = type === "success" ? "green" : "red";
}

window.registerCustomer = async function registerCustomer() {
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const address = document.getElementById("address").value.trim();
  const postcode = document.getElementById("postcode").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();
  const msg = document.getElementById("registerMessage");

  /* ---------------- CLEAR PREVIOUS MESSAGE ---------------- */
  showRegisterMessage("");

  /* ---------------- REQUIRED FIELDS ---------------- */
  if (!firstName || !lastName || !email || !password) {
    showRegisterMessage("Please fill in all required fields.");
    return;
  }

  /* ---------------- EMAIL FORMAT VALIDATION (ADDED) ---------------- */
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    showRegisterMessage("Please enter a valid email address.");
    return;
  }

  /* ---------------- PASSWORD MATCH ---------------- */
  if (password !== confirmPassword) {
    showRegisterMessage("Passwords do not match.");
    return;
  }

  /* ---------------- PASSWORD STRENGTH (ADDED) ---------------- */
  if (password.length < 6) {
    showRegisterMessage("Password must be at least 6 characters.");
    return;
  }

  /* ---------------- CREATE AUTH USER ---------------- */
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) {
    showRegisterMessage(error.message);
    return;
  }

  /* ---------------- CREATE CUSTOMER PROFILE ---------------- */
  const { error: insertError } = await supabaseClient
    .from("tbl_customer")
    .insert({
      auth_user_id: data.user.id,
      firstname: firstName,
      lastname: lastName,
      address,
      postcode,
      loyaltypoints: 0
    });

  if (insertError) {
    showRegisterMessage("Failed to create customer profile.");
    return;
  }

  /* ---------------- SUCCESS ---------------- */
  showRegisterMessage("Account created successfully!", "success");

  setTimeout(() => {
    window.location.href = "index.html";
  }, 1000);
}
