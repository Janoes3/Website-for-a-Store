console.log("logout.js loaded");

function logout() {
    localStorage.removeItem("customer");
    localStorage.removeItem("producer");
    window.location.href = "index.html";
}

