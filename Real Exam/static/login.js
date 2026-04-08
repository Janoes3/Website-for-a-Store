console.log("login.js loaded");

// Create Supabase client
const supabaseClient = supabase.createClient(
    "https://meafqlorjwyxnpfiqvck.supabase.co",
    "sb_publishable_6qa6v8B1c51rNZbxY7wj6A_78MbwqED"
);

// LOGIN FUNCTION (used ONLY for login.html)
async function login() {
    console.log("Login button clicked");

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const msg = document.getElementById("loginMessage");

    if (!email || !password) {
        msg.textContent = "Please enter your email and password.";
        msg.style.color = "red";
        return;
    }

    const hashedPassword = btoa(password); // simple prototype hashing

    // Query tbl_customer using lowercase column names
    const { data, error } = await supabaseClient
        .from("tbl_customer")
        .select("*")
        .eq("email", email)
        .eq("passwordhash", hashedPassword)
        .single();

    if (error || !data) {
        msg.textContent = "Invalid email or password.";
        msg.style.color = "red";
        console.error("Login error:", error);
        return;
    }

    // Save customer session
    localStorage.setItem("customer", JSON.stringify({
        customer_id: data.customer_id,
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email
    }));

    msg.textContent = "Login successful!";
    msg.style.color = "green";

    console.log("Login success:", data);

    // Redirect to homepage (index.html)
    setTimeout(() => {
        window.location.href = "index.html";
    }, 800);
}