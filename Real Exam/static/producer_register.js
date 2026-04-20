console.log("producer_register.js loaded");

const supabaseClient = window.supabaseClient;

async function registerProducer() {
  const name = document.getElementById("producerName").value.trim();
  const email = document.getElementById("producerEmail").value.trim();
  const phone = document.getElementById("producerPhone").value.trim();
  const address = document.getElementById("producerAddress").value.trim();
  const desc = document.getElementById("producerDescription").value.trim();
  const methods = document.getElementById("producerMethods").value.trim();
  const password = document.getElementById("producerPassword").value.trim();
  const msg = document.getElementById("producerRegisterMessage");

  if (!name || !email || !password) {
    msg.textContent = "Please fill all required fields.";
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

  // ✅ Create producer profile
  const { error: insertError } = await supabaseClient
    .from("tbl_producer")
    .insert({
      auth_user_id: data.user.id,
      producername: name,
      producerdescription: desc,
      farmingmethods: methods,
      contactphone: phone,
      address
    });

  if (insertError) {
    msg.textContent = "Failed to create producer profile.";
    msg.style.color = "red";
    return;
  }

  msg.textContent = "Producer account created!";
  msg.style.color = "green";

  setTimeout(() => {
    window.location.href = "producer_login.html";
  }, 1200);
}
