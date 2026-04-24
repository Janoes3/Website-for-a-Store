// Confirm that the producer dashboard JavaScript file has loaded
console.log("producer_dashboard.js loaded");

// Will store the logged-in producer's profile data
let producer = null;

/* =====================================================
   INIT PRODUCER (AUTH + PROFILE)
   - Ensures the user is logged in
   - Confirms the user is a producer
   - Loads producer profile details
===================================================== */
async function initProducer() {

  // Retrieve the currently authenticated Supabase user
  const { data: { user } } =
    await window.supabaseClient.auth.getUser();

  // If no user is logged in, redirect to producer login page
  if (!user) {
    alert("Please log in as a producer.");
    window.location.href = "producer_login.html";
    return;
  }

  // Retrieve the producer profile linked to the auth user ID
  const { data, error } =
    await window.supabaseClient
      .from("tbl_producer")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

  // If no producer profile exists, block access
  if (error || !data) {
    alert("Producer profile not found.");
    window.location.href = "index.html";
    return;
  }

  // Store producer data globally
  producer = data;

  // Display a welcome message using producer name
  document.getElementById("producerWelcome").innerText =
    "Welcome, " + producer.producername;
}

/* =====================================================
   UPDATE STOCK (GLOBAL)
   Triggered by: onclick="updateStock(productID)"
===================================================== */
window.updateStock = async function updateStock(productID) {

  // Retrieve the stock input for the given product
  const input =
    document.getElementById("stock_" + productID);

  // Parse the entered value as an integer
  const value =
    parseInt(input.value, 10);

  // Validate the input
  if (isNaN(value) || value < 0) {
    alert("Please enter a valid stock number.");
    return;
  }

  // Check if a stock record already exists for this product
  const { data: stock } =
    await window.supabaseClient
      .from("tbl_stock")
      .select("*")
      .eq("productid", productID)
      .maybeSingle();

  // Insert new stock record if none exists
  if (!stock) {
    await window.supabaseClient
      .from("tbl_stock")
      .insert({
        productid: productID,
        stockquantity: value
      });
  } 
  // Otherwise update existing stock quantity
  else {
    await window.supabaseClient
      .from("tbl_stock")
      .update({ stockquantity: value })
      .eq("productid", productID);
  }

  // Confirm successful update
  alert("Stock updated successfully.");
};

/* =====================================================
   LOAD PRODUCER PRODUCTS
   - Loads all products belonging to this producer
   - Displays product image, name, and stock controls
===================================================== */
async function loadProducerProducts() {

  const container =
    document.getElementById("producerProducts");

  // Retrieve all products for the producer
  const { data: products } =
    await window.supabaseClient
      .from("tbl_product")
      .select("*")
      .eq("producerid", producer.producerid);

  // Handle case where producer has no products
  if (!products || products.length === 0) {
    container.innerHTML =
      "<p>You have no products listed.</p>";
    return;
  }

  let html = "";

  // Process each product
  for (const p of products) {

    // Retrieve stock level for each product
    const { data: stock } =
      await window.supabaseClient
        .from("tbl_stock")
        .select("stockquantity")
        .eq("productid", p.productid)
        .maybeSingle();

    // Default stock quantity to 0 if missing
    const qty =
      stock ? stock.stockquantity : 0;

    // Build product card HTML
    html += `
      <div class="product-item">
        <img src="${p.productimage}" alt="${p.product_name}">
        <strong>${p.product_name}</strong><br>
        <p>Current Stock: <b>${qty}</b></p>
        <input type="number" id="stock_${p.productid}" value="${qty}">
        <button onclick="updateStock(${p.productid})">Save</button>
      </div>
    `;
  }

  // Render all products to the page
  container.innerHTML = html;
}

/* =====================================================
   LOAD PRODUCER ORDERS (WITH CUSTOMER INFO)
   - Loads orders that include this producer's products
   - Displays customer reference for fulfilment
===================================================== */
async function loadProducerOrders() {

  const container =
    document.getElementById("producerOrders");

  // Clear previous content
  container.innerHTML = "";

  /* ---------- 1. LOAD ALL ORDER ITEMS ---------- */
  const { data: orderItems, error } =
    await window.supabaseClient
      .from("tbl_orderitem")
      .select("orderid, productid, orderitemquantity");

  // Handle no orders
  if (error || !orderItems || orderItems.length === 0) {
    container.textContent = "No orders yet.";
    return;
  }

  const producerOrders = [];

  /* ---------- 2. FILTER ORDERS FOR THIS PRODUCER ---------- */
  for (const item of orderItems) {

    // Load product for ownership verification
    const { data: product } =
      await window.supabaseClient
        .from("tbl_product")
        .select("product_name, producerid")
        .eq("productid", item.productid)
        .single();

    // Skip products that do not belong to this producer
    if (!product || product.producerid !== producer.producerid)
      continue;

    // Load the order linked to this item
    const { data: order } =
      await window.supabaseClient
        .from("tbl_order")
        .select("orderid, orderdate, orderstatus, customerid")
        .eq("orderid", item.orderid)
        .single();

    if (!order) continue;

    // Load minimal customer info (privacy‑aware)
    const { data: customer } =
      await window.supabaseClient
        .from("tbl_customer")
        .select("firstname, customer_id")
        .eq("customer_id", order.customerid)
        .single();

    // Store order information
    producerOrders.push({
      orderid: order.orderid,
      product: product.product_name,
      quantity: item.orderitemquantity,
      status: order.orderstatus,
      date: order.orderdate,
      customerName: customer?.firstname || "Customer",
      customerRef: customer?.customer_id || "N/A"
    });
  }

  // Handle case where no producer‑relevant orders exist
  if (producerOrders.length === 0) {
    container.textContent = "No orders yet.";
    return;
  }

  /* ---------- 3. RENDER ORDERS ---------- */
  container.innerHTML =
    producerOrders.map(o => `
      <div class="order-item">
        <strong>Order #${o.orderid}</strong><br>
        Customer: <strong>${o.customerName}</strong>
        <span style="color:#666;">(Ref: #${o.customerRef})</span><br>
        Product: ${o.product}<br>
        Quantity: ${o.quantity}<br>
        Status: ${o.status}<br>
        Date: ${new Date(o.date).toLocaleString()}
      </div>
    `).join("");
}

/* =====================================================
   INITIALISE DASHBOARD
===================================================== */
(async function init() {
  await initProducer();
  await loadProducerProducts();
  await loadProducerOrders();
})();