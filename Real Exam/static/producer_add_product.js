// Confirm that the producer add-product JavaScript file has loaded
console.log("producer_add_product.js loaded");

// Reference the global Supabase client
const supabaseClient = window.supabaseClient;

/* =====================================================
   ADD PRODUCT FUNCTION (GLOBAL)
   Triggered by: onclick="addProduct()"
===================================================== */
window.addProduct = async function addProduct() {

  // Retrieve form input values
  const name =
    document.getElementById("productName").value.trim();
  const file =
    document.getElementById("productImage").files[0];
  const msg =
    document.getElementById("addProductMessage");

  /* ---------- BASIC VALIDATION ---------- */

  // Ensure both product name and image are provided
  if (!name || !file) {
    msg.textContent =
      "Product name and image are required.";
    msg.style.color = "red";
    return;
  }

  /* ---------- AUTHENTICATION CHECK ---------- */

  // Retrieve the currently authenticated Supabase user
  const { data: { user } } =
    await supabaseClient.auth.getUser();

  // If user is not logged in, prevent access
  if (!user) {
    msg.textContent =
      "Please log in as a producer.";
    return;
  }

  /* ---------- RESOLVE PRODUCER PROFILE ---------- */

  // Find the producer record linked to the auth user
  const { data: producer, error } =
    await supabaseClient
      .from("tbl_producer")
      .select("producerid")
      .eq("auth_user_id", user.id)
      .single();

  // If producer profile does not exist, stop process
  if (error || !producer) {
    msg.textContent =
      "Producer profile not found.";
    return;
  }

  /* ---------- IMAGE UPLOAD ---------- */

  // Generate a unique, safe filename for storage
  const fileName =
    `${Date.now()}_${file.name.replaceAll(" ", "_")}`;

  // Upload image file to Supabase Storage bucket
  const { error: uploadError } =
    await supabaseClient.storage
      .from("product-images")
      .upload(
        `products/${fileName}`,
        file,
        { upsert: true }
      );

  // Handle upload failure
  if (uploadError) {
    msg.textContent =
      "Image upload failed.";
    return;
  }

  // Retrieve public URL for the uploaded image
  const { data: urlData } =
    supabaseClient.storage
      .from("product-images")
      .getPublicUrl(`products/${fileName}`);

  const imageUrl =
    urlData.publicUrl;

  /* ---------- INSERT PRODUCT RECORD ---------- */

  // Insert the new product into the database
  const { error: insertError } =
    await supabaseClient
      .from("tbl_product")
      .insert({
        product_name: name,
        productimage: imageUrl,
        producerid: producer.producerid
      });

  // Handle database insert failure
  if (insertError) {
    msg.textContent =
      "Failed to save product.";
    return;
  }

  /* ---------- SUCCESS FEEDBACK ---------- */

  // Inform the producer that the product was added
  msg.textContent =
    "Product added successfully!";
  msg.style.color = "green";

  // Redirect back to the producer dashboard
  setTimeout(() => {
    window.location.href =
      "producer_dashboard.html";
  }, 1500);
};