export function checkAuth() {
    const token = localStorage.getItem("token");
    const authLinks = document.querySelector(".auth-links");
    const logoutBtn = document.getElementById("logout-btn");

    if (token) {
        // User is logged in
        if (authLinks) authLinks.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "block";
        // User is authenticated, no need to redirect
        return true;
    } else {
        // User is not logged in
        if (authLinks) authLinks.style.display = "block";
        if (logoutBtn) logoutBtn.style.display = "none";
        
        // Redirect to login if trying to access protected pages
        const currentPage = window.location.pathname;
        // Get the filename from the path
        const pageName = currentPage.split('/').pop();
        
        // List of protected pages that require authentication
        const protectedPages = ['index.html', 'add-product.html', 'sales.html', 'low-stock.html', 'sales-report.html'];
        
        if (protectedPages.includes(pageName)) {
            // Store the current page URL before redirecting
            localStorage.setItem('redirectUrl', window.location.href);
            window.location.href = 'login.html';
            return false;
        }
    }
    return true;
}

export function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    window.location.href = "login.html";
}