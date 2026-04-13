// Confirms that the producer dashboard script has loaded successfully.
// This is useful for debugging and testing during development.
console.log("producer_dashboard.js loaded");

// -----------------------------------------------------
// SUPABASE CONNECTION
// -----------------------------------------------------
// Creates a connection to the Supabase backend.
// This allows the producer dashboard to retrieve and update
// products, stock, orders, and stock movement data.
const supabaseClient = supabase.createClient(
    "https://meafqlorjwyxnpfiqvck.supabase.co",
    "sb_publishable_6qa6v8B1c51rNZbxY7wj6A_78MbwqED"
);

// -----------------------------------------------------
// PRODUCER SESSION VALIDATION
// -----------------------------------------------------
// Retrieves the logged-in producer from localStorage.
// This ensures only authenticated producers can access the dashboard.
window.producer = JSON.parse(localStorage.getItem("producer"));

// If no valid producer session exists, redirect to producer login.
// This prevents customers or unauthorised users accessing producer data.
if (!window.producer || !window.producer.producerid) {
    alert("Please log in as a producer.");
    window.location.href = "producer_login.html";
}

// -----------------------------------------------------
// DISPLAY PRODUCER WELCOME MESSAGE
// -----------------------------------------------------
// Displays a personalised welcome message using the producer’s name.
// This confirms to the user that they are logged in correctly.
document.getElementById("producerWelcome").innerText =
    "Welcome, " + window.producer.producername;


// -----------------------------------------------------
// 1. LOAD PRODUCER PRODUCTS
// -----------------------------------------------------
// Loads all products belonging to the logged-in producer
// and displays them along with current stock levels.
async function loadProducerProducts() {
    const container = document.getElementById("producerProducts");

    // Retrieves products where the producer ID matches the logged-in producer.
    const { data: products, error } = await supabaseClient
        .from("tbl_product")
        .select("*")
        .eq("producerid", window.producer.producerid);

    // Displays an error message if the query fails.
    if (error) {
        container.innerHTML = "<p>Error loading products.</p>";
        console.error(error);
        return;
    }

    // Displays a message if the producer has no products.
    if (!products || products.length === 0) {
        container.innerHTML = "<p>You have no products listed.</p>";
        return;
    }

    let html = "";

    // Loops through each product to display details and stock controls.
    for (const p of products) {

        // Retrieves the current stock level for each product.
        const { data: stock } = await supabaseClient
            .from("tbl_stock")
            .select("stockquantity")
            .eq("productid", p.productid)
            .eq("producerid", window.producer.producerid)
            .maybeSingle();

        // Defaults stock to 0 if no stock record exists.
        const currentStock = stock ? stock.stockquantity : 0;

        // Generates HTML for each product, including a stock update input.
        html += `
            <div class="product-item">
                <strong>${p.product_name}</strong><br>
                <img src="static/images/${p.productimage}" alt="${p.product_name}"><br><br>

                <p>Current Stock: <b>${currentStock}</b></p>

                <label>Update Stock:</label><br>
                <input type="number" id="stock_${p.productid}" value="${currentStock}" min="0">
                <button class="update-stock-btn" onclick="updateStock(${p.productid})">
                    Save
                </button>
            </div>
        `;
    }

    // Displays all generated product HTML in the dashboard.
    container.innerHTML = html;
}


// -----------------------------------------------------
// 2. UPDATE STOCK & RECORD STOCK MOVEMENT
// -----------------------------------------------------
// Updates the stock level for a product and records the change
// in the stock movement table for traceability.
async function updateStock(productID) {

    // Retrieves the new stock value entered by the producer.
    const stockInput = document.getElementById("stock_" + productID);
    const newStockValue = parseInt(stockInput.value);

    // Validates the stock input to prevent invalid values.
    if (isNaN(newStockValue) || newStockValue < 0) {
        alert("Invalid stock number");
        return;
    }

    // Retrieves the existing stock record for the product.
    const { data: oldStockData } = await supabaseClient
        .from("tbl_stock")
        .select("*")
        .eq("productid", productID)
        .eq("producerid", window.producer.producerid)
        .maybeSingle();

    // Stores the previous stock level for comparison.
    let oldStock = 0;
    if (oldStockData) oldStock = oldStockData.stockquantity;

    // If no stock record exists, create one.
    if (!oldStockData) {
        await supabaseClient
            .from("tbl_stock")
            .insert([{ 
                productid: productID, 
                producerid: window.producer.producerid, 
                stockquantity: newStockValue 
            }]);
    } 
    // Otherwise, update the existing stock record.
    else {
        await supabaseClient
            .from("tbl_stock")
            .update({ stockquantity: newStockValue })
            .eq("productid", productID)
            .eq("producerid", window.producer.producerid);
    }

    // -------------------------------------------------
    // RECORD STOCK MOVEMENT (AUDIT TRAIL)
    // -------------------------------------------------
    // Determines whether stock was increased or decreased.
    const movementType = newStockValue > oldStock ? "IN" : "OUT";
    const movementQuantity = Math.abs(newStockValue - oldStock);

    // Inserts a stock movement record for traceability.
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

    // Confirms stock update and refreshes the dashboard.
    alert("Stock updated!");
    loadProducerProducts();
}


// -----------------------------------------------------
// 3. LOAD PRODUCER ORDERS
// -----------------------------------------------------
// Displays all orders that include products belonging to the producer.
async function loadProducerOrders() {
    const container = document.getElementById("producerOrders");

    // Retrieves order items with related order and product data.
    const { data: items, error } = await supabaseClient
        .from("tbl_orderitem")
        .select(`
            orderitemid,
            orderitemquantity,
            tbl_order(orderid, orderdate, orderstatus),
            tbl_product(productid, product_name, producerid)
        `);

    // Displays an error message if loading orders fails.
    if (error) {
        container.innerHTML = "<p>Error loading orders.</p>";
        console.error(error);
        return;
    }

    let html = "";

    // Filters orders so the producer only sees their own products.
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

    // Displays a message if there are no orders.
    if (html === "") html = "<p>No orders yet.</p>";

    container.innerHTML = html;
}


// -----------------------------------------------------
// INITIAL PAGE LOAD
// -----------------------------------------------------
// Loads all producer data when the dashboard opens.
loadProducerProducts();
loadProducerOrders();