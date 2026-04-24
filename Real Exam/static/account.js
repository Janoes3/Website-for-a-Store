console.log("account.js loaded"); // Confirm that the js is loaded for the whole file

const supabaseClient = window.supabaseClient; // This refrences the global file for all the js

let customer = null;


function showAccountMessage(text, type = "error") {
  const msg = document.getElementById("accountMessage");

  if (!msg) return; // Check if the messsage element is missing

  // Set message text
  msg.textContent = text;

  
  msg.style.color = type === "success" ? "green" : "red";
}

/* =====================================================
   AUTH & ACCOUNT INITIALISATION
   - Checks logged-in user
   - Loads customer profile
   - Populates form fields
===================================================== */
async function initAccount() {
  try {
    // Get currently logged-in Supabase user
    const { data: { user }, error } =
      await supabaseClient.auth.getUser();

    // If user is not logged in, redirect to home/login
    if (error || !user) {
      window.location.href = "index.html";
      return;
    }

    // Fetch customer profile linked to auth user ID
    const { data } =
      await supabaseClient
        .from("tbl_customer")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();

    // If no matching customer record found
    if (!data) {
      showAccountMessage("Customer profile not found.");
      return;
    }

    // Store customer data globally
    customer = data;

    // Populate form inputs with existing data
    document.getElementById("firstName").value =
      customer.firstname || "";
    document.getElementById("lastName").value =
      customer.lastname || "";
    document.getElementById("contactPhone").value =
      customer.contactphone || "";
    document.getElementById("email").value =
      user.email || "";

    // Display loyalty points safely (null-safe)
    document.getElementById("loyaltyPointsBadge").textContent =
      "⭐ Points: " + (customer.loyaltypoints ?? 0);

  } catch (err) {
    // Log unexpected errors and notify the user
    console.error(err);
    showAccountMessage("Unable to load account details.");
  }
}

/* =====================================================
   UPDATE ACCOUNT DETAILS
   Triggered by: onclick="updateAccount()"
===================================================== */
window.updateAccount = async function updateAccount() {
  // Read updated values from the form
  const firstName =
    document.getElementById("firstName").value.trim();
  const lastName =
    document.getElementById("lastName").value.trim();
  const phone =
    document.getElementById("contactPhone").value.trim();

  // Reference the message element
  const msg =
    document.getElementById("accountMessage");

  // Always keep loyalty badge visible
  document.getElementById("loyaltyPointsBadge").textContent =
    "⭐ Points: " + (customer.loyaltypoints ?? 0);

  // Basic validation to prevent empty names
  if (!firstName || !lastName) {
    showAccountMessage("Name fields cannot be empty.");
    return;
  }

  try {
    // Update the customer record in Supabase
    const { error } =
      await supabaseClient
        .from("tbl_customer")
        .update({
          firstname: firstName,
          lastname: lastName,
          contactphone: phone
        })
        .eq("customer_id", customer.customer_id);

    // Handle database errors
    if (error) {
      showAccountMessage("Failed to update account.");
      return;
    }

    // Success feedback
    showAccountMessage(
      "Account details updated successfully.",
      "success"
    );

  } catch (err) {
    // Catch unexpected failures
    console.error(err);
    showAccountMessage("An unexpected error occurred.");
  }
}

/* =====================================================
   INITIALISE PAGE ON LOAD
===================================================== */
(async function init() {
  await initAccount();
})();