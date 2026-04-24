console.log("producer_register.js loaded");

const supabaseClient = window.supabaseClient;

function showProducerRegisterMessage(text, type = "error") {
  const msg = document.getElementById("producerRegisterMessage");
  if (!msg) return;

  msg.textContent = text;
  msg.style.color = type === "success" ? "green" : "red";
}

window.registerProducer = async function registerProducer() {
  const name = document.getElementById("producerName").value.trim();
  const email = document.getElementById("producerEmail").value.trim(); // auth only
  const phone = document.getElementById("producerPhone").value.trim();
  const address = document.getElementById("producerAddress").value.trim();
  const description = document.getElementById("producerDescription").value.trim();
  const methods = document.getElementById("producerMethods").value.trim();
  const password = document.getElementById("producerPassword").value.trim();

  showProducerRegisterMessage("");

  if (!name || !email || !password) {
    showProducerRegisterMessage("Please fill in all required fields.");
    return;
  }

  if (password.length < 6) {
    showProducerRegisterMessage("Password must be at least 6 characters.");
    return;
  }

  // 1️⃣ Create Auth user
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) {
    showProducerRegisterMessage(error.message);
    return;
  }

  // 2️⃣ Insert producer profile 
  const { error: insertError } = await supabaseClient
    .from("tbl_producer")
    .insert({
      auth_user_id: data.user.id,
      producername: name,
      producerdescription: description,
      farmingmethods: methods,
      contactphone: phone,
      address: address
    });

  if (insertError) {
    console.error(insertError);
    showProducerRegisterMessage("Failed to create producer profile.");
    return;
  }

  showProducerRegisterMessage(
    "Producer account created successfully!",
    "success"
  );

  setTimeout(() => {
    window.location.href = "producer_login.html";
  }, 1200);
};