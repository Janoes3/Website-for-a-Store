// Confirm that the producer details JavaScript file has loaded
console.log("producer_details.js loaded");

// Reuse the global Supabase client initialised elsewhere
const supabaseClient = window.supabaseClient;

/* =====================================================
   READ PRODUCER ID FROM URL
   - Extracts the producer identifier from the query string
===================================================== */
const params = new URLSearchParams(window.location.search);
const producerID = params.get("producerid");

// Guard clause: if no producer ID is provided in the URL
if (!producerID) {
  document.getElementById("producerName").innerText =
    "Producer not specified.";

  // Stop script execution to prevent invalid queries
  throw new Error("Missing producerid");
}

/* =====================================================
   INITIALISE PAGE
   - (Optional) Ensures user is logged in before viewing details
===================================================== */
(async function init() {

  // Retrieve the currently authenticated Supabase user
  const { data: { user } } =
    await supabaseClient.auth.getUser();

  // Redirect to home if the user is not logged in
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Load producer details once authentication is confirmed
  loadProducerDetails();
})();

/* =====================================================
   LOAD PRODUCER DETAILS
   - Retrieves producer profile information
   - Populates the UI with producer data
===================================================== */
async function loadProducerDetails() {

  // Fetch producer record from the database using producer ID
  const { data, error } =
    await supabaseClient
      .from("tbl_producer")
      .select("*")
      .eq("producerid", producerID)
      .maybeSingle();

  // Handle missing producer or database error
  if (error || !data) {
    document.getElementById("producerName").innerText =
      "Producer not found.";
    return;
  }

  // Display producer name
  document.getElementById("producerName").innerText =
    data.producername;

  // Display producer description (fallback if missing)
  document.getElementById("producerDescription").innerText =
    data.producerdescription || "No description available.";

  // Display farming methods (fallback if missing)
  document.getElementById("farmingMethods").innerText =
    data.farmingmethods || "Not specified.";

  // Display producer contact phone (fallback if missing)
  document.getElementById("producerPhone").innerText =
    data.contactphone || "Not available.";

  // Display producer contact email (fallback if missing)
  document.getElementById("producerEmail").innerText =
    data.contactemail || "Not available.";
}