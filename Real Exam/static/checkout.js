// Confirm checkout JavaScript has loaded correctly
console.log("checkout.js loaded");

// Reference the global Supabase client
const supabaseClient = window.supabaseClient;

// Will store the logged-in customer profile
let customer = null;

// Will store the current cart ID
let cartID = null;

/* =====================================================
   MESSAGE HELPER
   Displays user feedback consistently on the page
===================================================== */
function showMessage(element, text, type = "error") {
  // Safety check in case the element is missing
  if (!element) return;

  // Set message content
  element.textContent = text;

  // Use colour to indicate success or error
  element.style.color = type === "success" ? "green" : "red";
}

/* =====================================================
   AUTHENTICATION
   - Ensures user is logged in
   - Loads associated customer profile
===================================================== */
async function initCustomer() {
  // Retrieve current authenticated user
  const { data: { user }, error } =
    await supabaseClient.auth.getUser();

  // Redirect to home if not logged in
  if (error || !user) {
    window.location.href = "index.html";
    return;
  }

  // Retrieve customer profile linked to auth user
  const { data } =
    await supabaseClient
      .from("tbl_customer")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

  // Store customer data globally
  customer = data;
}

/* =====================================================
   STOCK DEDUCTION
   Reduces stock levels after an order is placed
===================================================== */
async function deductStock(productID, quantityOrdered) {
  // Get current stock level for the product
  const { data: stock } =
    await supabaseClient
      .from("tbl_stock")
      .select("stockquantity")
      .eq("productid", productID)
      .single();

  // Exit if no stock record exists
  if (!stock) return;

  // Calculate new stock quantity
  const newQty =
    stock.stockquantity - quantityOrdered;

  // Update stock (prevent negative values)
  await supabaseClient
    .from("tbl_stock")
    .update({
      stockquantity: Math.max(newQty, 0)
    })
    .eq("productid", productID);
}

/* =====================================================
   LOAD CHECKOUT ITEMS
   Displays cart summary for checkout
===================================================== */
async function loadCheckoutItems() {
  const container =
    document.getElementById("checkout-cart-items");
  const message =
    document.getElementById("checkoutMessage");

  // Clear previous content
  container.innerHTML = "";
  showMessage(message, "");

  // Retrieve user's cart
  const { data: cart } =
    await supabaseClient
      .from("tbl_cart")
      .select("cartid")
      .eq("customerid", customer.customer_id)
      .maybeSingle();

  // Handle empty cart
  if (!cart) {
    showMessage(message, "Your cart is empty.");
    container.textContent = "Your cart is empty.";
    return;
  }

  // Store cart ID
  cartID = cart.cartid;

  // Retrieve cart items and product details
  const { data: items } =
    await supabaseClient
      .from("tbl_cartitem")
      .select(`
        quantity,
        tbl_product(product_name, productimage)
      `)
      .eq("cartid", cartID);

  // Handle no items
  if (!items || items.length === 0) {
    showMessage(message, "Your cart is empty.");
    container.textContent = "Your cart is empty.";
    return;
  }

  // Render cart items on the page
  items.forEach(item => {
    const row = document.createElement("div");
    row.className = "checkout-item";

    const img = document.createElement("img");
    img.src = item.tbl_product.productimage;
    img.className = "checkout-image";

    const text = document.createElement("div");
    text.textContent =
      `${item.tbl_product.product_name} – Quantity: ${item.quantity}`;

    row.appendChild(img);
    row.appendChild(text);
    container.appendChild(row);
  });
}

/* =====================================================
   PLACE ORDER
   - Creates order
   - Inserts order items
   - Deducts stock
   - Clears cart
===================================================== */
async function placeOrder() {
  console.log("placeOrder() called");

  const message =
    document.getElementById("checkoutMessage");
  showMessage(message, "");

  // Prevent order placement if cart is invalid
  if (!cartID) {
    showMessage(
      message,
      "Your cart is empty. Cannot place order."
    );
    return;
  }

  /* ---------- 1. CREATE ORDER ---------- */
  const { data: order, error } =
    await supabaseClient
      .from("tbl_order")
      .insert({
        customerid: customer.customer_id,
        orderdate: new Date(),
        orderstatus: "Placed"
      })
      .select()
      .single();

  if (error) {
    showMessage(
      message,
      "Failed to place order. Please try again."
    );
    return;
  }

  /* ---------- 2. LOAD CART ITEMS ---------- */
  const { data: cartItems } =
    await supabaseClient
      .from("tbl_cartitem")
      .select("*")
      .eq("cartid", cartID);

  if (!cartItems || cartItems.length === 0) {
    showMessage(
      message,
      "Your cart is empty. Cannot place order."
    );
    return;
  }

  /* ---------- 3. INSERT ORDER ITEMS & DEDUCT STOCK ---------- */
  for (const item of cartItems) {
    await supabaseClient
      .from("tbl_orderitem")
      .insert({
        orderid: order.orderid,
        productid: item.productid,
        orderitemquantity: item.quantity
      });

    // Reduce stock accordingly
    await deductStock(item.productid, item.quantity);
  }

  /* ---------- 4. CLEAR CART ---------- */
  await supabaseClient
    .from("tbl_cartitem")
    .delete()
    .eq("cartid", cartID);

  // Provide success feedback
  showMessage(
    message,
    "Order placed successfully!",
    "success"
  );

  /* ---------- 5. REDIRECT TO CONFIRMATION PAGE ---------- */
  setTimeout(() => {
    window.location.href =
      "order_confirmation.html?orderid=" + order.orderid;
  }, 800);
}

/* =====================================================
   INITIALISE PAGE
===================================================== */
(async function init() {
  // Ensure customer is authenticated
  await initCustomer();

  // Load checkout summary
  await loadCheckoutItems();

  // Attach place order handler
  document
    .getElementById("placeOrderBtn")
    .addEventListener("click", placeOrder);
})();
