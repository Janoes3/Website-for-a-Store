console.log("products.js loaded");

// Create Supabase client (same one used on homepage)
const supabaseClient = supabase.createClient(
    "https://meafqlorjwyxnpfiqvck.supabase.co",
    "sb_publishable_6qa6v8B1c51rNZbxY7wj6A_78MbwqED"
);

// Load customer session
window.customer = JSON.parse(localStorage.getItem("customer"));

// If user not logged in → send them back
if (!window.customer || !window.customer.customer_id) {
    alert("Please log in first.");
    window.location.href = "index.html";
}

let cartID = null;

// -----------------------------------------------------
// 1. Get or Create Cart for the user
// -----------------------------------------------------
async function getOrCreateCart() {
    if (cartID) return cartID;

    const { data: existingCart } = await supabaseClient
        .from("tbl_cart")
        .select("cartid")
        .eq("customerid", window.customer.customer_id)
        .maybeSingle();

    if (existingCart) {
        cartID = existingCart.cartid;
        return cartID;
    }

    // Create new cart
    const { data: newCart } = await supabaseClient
        .from("tbl_cart")
        .insert([{ customerid: window.customer.customer_id }])
        .select()
        .single();

    cartID = newCart.cartid;
    return cartID;
}

// -----------------------------------------------------
// 2. Add Product To Cart
// -----------------------------------------------------
async function addToCart(productID) {
    const cartID = await getOrCreateCart();

    const { data: existing } = await supabaseClient
        .from("tbl_cartitem")
        .select("*")
        .eq("cartid", cartID)
        .eq("productid", productID)
        .maybeSingle();

    if (existing) {
        // Increase quantity
        await supabaseClient
            .from("tbl_cartitem")
            .update({ quantity: existing.quantity + 1 })
            .eq("cartitemid", existing.cartitemid);
    } else {
        // Add new item
        await supabaseClient
            .from("tbl_cartitem")
            .insert([{ cartid: cartID, productid: productID, quantity: 1 }]);
    }

    loadCart();
    alert("Added to cart!");
}

// -----------------------------------------------------
// 3. Load Cart Items Under Page
// -----------------------------------------------------
async function loadCart() {
    const cartID = await getOrCreateCart();

    const { data: items } = await supabaseClient
        .from("tbl_cartitem")
        .select("cartitemid, quantity, tbl_product(productid, product_name, productimage)")
        .eq("cartid", cartID);

    const cartDiv = document.getElementById("cart-items");

    if (!items || items.length === 0) {
        cartDiv.innerHTML = "<p>Your cart is empty.</p>";
        return;
    }

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
// 4. Update Item Quantity
// -----------------------------------------------------
async function updateQty(cartItemID, newQty) {
    if (newQty <= 0) {
        deleteItem(cartItemID);
        return;
    }

    await supabaseClient
        .from("tbl_cartitem")
        .update({ quantity: newQty })
        .eq("cartitemid", cartItemID);

    loadCart();
}

// -----------------------------------------------------
// 5. Delete Item
// -----------------------------------------------------
async function deleteItem(cartItemID) {
    await supabaseClient
        .from("tbl_cartitem")
        .delete()
        .eq("cartitemid", cartItemID);

    loadCart();
}

// -----------------------------------------------------
// 6. Go To Checkout
// -----------------------------------------------------
function goToCheckout() {
    window.location.href = "checkout.html";
}

// Load cart on page start
loadCart();