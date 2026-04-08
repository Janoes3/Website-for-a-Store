console.log("logout.js loaded");

// UNIVERSAL LOGOUT FUNCTION
function logout() {
    // Remove customer session
    localStorage.removeItem("customer");

    // Remove producer session (if exists)
    localStorage.removeItem("producer");

    // Redirect to homepage (index.html)
    window.location.href = "index.html";
}


<button onclick="logout()">Logout</button>