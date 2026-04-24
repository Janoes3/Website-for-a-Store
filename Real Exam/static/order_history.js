// Confirm that the order history JavaScript file has loaded correctly
console.log("order_history.js loaded");

// Reference the global Supabase client
const supabaseClient = window.supabaseClient;

// Will store the logged-in customer's profile data
let customer = null;

/* =====================================================
   AUTHENTICATION
   - Ensures the user is logged in
   - Loads the associated customer profile
===================================================== */
async function initCustomer() {
  // Retrieve the currently authenticated user
  const { data: { user } } =
    await supabaseClient.auth.getUser();

  // If no authenticated user exists, redirect to home/login
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Retrieve the customer profile linked to the auth user ID
  const { data } =
    await supabaseClient
      .from("tbl_customer")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle();

  // If no customer profile is found, show an error
  if (!data) {
    document.getElementById("orderHistory").textContent =
      "Customer profile not found.";
    throw new Error("Customer profile missing");
  }

  // Store customer data for later use
  customer = data;
}

/* =====================================================
   LOAD ORDER HISTORY
   - Loads all orders for the logged-in customer
   - Retrieves items and product details per order
===================================================== */
async function loadOrderHistory() {
  const container =
    document.getElementById("orderHistory");

  // Clear any previously rendered content
  container.innerHTML = "";

  try {
    /* ---------- 1. LOAD ORDERS ---------- */
    const { data: orders, error: orderError } =
      await supabaseClient
        .from("tbl_order")
        .select("orderid, orderdate, orderstatus")
        .eq("customerid", customer.customer_id)
        .order("orderdate", { ascending: false });

    // Handle no orders found or database error
    if (orderError || !orders || orders.length === 0) {
      container.textContent = "No orders found.";
      return;
    }

    // Will store rendered HTML blocks for all orders
    const renderedOrders = [];

    /* ---------- 2. PROCESS EACH ORDER ---------- */
    for (const order of orders) {

      // Retrieve order items for the current order
      const { data: orderItems } =
        await supabaseClient
          .from("tbl_orderitem")
          .select("productid, orderitemquantity")
          .eq("orderid", order.orderid);

      // Skip orders with no items (defensive check)
      if (!orderItems || orderItems.length === 0)
        continue;

      const itemLines = [];

      /* ---------- 3. LOAD PRODUCT DETAILS ---------- */
      for (const item of orderItems) {
        const { data: product } =
          await supabaseClient
            .from("tbl_product")
            .select("product_name")
            .eq("productid", item.productid)
            .single();

        // Skip missing products (defensive)
        if (!product) continue;

        // Build list entry for the product
        itemLines.push(
          `<li>${product.product_name} × ${item.orderitemquantity}</li>`
        );
      }

      // Skip orders with no renderable items
      if (itemLines.length === 0) continue;

      /* ---------- 4. BUILD ORDER HTML ---------- */
      renderedOrders.push(`
        <div class="order-box">
          <h3>Order #${order.orderid}</h3>
          <p>
            Date: ${new Date(order.orderdate).toLocaleString()}<br>
            Status: ${order.orderstatus}
          </p>
          <ul>
            ${itemLines.join("")}
          </ul>
        </div>
      `);
    }

    /* ---------- 5. RENDER TO PAGE ---------- */
    if (renderedOrders.length === 0) {
      container.textContent = "No orders found.";
    } else {
      container.innerHTML = renderedOrders.join("");
    }

  } catch (err) {
    // Handle unexpected errors gracefully
    console.error(err);
    container.textContent =
      "Error loading order history.";
  }
}

/* =====================================================
   INITIALISE PAGE
   - Authenticate user
   - Load order history
===================================================== */
(async function init() {
  await initCustomer();
  await loadOrderHistory();
})();