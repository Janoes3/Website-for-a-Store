// Confirms that the checkout script has loaded successfully.
// This helps with debugging during development.
console.log("checkout.js loaded");

// -----------------------------------------------------
// SUPABASE CONNECTION
// -----------------------------------------------------
// Creates a connection to the Supabase backend so the website
// can read and write order, cart, and stock data.
const supabaseClient = supabase.createClient(
    "https://meafqlorjwyxnpfiqvck.supabase.co",
    "sb_publishable_6qa6v8B1c51rNZbxY7wj6A_78MbwqED"
);

// -----------------------------------------------------
// CUSTOMER SESSION VALIDATION
// -----------------------------------------------------
// Retrieves the logged-in customer from localStorage.
// This ensures only authenticated users can access checkout.
window.customer = JSON.parse(localStorage.getItem("customer"));

// If no valid customer session exists, the user is redirected
// to the homepage to prevent unauthorised access.
if (!window.customer || !window.customer.customer_id) {
    alert("Please log in first.");
    window.location.href = "index.html";
}

// Stores the current cart ID so it can be reused throughout the page.
let cartID = null;

// -----------------------------------------------------
// 1. LOAD CART ITEMS FOR CHECKOUT
// -----------------------------------------------------
// This function retrieves the customer’s cart and displays
// the cart items and total price on the checkout page.
async function loadCheckoutCart() {

    // Finds the cart belonging to the logged-in customer.
    const { data: cart } = await supabaseClient
        .from("tbl_cart")
        .select("*")
        .eq("customerid", window.customer.customer_id)
        .maybeSingle();

    // If no cart exists, a message is shown.
    if (!cart) {
        document.getElementById("checkout-cart-items").innerHTML =
            "<p>Your cart is empty.</p>";
        document.getElementById("checkout-total").innerText = "";
        return;
    }

    // Stores the cart ID for later use.
    cartID = cart.cartid;

    // Retrieves all items in the cart, including product details.
    const { data: items } = await supabaseClient
        .from("tbl_cartitem")
        .select(`
            cartitemid,
            quantity,
            tbl_product (
                productid,
                product_name
            )
        `)
        .eq("cartid", cartID);

    // If the cart contains no items, display an empty message.
    if (!items || items.length === 0) {
        document.getElementById("checkout-cart-items").innerHTML =
            "<p>Your cart is empty.</p>";
        document.getElementById("checkout-total").innerText = "";
        return;
    }

    let html = "";
    let total = 0;

    // Calculates total cost and displays each item.
    items.forEach(item => {
        const price = 3; // Fixed prototype price
        const itemCost = item.quantity * price;
        total += itemCost;

        html += `
            <div class="checkout-item">
                <span>${item.tbl_product.product_name} x ${item.quantity}</span>
                <span>£${itemCost}</span>
            </div>
        `;
    });

    // Updates the checkout page with cart details and total cost.
    document.getElementById("checkout-cart-items").innerHTML = html;
    document.getElementById("checkout-total").innerText = "Total: £" + total;
}

// Loads cart contents when the checkout page opens.
loadCheckoutCart();

// -----------------------------------------------------
// 2. PLACE ORDER (CORE CHECKOUT LOGIC)
// -----------------------------------------------------
// Handles the entire order process including stock validation,
// order creation, stock updates, and cart clearing.
async function placeOrder() {
    const msg = document.getElementById("checkoutMessage");

    // Retrieves cart items again to ensure data is up-to-date.
    const { data: items } = await supabaseClient
        .from("tbl_cartitem")
        .select("*")
        .eq("cartid", cartID);

    // Prevents checkout if cart is empty.
    if (!items || items.length === 0) {
        msg.innerText = "Your cart is empty.";
        msg.style.color = "red";
        return;
    }

    // -------------------------------------------------
    // STOCK VALIDATION BEFORE ORDER CREATION
    // -------------------------------------------------
    // Checks that enough stock exists for each item.
    for (let item of items) {
        const { data: stock } = await supabaseClient
            .from("tbl_stock")
            .select("stockquantity")
            .eq("productid", item.productid)
            .maybeSingle();

        // Stops order if stock is insufficient.
        if (!stock || stock.stockquantity < item.quantity) {
            msg.innerText = `Not enough stock for Product ID ${item.productid}`;
            msg.style.color = "red";
            return;
        }
    }

    // -------------------------------------------------
    // CREATE ORDER RECORD
    // -------------------------------------------------
    // Creates a new order entry once stock is validated.
    const { data: order } = await supabaseClient
        .from("tbl_order")
        .insert([{
            customerid: window.customer.customer_id,
            producerid: items[0].productid, // Prototype logic
            locationid: 1,
            orderdate: new Date().toISOString().split("T")[0],
            orderstatus: "Pending"
        }])
        .select()
        .single();

    // -------------------------------------------------
    // CREATE ORDER ITEMS
    // -------------------------------------------------
    // Inserts each product from the cart into tbl_orderitem.
    for (const item of items) {
        await supabaseClient
            .from("tbl_orderitem")
            .insert([{
                orderid: order.orderid,
                productid: item.productid,
                orderitemquantity: item.quantity,
                orderproductcost: 3
            }]);
    }

    // -------------------------------------------------
    // UPDATE STOCK LEVELS
    // -------------------------------------------------
    // Reduces stock quantities after a successful order.
    for (const item of items) {
        const { data: stock } = await supabaseClient
            .from("tbl_stock")
            .select("stockquantity")
            .eq("productid", item.productid)
            .maybeSingle();

        const newLevel = stock.stockquantity - item.quantity;

        await supabaseClient
            .from("tbl_stock")
            .update({ stockquantity: newLevel })
            .eq("productid", item.productid);
    }

    // -------------------------------------------------
    // CLEAR CART AFTER ORDER
    // -------------------------------------------------
    // Deletes cart items and the cart itself after checkout.
    await supabaseClient.from("tbl_cartitem").delete().eq("cartid", cartID);
    await supabaseClient.from("tbl_cart").delete().eq("cartid", cartID);

    // Displays confirmation message with order number.
    msg.innerHTML = `Your order has been placed! <br> Order Number: #${order.orderid}`;
    msg.style.color = "green";

    // Loads the customer’s order history under the checkout.
    loadMyOrders();
}