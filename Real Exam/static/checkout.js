console.log("checkout.js loaded");

// Create Supabase client
const supabaseClient = supabase.createClient(
    "https://meafqlorjwyxnpfiqvck.supabase.co",
    "sb_publishable_6qa6v8B1c51rNZbxY7wj6A_78MbwqED"
);

// Load customer from session
window.customer = JSON.parse(localStorage.getItem("customer"));

if (!window.customer || !window.customer.customer_id) {
    alert("Please log in first.");
    window.location.href = "index.html";
}

let cartID = null;

// -----------------------------------------------------
// 1. LOAD CART ITEMS
// -----------------------------------------------------
async function loadCheckoutCart() {
    // Find user's cart
    const { data: cart } = await supabaseClient
        .from("tbl_cart")
        .select("*")
        .eq("customerid", window.customer.customer_id)
        .maybeSingle();

    if (!cart) {
        document.getElementById("checkout-cart-items").innerHTML =
            "<p>Your cart is empty.</p>";
        document.getElementById("checkout-total").innerText = "";
        return;
    }

    cartID = cart.cartid;

    // Load cart items
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

    if (!items || items.length === 0) {
        document.getElementById("checkout-cart-items").innerHTML =
            "<p>Your cart is empty.</p>";
        document.getElementById("checkout-total").innerText = "";
        return;
    }

    let html = "";
    let total = 0;

    items.forEach(item => {
        const price = 3; // Prototype fixed price
        const itemCost = item.quantity * price;
        total += itemCost;

        html += `
            <div class="checkout-item">
                <span>${item.tbl_product.product_name} x ${item.quantity}</span>
                <span>£${itemCost}</span>
            </div>
        `;
    });

    document.getElementById("checkout-cart-items").innerHTML = html;
    document.getElementById("checkout-total").innerText = "Total: £" + total;
}

loadCheckoutCart();


// -----------------------------------------------------
// 2. PLACE ORDER
// -----------------------------------------------------
async function placeOrder() {
    const msg = document.getElementById("checkoutMessage");

    // Get cart items again
    const { data: items } = await supabaseClient
        .from("tbl_cartitem")
        .select("*")
        .eq("cartid", cartID);

    if (!items || items.length === 0) {
        msg.innerText = "Your cart is empty.";
        msg.style.color = "red";
        return;
    }

    // Create Order
    const { data: order } = await supabaseClient
        .from("tbl_order")
        .insert([{
            customerid: window.customer.customer_id,
            producerid: items[0].productid,   // SIMPLE PROTOTYPE LOGIC
            locationid: 1,                    // Static location for now
            orderdate: new Date().toISOString().split("T")[0],
            orderstatus: "Pending"
        }])
        .select()
        .single();

    // Insert all products into tbl_orderitem
    for (const item of items) {
        await supabaseClient
            .from("tbl_orderitem")
            .insert([{
                orderid: order.orderid,
                productid: item.productid,
                orderitemquantity: item.quantity,
                orderproductcost: 3 // static prototype price
            }]);
    }

    // Clear the cart
    await supabaseClient.from("tbl_cartitem").delete().eq("cartid", cartID);
    await supabaseClient.from("tbl_cart").delete().eq("cartid", cartID);

    // Confirmation message directly under checkout
    msg.innerHTML = `Your order has been placed! <br> Order Number: #${order.orderid}`;
    msg.style.color = "green";

    // Load My Orders below confirmation
    loadMyOrders();
}


// -----------------------------------------------------
// 3. LOAD MY ORDERS UNDER CONFIRMATION
// -----------------------------------------------------
async function loadMyOrders() {
    const { data: orders } = await supabaseClient
        .from("tbl_order")
        .select("*")
        .eq("customerid", window.customer.customer_id)
        .order("orderid", { ascending: false });

    let html = "<h2>My Orders</h2>";

    orders.forEach(o => {
        html += `
            <p>
                Order #${o.orderid} — ${o.orderstatus}
                <br>
                Date: ${o.orderdate}
            </p>
        `;
    });

    document.getElementById("myOrders").innerHTML = html;
}