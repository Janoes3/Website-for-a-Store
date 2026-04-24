/* =====================================================
   UPDATE AUTH UI
   - Checks if a user is logged in
   - Toggles Login / Logout buttons
   - Displays a welcome message for customers
   - Handles errors defensively
===================================================== */
async function updateAuthUI() {
  try {
    // Retrieve the currently authenticated Supabase user
    const { data: { user }, error } =
      await supabaseClient.auth.getUser();

    if (error) {
      console.error("Auth error:", error);
      return;
    }

    // Get references to UI elements (may not exist on all pages)
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const welcomeUser = document.getElementById("welcomeUser");

    // Guard against missing elements
    if (!loginBtn || !logoutBtn || !welcomeUser) {
      return;
    }

    if (user) {
      /* ---------- LOGGED‑IN STATE ---------- */

      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";

      // Attempt to fetch customer profile
      const { data: customer, error: customerError } =
        await supabaseClient
          .from("tbl_customer")
          .select("firstname")
          .eq("auth_user_id", user.id)
          .maybeSingle();

      if (customerError) {
        console.warn("Customer lookup failed:", customerError);
        welcomeUser.textContent = "Welcome!";
        return;
      }

      // Show welcome message if available
      if (customer?.firstname) {
        welcomeUser.textContent =
          "Welcome, " + customer.firstname;
      } else {
        welcomeUser.textContent = "Welcome!";
      }

    } else {
      /* ---------- LOGGED‑OUT STATE ---------- */

      loginBtn.style.display = "inline-block";
      logoutBtn.style.display = "none";
      welcomeUser.textContent = "";
    }

  } catch (err) {
    // Catch unexpected runtime errors
    console.error("updateAuthUI failed:", err);
  }
}

/* =====================================================
   INITIALISE AUTH UI ON PAGE LOAD
===================================================== */
window.onload = updateAuthUI;