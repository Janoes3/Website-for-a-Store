console.log("register.js loaded");

const supabaseClient = window.supabaseClient;

async function registerCustomer() {
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const address = document.getElementById("address").value.trim();
  const postcode = document.getElementById("postcode").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();
  const msg = document.getElementById("registerMessage");

  if (!firstName || !lastName || !email || !password) {
    msg.textContent = "Please fill in all required fields.";
    msg.style.color = "red";
    return;
  }

  if (password !== confirmPassword) {
    msg.textContent = "Passwords do not match.";
    msg.style.color = "red";
    return;
  }

  // ✅ Create Supabase Auth user
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) {
    msg.textContent = error.message;
    msg.style.color = "red";
    return;
  }

  // ✅ Create customer profile linked to auth user
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
    msg.textContent = "Failed to create customer profile.";
    msg.style.color = "red";
    return;
  }

  msg.textContent = "Account created successfully!";
  msg.style.color = "green";

  setTimeout(() => {
    window.location.href = "index.html";
  }, 1000);
}
