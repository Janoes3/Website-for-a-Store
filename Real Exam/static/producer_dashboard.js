console.log("producer_dashboard.js loaded");

let producer = null;

// -----------------------------------------------------
// INIT PRODUCER (AUTH + PROFILE)
// -----------------------------------------------------
async function initProducer() {
  const { data: { user } } = await window.supabaseClient.auth.getUser();

  if (!user) {
    alert("Please log in as a producer.");
    window.location.href = "producer_login.html";
    return;
  }

  const { data, error } = await window.supabaseClient
    .from("tbl_producer")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (error || !data) {
    alert("Producer profile not found.");
    window.location.href = "index.html";
    return;
  }

  producer = data;

  document.getElementById("producerWelcome").innerText =
    "Welcome, " + producer.producername;
}

// -----------------------------------------------------
// LOAD PRODUCER PRODUCTS
// -----------------------------------------------------
async function loadProducerProducts() {
  const container = document.getElementById("producerProducts");

  const { data: products } = await window.supabaseClient
    .from("tbl_product")
    .select("*")
    .eq("producerid", producer.producerid);

  if (!products || products.length === 0) {
    container.innerHTML = "<p>You have no products listed.</p>";
    return;
  }

  let html = "";

  for (const p of products) {
    const { data: stock } = await window.supabaseClient
      .from("tbl_stock")
      .select("stockquantity")
      .eq("productid", p.productid)
      .maybeSingle();

    const qty = stock ? stock.stockquantity : 0;

    html += `
      <div class="product-item">
        <strong>${p.product_name}</strong><br>
        <img src="${p.productimage}" alt="${p.product_name}" width="120"><br><br>

        <p>Current Stock: <b>${qty}</b></p>
        <input type="number" id="stock_${p.productid}" value="${qty}" min="0">
        <button onclick="updateStock(${p.productid})">Save</button>
      </div>
    `;
  }

  container.innerHTML = html;
}

// -----------------------------------------------------
// UPDATE STOCK
// -----------------------------------------------------
async function updateStock(productID) {
  const value = parseInt(document.getElementById("stock_" + productID).value);

  if (isNaN(value) || value < 0) {
    alert("Invalid stock number");
    return;
  }

  const { data: stock } = await window.supabaseClient
    .from("tbl_stock")
    .select("*")
    .eq("productid", productID)
    .maybeSingle();

  if (!stock) {
    await window.supabaseClient.from("tbl_stock").insert({
      productid: productID,
      stockquantity: value
    });
  } else {
    await window.supabaseClient
      .from("tbl_stock")
      .update({ stockquantity: value })
      .eq("productid", productID);
  }

  alert("Stock updated!");
  loadProducerProducts();
}

// -----------------------------------------------------
// LOAD PRODUCER ORDERS
// -----------------------------------------------------
async function loadProducerOrders() {
  const container = document.getElementById("producerOrders");

  const { data: items, error } = await window.supabaseClient
    .from("tbl_orderitem")
    .select(`
      orderitemquantity,
      tbl_order (
        orderid,
        orderdate,
        orderstatus
      ),
      tbl_product (
        product_name,
        producerid
      )
    `);

  if (error || !items) {
    container.innerHTML = "<p>Error loading orders.</p>";
    return;
  }

  // ✅ Filter: only items for THIS producer
  const myItems = items.filter(
    item =>
      item.tbl_product &&
      item.tbl_product.producerid === producer.producerid
  );

  if (myItems.length === 0) {
    container.innerHTML = "<p>No orders yet.</p>";
    return;
  }

  container.innerHTML = myItems.map(item => `
    <div class="order-item">
      <strong>Order #${item.tbl_order.orderid}</strong><br>
      Product: ${item.tbl_product.product_name}<br>
      Quantity: ${item.orderitemquantity}<br>
      Status: ${item.tbl_order.orderstatus}<br>
      Date: ${new Date(item.tbl_order.orderdate).toLocaleString()}
    </div>
  `).join("");
}
// -----------------------------------------------------
// INIT PAGE
// -----------------------------------------------------
(async function init() {
  await initProducer();
  await loadProducerProducts();
  await loadProducerOrders();
})();