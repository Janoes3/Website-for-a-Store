// Confirms in the browser console that the file has loaded correctly
console.log("products.js loaded");

// -----------------------------------------------------
// SUPABASE CONNECTION
// -----------------------------------------------------
// Creates a connection between the website and the Supabase database.
// This allows the site to read and write data such as carts, cart items, and stock.
const supabaseClient = supabase.createClient(
    "https://meafqlorjwyxnpfiqvck.supabase.co",
    "sb_publishable_6qa6v8B1c51rNZbxY7wj6A_78MbwqED"
);

// -----------------------------------------------------
// CUSTOMER SESSION HANDLING
// -----------------------------------------------------
// Retrieves the currently logged-in customer from localStorage.
// This ensures cart functionality is only available to authenticated users.
window.customer = JSON.parse(localStorage.getItem("customer"));

// If no customer session exists, the user is redirected to the homepage.
// This prevents unauthorised access to shopping and checkout features.
if (!window.customer || !window.customer.customer_id) {
    alert("Please log in first.");
    window.location.href = "index.html";
}

// Stores the active cart ID in memory to avoid repeated database queries.
let cartID = null;

// -----------------------------------------------------
// 1. GET OR CREATE CART
// -----------------------------------------------------
// This function ensures each customer has exactly ONE cart.
async function getOrCreateCart() {

    // If a cart ID is already stored, reuse it.
    if (cartID) return cartID;

    // Attempts to retrieve an existing cart for the logged-in customer.
    const { data: existingCart } = await supabaseClient
        .from("tbl_cart")
        .select("cartid")
        .eq("customerid", window.customer.customer_id)
        .maybeSingle();

    // If a cart exists, store and return its ID.
    if (existingCart) {
        cartID = existingCart.cartid;
        return cartID;
    }

    // If no cart exists, create a new cart for the customer.
    const { data: newCart } = await supabaseClient
        .from("tbl_cart")
        .insert([{ customerid: window.customer.customer_id }])
        .select()
        .single();

    // Store and return the newly created cart ID.
    cartID = newCart.cartid;
    return cartID;
}

// -----------------------------------------------------
// 2. ADD PRODUCT TO CART
// -----------------------------------------------------
// Adds a selected product to the user's cart.
async function addToCart(productID) {

    // Ensure the customer has a cart.
    const cartID = await getOrCreateCart();

    // -------------------------------------------------
    // STOCK VALIDATION
    // -------------------------------------------------
    // Checks current stock levels before adding the product.
    const { data: stock } = await supabaseClient
        .from("tbl_stock")
        .select("stockquantity")
        .eq("productid", productID)
        .maybeSingle();

    // If stock is unavailable or zero, the product cannot be added.
    if (!stock || stock.stockquantity <= 0) {
        alert("This product is out of stock.");
        return;
    }

    // -------------------------------------------------
    // CHECK IF PRODUCT ALREADY EXISTS IN CART
    // -------------------------------------------------
    const { data: existing } = await supabaseClient
        .from("tbl_cartitem")
        .select("*")
        .eq("cartid", cartID)
        .eq("productid", productID)
        .maybeSingle();

    // If the product is already in the cart, increase its quantity.
    if (existing) {
        await supabaseClient
            .from("tbl_cartitem")
            .update({ quantity: existing.quantity + 1 })
            .eq("cartitemid", existing.cartitemid);
    } 
    // Otherwise, insert a new cart item.
    else {
        await supabaseClient
            .from("tbl_cartitem")
            .insert([{ cartid: cartID, productid: productID, quantity: 1 }]);
    }

    // Refresh the cart display and notify the user.
    loadCart();
    alert("Added to cart!");
}

// -----------------------------------------------------
// 3. LOAD CART ITEMS
// -----------------------------------------------------
// Loads all cart items and displays them on the page.
async function loadCart() {

    // Retrieve the user's cart.
    const cartID = await getOrCreateCart();

    // Fetch cart items and related product data.
    const { data: items } = await supabaseClient
        .from("tbl_cartitem")
        .select("cartitemid, quantity, tbl_product(productid, product_name, productimage)")
        .eq("cartid", cartID);

    const cartDiv = document.getElementById("cart-items");

    // If cart is empty, show a message.
    if (!items || items.length === 0) {
        cartDiv.innerHTML = "<p>Your cart is empty.</p>";
        return;
    }

    // Dynamically generate HTML for each cart item.
    let html = "";
    items.forEach(item => {
        html += `
            <div class="cart-item">
                static/images/${item.tbl_product.productimage}
                <span>${item.tbl_product.product_name}</span>

                <div class="cart-controls">
                    <button onclick="updateQty(${item.cartitemid}, ${item.quantity - 1})">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQty(${item.cartitemid}, ${item.quantity + 1})">+</button>
                </div>

                <button class="delete-btn" onclick="deleteItem(${item.cartitemid})">Remove</button>
            </div>
        `;
    });

    cartDiv.innerHTML = html;
}

// -----------------------------------------------------
// 4. UPDATE ITEM QUANTITY
// -----------------------------------------------------
// Updates the quantity of a cart item.
async function updateQty(cartItemID, newQty) {

    // If quantity is zero or less, remove the item.
    if (newQty <= 0) {
        deleteItem(cartItemID);
        return;
    }

    // Update the quantity in the database.
    await supabaseClient
        .from("tbl_cartitem")
        .update({ quantity: newQty })
        .eq("cartitemid", cartItemID);

    // Refresh cart display.
    loadCart();
}

// -----------------------------------------------------
// 5. DELETE ITEM FROM CART
// -----------------------------------------------------
// Removes an item from the cart.
async function deleteItem(cartItemID) {
    await supabaseClient
        .from("tbl_cartitem")
        .delete()
        .eq("cartitemid", cartItemID);

    loadCart();
}

// -----------------------------------------------------
// 6. NAVIGATION TO CHECKOUT
// -----------------------------------------------------
// Redirects the user to the checkout page.
function goToCheckout() {
    window.location.href = "checkout.html";
}

// -----------------------------------------------------
// INITIAL LOAD
// -----------------------------------------------------
// Automatically loads the cart when the page opens.
loadCart();