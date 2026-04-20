console.log("checkout.js loaded");

const supabaseClient = window.supabaseClient;

let customer = null;
let cartID = null;

// ---------------- AUTH ----------------
async function initCustomer() {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const { data } = await supabaseClient
    .from("tbl_customer")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  customer = data;
}

// ---------------- LOAD CART ----------------
async function loadCheckoutItems() {
  const container = document.getElementById("checkout-cart-items");
  container.innerHTML = "";

  const { data: cart } = await supabaseClient
    .from("tbl_cart")
    .select("cartid")
    .eq("customerid", customer.customer_id)
    .maybeSingle();

  if (!cart) {
    container.textContent = "Your cart is empty.";
    return;
  }

  cartID = cart.cartid;

  const { data: items } = await supabaseClient
    .from("tbl_cartitem")
    .select(`
      quantity,
      tbl_product(product_name, productimage)
    `)
    .eq("cartid", cartID);

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

// ---------------- PLACE ORDER ----------------
async function placeOrder() {
  console.log("placeOrder() called");

  const message = document.getElementById("checkoutMessage");
  message.textContent = "";

  // 1. Create order
  const { data: order, error } = await supabaseClient
    .from("tbl_order")
    .insert({
      customerid: customer.customer_id,
      orderdate: new Date(),
      orderstatus: "Placed"
    })
    .select()
    .single();

  if (error) {
    message.textContent = "Failed to place order.";
    return;
  }

  // 2. Get cart items
  const { data: cartItems } = await supabaseClient
    .from("tbl_cartitem")
    .select("*")
    .eq("cartid", cartID);

  // 3. Insert order items
  for (const item of cartItems) {
    await supabaseClient.from("tbl_orderitem").insert({
      orderid: order.orderid,
      productid: item.productid,
      quantity: item.quantity
    });
  }

  // 4. Clear cart
  await supabaseClient
    .from("tbl_cartitem")
    .delete()
    .eq("cartid", cartID);

  // 5. Redirect to confirmation
  window.location.href =
    "order_confirmation.html?orderid=" + order.orderid;
}

// ---------------- INIT ----------------
(async function init() {
  await initCustomer();
  await loadCheckoutItems();

  // ✅ THIS IS THE CRITICAL FIX
  document
    .getElementById("placeOrderBtn")
    .addEventListener("click", placeOrder);
})();