console.log("producer_dashboard.js loaded");

// Supabase client
const supabaseClient = supabase.createClient(
    "https://meafqlorjwyxnpfiqvck.supabase.co",
    "sb_publishable_6qa6v8B1c51rNZbxY7wj6A_78MbwqED"
);

// Load producer session
window.producer = JSON.parse(localStorage.getItem("producer"));

if (!window.producer || !window.producer.producerid) {
    alert("Please log in as a producer.");
    window.location.href = "producer_login.html";
}

// Display welcome message
document.getElementById("producerWelcome").innerText =
    "Welcome, " + window.producer.producername;


// -----------------------------------------------------
// 1. LOAD PRODUCER PRODUCTS
// -----------------------------------------------------
async function loadProducerProducts() {
    const container = document.getElementById("producerProducts");

    const { data: products, error } = await supabaseClient
        .from("tbl_product")
        .select("*")
        .eq("producerid", window.producer.producerid);

    if (error) {
        container.innerHTML = "<p>Error loading products.</p>";
        console.error(error);
        return;
    }

    if (!products || products.length === 0) {
        container.innerHTML = "<p>You have no products listed.</p>";
        return;
    }

    let html = "";

    for (const p of products) {
        // Load stock for each product
        const { data: stock } = await supabaseClient
            .from("tbl_stock")
            .select("stockquantity")
            .eq("productid", p.productid)
            .eq("producerid", window.producer.producerid)
            .maybeSingle();

        const currentStock = stock ? stock.stockquantity : 0;

        html += `
            <div class="product-item">
                <strong>${p.product_name}</strong><br>
                static/images/${p.productimage}<br><br>

                <p>Current Stock: <b>${currentStock}</b></p>

                <label>Update Stock:</label><br>
                <input type="number" id="stock_${p.productid}" value="${currentStock}" min="0">
                <button class="update-stock-btn" onclick="updateStock(${p.productid})">
                    Save
                </button>
            </div>
        `;
    }

    container.innerHTML = html;
}


// -----------------------------------------------------
// 2. UPDATE STOCK & RECORD STOCK MOVEMENT
// -----------------------------------------------------
async function updateStock(productID) {
    const stockInput = document.getElementById("stock_" + productID);
    const newStockValue = parseInt(stockInput.value);

    if (isNaN(newStockValue) || newStockValue < 0) {
        alert("Invalid stock number");
        return;
    }

    // Get old stock value
    const { data: oldStockData } = await supabaseClient
        .from("tbl_stock")
        .select("*")
        .eq("productid", productID)
        .eq("producerid", window.producer.producerid)
        .maybeSingle();

    let oldStock = 0;
    if (oldStockData) oldStock = oldStockData.stockquantity;

    // If row does not exist → create stock row
    if (!oldStockData) {
        await supabaseClient
            .from("tbl_stock")
            .insert([{ 
                productid: productID, 
                producerid: window.producer.producerid, 
                stockquantity: newStockValue 
            }]);
    } 
    else {
        // Otherwise update existing stock
        await supabaseClient
            .from("tbl_stock")
            .update({ stockquantity: newStockValue })
            .eq("productid", productID)
            .eq("producerid", window.producer.producerid);
    }

    // Record stock movement
    const movementType = newStockValue > oldStock ? "IN" : "OUT";
    const movementQuantity = Math.abs(newStockValue - oldStock);

    await supabaseClient
        .from("tbl_stockmovement")
        .insert([{
            producerid: window.producer.producerid,
            productid: productID,
            movementtype: movementType,
            quantity: movementQuantity,
            movementreason: "Manual stock update",
            newstocklevel: newStockValue,
            performedby: window.producer.producername
        }]);

    alert("Stock updated!");
    loadProducerProducts(); // Refresh UI
}


// -----------------------------------------------------
// 3. LOAD PRODUCER ORDERS
// -----------------------------------------------------
async function loadProducerOrders() {
    const container = document.getElementById("producerOrders");

    const { data: items, error } = await supabaseClient
        .from("tbl_orderitem")
        .select(`
            orderitemid,
            orderitemquantity,
            tbl_order(orderid, orderdate, orderstatus),
            tbl_product(productid, product_name, producerid)
        `);

    if (error) {
        container.innerHTML = "<p>Error loading orders.</p>";
        console.error(error);
        return;
    }

    let html = "";

    items
        .filter(i => i.tbl_product.producerid === window.producer.producerid)
        .forEach(i => {
            html += `
                <div class="order-item">
                    <strong>Order #${i.tbl_order.orderid}</strong><br>
                    Product: ${i.tbl_product.product_name}<br>
                    Quantity: ${i.orderitemquantity}<br>
                    Status: ${i.tbl_order.orderstatus}<br>
                    Date: ${i.tbl_order.orderdate}<br>
                </div>
            `;
        });

    if (html === "") html = "<p>No orders yet.</p>";

    container.innerHTML = html;
}


// LOAD EVERYTHING
loadProducerProducts();
loadProducerOrders();