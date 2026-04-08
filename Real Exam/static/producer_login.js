console.log("producer_login.js loaded");

// Create Supabase client
const supabaseClient = supabase.createClient(
    "https://meafqlorjwyxnpfiqvck.supabase.co",
    "sb_publishable_6qa6v8B1c51rNZbxY7wj6A_78MbwqED"
);

// PRODUCER LOGIN FUNCTION
async function producerLogin() {
    const email = document.getElementById("producerEmail").value.trim();
    const password = document.getElementById("producerPassword").value.trim();
    const msg = document.getElementById("producerLoginMessage");

    if (!email || !password) {
        msg.textContent = "Please enter all fields.";
        msg.style.color = "red";
        return;
    }

    const hashed = btoa(password);

    // Query tbl_producer (all lowercase column names)
    const { data, error } = await supabaseClient
        .from("tbl_producer")
        .select("*")
        .eq("contactemail", email)
        .eq("passwordhash", hashed)
        .single();

    if (error || !data) {
        msg.textContent = "Invalid login details.";
        msg.style.color = "red";
        console.error(error);
        return;
    }

    // Save producer session
    localStorage.setItem("producer", JSON.stringify({
        producerid: data.producerid,
        producername: data.producername,
        contactemail: data.contactemail
    }));

    msg.textContent = "Login successful!";
    msg.style.color = "green";

    setTimeout(() => {
        window.location.href = "producer_dashboard.html";
    }, 600);
}