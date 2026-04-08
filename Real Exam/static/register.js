console.log("Register.js loaded");

// Create Supabase client
const supabaseClient = supabase.createClient(
    "https://meafqlorjwyxnpfiqvck.supabase.co",
    "sb_publishable_6qa6v8B1c51rNZbxY7wj6A_78MbwqED"
);

// REGISTER FUNCTION
async function registerCustomer() {
    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const email = document.getElementById("email").value.trim();
    const address = document.getElementById("address").value.trim();
    const postcode = document.getElementById("postcode").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    const msg = document.getElementById("registerMessage");

    // Basic validation
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

    // Hash password (prototype-friendly)
    const hashed = btoa(password);

    // Insert into Supabase
    const { data, error } = await supabaseClient
        .from("tbl_customer")
        .insert([{
            firstname: firstName,
            lastname: lastName,
            email: email,
            address: address,
            postcode: postcode,
            passwordhash: hashed,
            loyaltypoints: 0
        }])
        .select()
        .single();

    if (error) {
        msg.textContent = "Registration failed: " + error.message;
        msg.style.color = "red";
        console.error(error);
        return;
    }

    msg.textContent = "Account created successfully!";
    msg.style.color = "green";

    console.log("Registration success:", data);

    // Redirect to homepage (popup login will appear)
    setTimeout(() => {
        window.location.href = "index.html";
    }, 1000);
}