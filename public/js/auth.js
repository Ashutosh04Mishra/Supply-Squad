// Add event listener to ensure UI is updated when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const userRole = localStorage.getItem("userRole");
    if (userRole === 'Staff') {
        hideAdminElementsForStaff();
    }
});

// Add event listener for page navigation to ensure UI is updated
window.addEventListener('load', function() {
    const userRole = localStorage.getItem("userRole");
    if (userRole === 'Staff') {
        hideAdminElementsForStaff();
    }
});

// Add event listener for hash changes (SPA navigation)
window.addEventListener('hashchange', function() {
    const userRole = localStorage.getItem("userRole");
    if (userRole === 'Staff') {
        hideAdminElementsForStaff();
    }
});

export function checkAuth() {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");
    const authLinks = document.querySelector(".auth-links");
    const logoutBtn = document.getElementById("logout-btn");

    if (token) {
        // User is logged in
        if (authLinks) authLinks.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "block";
        
        // Verify user role is set
        if (!userRole) {
            console.warn("User is authenticated but role is not set");
        } else {
            console.log("User authenticated with role:", userRole);
            
            // Check if staff is trying to access admin-only pages
            if (userRole === 'Staff') {
                const currentPage = window.location.pathname;
                const pageName = currentPage.split('/').pop();
                
                // Pages that staff should not access
                const adminOnlyPages = ['add-product.html', 'sales-report.html', 'admin-profile.html'];
                
                if (adminOnlyPages.includes(pageName)) {
                    console.warn("Staff attempting to access admin-only page");
                    alert("You do not have permission to access this page.");
                    window.location.href = 'index.html';
                    return false;
                }
                
                // Always hide admin-only navigation links for staff users on ALL pages
                // This ensures the UI is consistent across all pages
                setTimeout(hideAdminElementsForStaff, 0); // Use setTimeout to ensure DOM is fully loaded
                // Also call it immediately
                hideAdminElementsForStaff();
            }
        }
        
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
        const protectedPages = ['index.html', 'add-product.html', 'sales.html', 'low-stock.html', 'sales-report.html', 'admin-profile.html', 'staff-profile.html'];
        
        if (protectedPages.includes(pageName)) {
            // Store the current page URL before redirecting
            localStorage.setItem('redirectUrl', window.location.href);
            window.location.href = 'login.html';
            return false;
        }
    }
    return true;
}

// Function to hide admin-only elements for staff users
function hideAdminElementsForStaff() {
    console.log('Hiding admin-only elements for staff user');
    
    // Find all instances of add-product-link and any links to add-product.html
    // This will catch all links across different pages
    const addProductLinks = document.querySelectorAll('a[href="add-product.html"], #add-product-link');
    addProductLinks.forEach(link => {
        // Hide the parent li element to completely remove from navigation
        if (link && link.parentElement) {
            link.parentElement.style.display = 'none';
            console.log('Hidden add product link:', link);
        }
    });
    
    // Hide sales report links for staff users
    const salesReportLinks = document.querySelectorAll('a[href="sales-report.html"]');
    salesReportLinks.forEach(link => {
        // Hide the parent li element to completely remove from navigation
        if (link && link.parentElement) {
            link.parentElement.style.display = 'none';
            console.log('Hidden sales report link:', link);
        }
    });
    
    // Find admin profile link and change text and href
    const adminProfileLinks = document.querySelectorAll('#admin-profile-link, a[href="admin-profile.html"]');
    adminProfileLinks.forEach(link => {
        link.textContent = 'Staff Profile';
        link.href = 'staff-profile.html';
        console.log('Changed admin profile link to staff profile:', link);
    });
    
    // Additional check for any other admin-only elements that might be added in the future
    const adminOnlyElements = document.querySelectorAll('.admin-only');
    adminOnlyElements.forEach(element => {
        element.style.display = 'none';
    });
}

export function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    window.location.href = "login.html";
}