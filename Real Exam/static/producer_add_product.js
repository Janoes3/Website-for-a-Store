console.log("producer_add_product.js loaded");

const supabaseClient = window.supabaseClient;

async function addProduct() {
  const name = document.getElementById("productName").value.trim();
  const file = document.getElementById("productImage").files[0];
  const msg = document.getElementById("addProductMessage");

  if (!name || !file) {
    msg.textContent = "Product name and image are required.";
    msg.style.color = "red";
    return;
  }

  // ✅ Auth check
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    msg.textContent = "Please log in as a producer.";
    return;
  }

  // ✅ Resolve producer profile
  const { data: producer, error } = await supabaseClient
    .from("tbl_producer")
    .select("producerid")
    .eq("auth_user_id", user.id)
    .single();

  if (error || !producer) {
    msg.textContent = "Producer profile not found.";
    return;
  }

  // ✅ Upload image
  const fileName = `${Date.now()}_${file.name.replaceAll(" ", "_")}`;

  const { error: uploadError } = await supabaseClient.storage
    .from("product-images")
    .upload(`products/${fileName}`, file, { upsert: true });

  if (uploadError) {
    msg.textContent = "Image upload failed.";
    return;
  }

  const { data: urlData } = supabaseClient.storage
    .from("product-images")
    .getPublicUrl(`products/${fileName}`);

  const imageUrl = urlData.publicUrl;
  // ✅ Insert product (passes RLS)
  const { error: insertError } = await supabaseClient
    .from("tbl_product")
    .insert({
      product_name: name,
      productimage: imageUrl,
      producerid: producer.producerid
    });

  if (insertError) {
    msg.textContent = "Failed to save product.";
    return;
  }

  msg.textContent = "Product added successfully!";
  msg.style.color = "green";

  setTimeout(() => {
    window.location.href = "producer_dashboard.html";
  }, 1500);
}