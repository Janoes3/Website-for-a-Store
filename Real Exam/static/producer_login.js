console.log("producer_login.js loaded");

const supabaseClient = window.supabaseClient;

async function producerLogin() {
  const email = document.getElementById("producerEmail").value.trim();
  const password = document.getElementById("producerPassword").value.trim();
  const msg = document.getElementById("producerLoginMessage");

  msg.textContent = "";

  if (!email || !password) {
    msg.textContent = "Please enter email and password.";
    return;
  }

  // 1. Authenticate
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    msg.textContent = "Invalid login details.";
    return;
  }

  // 2. Check producer profile
  const { data: producer } = await supabaseClient
    .from("tbl_producer")
    .select("*")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (!producer) {
    msg.textContent = "This account is not a producer.";
    return;
  }

  // 3. Store and redirect
  localStorage.setItem("producer", JSON.stringify(producer));
  window.location.href = "producer_dashboard.html";
}