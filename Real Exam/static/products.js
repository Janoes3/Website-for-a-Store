// Confirm that the products JavaScript file has loaded
console.log("products.js loaded");

// Reference the global Supabase client
const supabaseClient = window.supabaseClient;

// Will store the logged-in customer profile
let customer = null;

// Will store the current cart ID
let cartID = null;

/* =====================================================
   MESSAGE HELPER
   Displays feedback messages on the products page
===================================================== */
function showProductsMessage(text, type = "error") {
  const msg = document.getElementById("productsMessage");

  // Safety check if message element does not exist
  if (!msg) return;

  // Set message text and colour
  msg.textContent = text;
  msg.style.color = type === "success" ? "green" : "red";
}

/* =====================================================
   AUTHENTICATION
   - Ensures the user is logged in
   - Loads the customer profile
===================================================== */
async function initCustomer() {

  // Retrieve the currently authenticated Supabase user
  const { data: { user }, error } =
    await supabaseClient.auth.getUser();

  // Redirect to login/home if user is not authenticated
  if (!user || error) {
    window.location.href = "index.html";
    return;
  }

  // Retrieve customer profile linked to auth user ID
  const { data } =
    await supabaseClient
      .from("tbl_customer")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle();

  // Store customer data globally
  customer = data;
}

/* =====================================================
   NAVIGATION TO CHECKOUT (GLOBAL)
   Triggered by: onclick="goToCheckout()"
===================================================== */
window.goToCheckout = async function goToCheckout() {

  // Prevent checkout if no cart exists
  if (!cartID) {
    alert("Your cart is empty. Add items before proceeding to checkout.");
    return;
  }

  // Confirm cart contains items
  const { data: items } =
    await supabaseClient
      .from("tbl_cartitem")
      .select("cartitemid")
      .eq("cartid", cartID);

  if (!items || items.length === 0) {
    alert("Your cart is empty. Add items before proceeding to checkout.");
    return;
  }

  // Redirect to checkout page
  window.location.href = "checkout.html";
}

/* =====================================================
   STOCK CHECK
   - Returns available stock for a product
===================================================== */
async function getAvailableStock(productID) {

  // Retrieve stock quantity for the product
  const { data, error } =
    await supabaseClient
      .from("tbl_stock")
      .select("stockquantity")
      .eq("productid", productID)
      .maybeSingle();

  // Treat missing stock as unavailable
  if (error || !data) return 0;

  return data.stockquantity;
}

/* =====================================================
   LOAD PRODUCTS
   - Retrieves all products from the database
   - Displays product cards
===================================================== */
async function loadProducts() {
  const container =
    document.getElementById("productList");

  // Clear any previous messages
  showProductsMessage("");
  container.innerHTML = "";

  // Retrieve all products
  const { data: products, error } =
    await supabaseClient
      .from("tbl_product")
      .select("*");

  // Handle errors or missing products
  if (error || !products) {
    container.textContent = "Unable to load products.";
    showProductsMessage("Unable to load products.");
    return;
  }

  // Build product cards
  products.forEach(p => {

    const card = document.createElement("div");
    card.className = "product-card";

    // Product image
    const img = document.createElement("img");
    img.src = p.productimage;
    img.className = "product-image";

    // Product name
    const name = document.createElement("h3");
    name.textContent = p.product_name;

    // Link to producer details
    const producerLink = document.createElement("a");
    producerLink.textContent = "View Producer";
    producerLink.href =
      `producer_details.html?producerid=${p.producerid}`;
    producerLink.style.display = "block";
    producerLink.style.margin = "8px 0";
    producerLink.style.color = "#2f6f4e";
    producerLink.style.fontWeight = "600";

    // Add-to-cart button
    const btn = document.createElement("button");
    btn.textContent = "Add to Cart";
    btn.onclick =
      () => addToCart(p.productid);

    // Assemble card
    card.append(img, name, producerLink, btn);
    container.appendChild(card);
  });
}

/* =====================================================
   LOAD CART ITEMS
   - Displays current cart contents
===================================================== */
async function loadCartItems() {

  // Only customers can have carts
  if (!customer) return;

  const container =
    document.getElementById("cart-items");

  container.innerHTML = "";

  // Retrieve customer's cart
  const { data: cart } =
    await supabaseClient
      .from("tbl_cart")
      .select("cartid")
      .eq("customerid", customer.customer_id)
      .maybeSingle();

  // Handle missing cart
  if (!cart) {
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
        cartitemid,
        quantity,
        productid,
        tbl_product(product_name, productimage)
      `)
      .eq("cartid", cartID);

  // Handle empty cart
  if (!items || items.length === 0) {
    container.textContent = "Your cart is empty.";
    return;
  }

  // Render each cart item
  items.forEach(item => {

    const row = document.createElement("div");
    row.className = "cart-item";

    const img = document.createElement("img");
    img.src = item.tbl_product.productimage;
    img.className = "cart-image";

    const details = document.createElement("div");

    const name = document.createElement("strong");
    name.textContent = item.tbl_product.product_name;

    const controls = document.createElement("div");
    controls.className = "quantity-controls";

    // Decrease quantity
    const minus =
      document.createElement("button");
    minus.textContent = "−";
    minus.onclick =
      () => updateQuantity(item.cartitemid, -1);

    // Quantity display
    const qty = document.createElement("span");
    qty.textContent = item.quantity;

    // Increase quantity
    const plus =
      document.createElement("button");
    plus.textContent = "+";
    plus.onclick =
      () => updateQuantity(item.cartitemid, 1);

    controls.append(minus, qty, plus);
    details.append(name, controls);
    row.append(img, details);
    container.appendChild(row);
  });
}

/* =====================================================
   CART ACTIONS
   - Add items to cart
===================================================== */
async function addToCart(productID) {

  // Prevent action if no customer profile
  if (!customer) {
    showProductsMessage(
      "Please log in as a customer to add items."
    );
    return;
  }

  // Check available stock
  const availableStock =
    await getAvailableStock(productID);

  if (availableStock <= 0) {
    showProductsMessage("This product is out of stock.");
    return;
  }

  // Create cart if it does not exist
  if (!cartID) {
    const { data: newCart } =
      await supabaseClient
        .from("tbl_cart")
        .insert({
          customerid: customer.customer_id
        })
        .select()
        .single();

    cartID = newCart.cartid;
  }

  // Check if product already exists in cart
  const { data: item } =
    await supabaseClient
      .from("tbl_cartitem")
      .select("*")
      .eq("cartid", cartID)
      .eq("productid", productID)
      .maybeSingle();

  // Determine new quantity
  const newQty =
    item ? item.quantity + 1 : 1;

  // Prevent exceeding stock
  if (newQty > availableStock) {
    showProductsMessage(
      `Only ${availableStock} item(s) available in stock.`
    );
    return;
  }

  // Update or insert cart item
  if (item) {
    await supabaseClient
      .from("tbl_cartitem")
      .update({ quantity: newQty })
      .eq("cartitemid", item.cartitemid);
  } else {
    await supabaseClient
      .from("tbl_cartitem")
      .insert({
        cartid: cartID,
        productid: productID,
        quantity: 1
      });
  }

  // Success feedback and refresh cart
  showProductsMessage("Item added to cart.", "success");
  loadCartItems();
}

/* =====================================================
   UPDATE CART QUANTITY
===================================================== */
async function updateQuantity(cartItemID, change) {

  // Retrieve current quantity and product ID
  const { data } =
    await supabaseClient
      .from("tbl_cartitem")
      .select("quantity, productid")
      .eq("cartitemid", cartItemID)
      .single();

  // Check available stock
  const availableStock =
    await getAvailableStock(data.productid);

  const newQty =
    data.quantity + change;

  // Prevent exceeding stock
  if (newQty > availableStock) {
    showProductsMessage(
      `Only ${availableStock} item(s) available in stock.`
    );
    return;
  }

  // Remove item if quantity goes to zero
  if (newQty <= 0) {
    await supabaseClient
      .from("tbl_cartitem")
      .delete()
      .eq("cartitemid", cartItemID);
  } 
  // Otherwise update quantity
  else {
    await supabaseClient
      .from("tbl_cartitem")
      .update({ quantity: newQty })
      .eq("cartitemid", cartItemID);
  }

  // Refresh cart display
  loadCartItems();
}

/* =====================================================
   INITIALISE PAGE
===================================================== */
(async function init() {
  await initCustomer();
  await loadProducts();
  await loadCartItems();
})();
