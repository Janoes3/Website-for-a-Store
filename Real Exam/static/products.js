console.log("products.js loaded");

const supabaseClient = window.supabaseClient;

let customer = null;
let cartID = null;

/* ------------------ AUTH ------------------ */
async function initCustomer() {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // ✅ SAFE: customer may not exist (producer account)
  const { data } = await supabaseClient
    .from("tbl_customer")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  customer = data; // may be null – this is OK
}

/* ------------------ PRODUCTS ------------------ */
async function loadProducts() {
  const container = document.getElementById("productList");
  container.innerHTML = "";

  const { data: products } = await supabaseClient
    .from("tbl_product")
    .select("*");

  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    const img = document.createElement("img");
    img.src = p.productimage;
    img.className = "product-image";

    const name = document.createElement("h3");
    name.textContent = p.product_name;

    const btn = document.createElement("button");
    btn.textContent = "Add to Cart";

    // ✅ Only customers can add to cart
    btn.onclick = () => addToCart(p.productid);

    card.append(img, name, btn);
    container.appendChild(card);
  });
}

/* ------------------ CART ------------------ */
async function loadCartItems() {
  // ✅ Producers / non-customers skip cart logic
  if (!customer) return;

  const container = document.getElementById("cart-items");
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
      cartitemid,
      quantity,
      productid,
      tbl_product(product_name, productimage)
    `)
    .eq("cartid", cartID);

  if (!items || items.length === 0) {
    container.textContent = "Your cart is empty.";
    return;
  }

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

    const minus = document.createElement("button");
    minus.textContent = "−";
    minus.onclick = () => updateQuantity(item.cartitemid, -1);

    const qty = document.createElement("span");
    qty.textContent = item.quantity;

    const plus = document.createElement("button");
    plus.textContent = "+";
    plus.onclick = () => updateQuantity(item.cartitemid, 1);

    controls.append(minus, qty, plus);
    details.append(name, controls);
    row.append(img, details);
    container.appendChild(row);
  });
}

/* ------------------ CART ACTIONS ------------------ */
async function addToCart(productID) {
  // ✅ Guard: only customers can use cart
  if (!customer) {
    alert("Please log in as a customer to add items to the cart.");
    return;
  }

  if (!cartID) {
    const { data: newCart } = await supabaseClient
      .from("tbl_cart")
      .insert({ customerid: customer.customer_id })
      .select()
      .single();

    cartID = newCart.cartid;
  }

  const { data: item } = await supabaseClient
    .from("tbl_cartitem")
    .select("*")
    .eq("cartid", cartID)
    .eq("productid", productID)
    .maybeSingle();

  if (item) {
    await supabaseClient
      .from("tbl_cartitem")
      .update({ quantity: item.quantity + 1 })
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

  loadCartItems();
}

async function updateQuantity(cartItemID, change) {
  const { data } = await supabaseClient
    .from("tbl_cartitem")
    .select("quantity")
    .eq("cartitemid", cartItemID)
    .single();

  const newQty = data.quantity + change;

  if (newQty <= 0) {
    await supabaseClient
      .from("tbl_cartitem")
      .delete()
      .eq("cartitemid", cartItemID);
  } else {
    await supabaseClient
      .from("tbl_cartitem")
      .update({ quantity: newQty })
      .eq("cartitemid", cartItemID);
  }

  loadCartItems();
}

/* ------------------ INIT ------------------ */
(async function init() {
  await initCustomer();
  await loadProducts();
  await loadCartItems();
})();