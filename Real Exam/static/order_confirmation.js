console.log("order_confirmation.js loaded");

function loadOrderConfirmation() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("orderid");

  const orderText = document.getElementById("orderIDText");

  if (!orderId) {
    orderText.textContent = "Order ID not found.";
    return;
  }

  orderText.textContent = "Your Order Number: #" + orderId;
}

loadOrderConfirmation();