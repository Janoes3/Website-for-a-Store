console.log("producer_details.js loaded");

// Create Supabase client
const supabaseClient = supabase.createClient(
    "https://meafqlorjwyxnpfiqvck.supabase.co",
    "sb_publishable_6qa6v8B1c51rNZbxY7wj6A_78MbwqED"
);

// Get producer ID from URL
const params = new URLSearchParams(window.location.search);
const producerID = params.get("producerid");

if (!producerID) {
    document.getElementById("producerName").innerText =
        "Producer not specified.";
}

// Load producer details
async function loadProducerDetails() {
    const { data, error } = await supabaseClient
        .from("tbl_producer")
        .select("*")
        .eq("producerid", producerID)
        .maybeSingle();

    if (error || !data) {
        document.getElementById("producerName").innerText =
            "Producer not found.";
        return;
    }

    document.getElementById("producerName").innerText = data.producername;
    document.getElementById("producerDescription").innerText =
        data.producerdescription || "No description available.";

    document.getElementById("farmingMethods").innerText =
        data.farmingmethods || "Not specified.";

    document.getElementById("producerPhone").innerText =
        data.contactphone || "Not available.";

    document.getElementById("producerEmail").innerText =
        data.contactemail || "Not available.";
}

// Run on page load
loadProducerDetails();