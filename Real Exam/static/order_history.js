console.log("order_history.js loaded");

const supabaseClient = window.supabaseClient;
let customer = null;

async function loadOrderHistory() {

  // ✅ Auth check
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // ✅ Load customer
  const { data, error } = await supabaseClient
    .from("tbl_customer")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (error || !data) {
    window.location.href = "index.html";
    return;
  }

  customer = data;

  // ✅ Load orders + items (FIXED COLUMN NAME)
  const { data: orders, error: orderError } = await supabaseClient
    .from("tbl_order")
    .select(`
      orderid,
      orderdate,
      orderstatus,
      tbl_orderitem (
        orderitemquantity,
        tbl_product(product_name)
      )
    `)
    .eq("customerid", customer.customer_id)
    .order("orderid", { ascending: false });

  const container = document.getElementById("orderHistory");
  container.innerHTML = "";

  if (orderError || !orders || orders.length === 0) {
    container.textContent = "No orders found.";
    return;
  }

  orders.forEach(order => {
    const box = document.createElement("div");
    box.className = "order-box";

    const header = document.createElement("h3");
    header.textContent = `Order #${order.orderid}`;

    const meta = document.createElement("p");
    meta.textContent =
      `Date: ${new Date(order.orderdate).toLocaleString()} | Status: ${order.orderstatus}`;

    box.appendChild(header);
    box.appendChild(meta);

    const list = document.createElement("ul");

    order.tbl_orderitem.forEach(item => {
      const li = document.createElement("li");
      li.textContent =
        `${item.tbl_product.product_name} × ${item.orderitemquantity}`;
      list.appendChild(li);
    });

    box.appendChild(list);
    container.appendChild(box);
  });
}

loadOrderHistory();