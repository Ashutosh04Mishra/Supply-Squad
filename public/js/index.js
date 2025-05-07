import { checkAuth, logout } from "./auth.js";

// Add console logs for debugging
console.log("Index.js loaded");

// Check authentication when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded");
    // Only fetch products if authentication is successful
    if (checkAuth()) {
        fetchProducts();

        // Update UI based on user role
        const userRole = localStorage.getItem("userRole");
        console.log("User role on load:", userRole);

        // Make sure the UI reflects the correct permissions
        updateUIForUserRole(userRole);
    }
});

// Function to update UI elements based on user role
function updateUIForUserRole(userRole) {
    const addProductLink = document.getElementById('add-product-link');
    const adminProfileLink = document.getElementById('admin-profile-link');

    if (userRole === 'Staff') {
        // Staff can't add products, so hide this link
        if (addProductLink) addProductLink.parentElement.style.display = 'none';
        // Change admin profile link to staff profile
        if (adminProfileLink) {
            adminProfileLink.textContent = 'Staff Profile';
        }
    }
}

// Add logout button handler
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
}

// Fetch and display products
async function fetchProducts() {
    try {
        console.log("Fetching products...");
        const token = localStorage.getItem("token");
        const userRole = localStorage.getItem("userRole");
        console.log("Token:", token ? "Token exists" : "No token"); // Check if we have a token
        console.log("User role when fetching:", userRole);

        if (!token) {
            console.error("No authentication token found");
            // Redirect to login page
            localStorage.setItem('redirectUrl', window.location.href);
            window.location.href = "login.html";
            return;
        }

        const response = await fetch("http://localhost:3000/api/products", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
            // Handle different error cases
            if (response.status === 401 || response.status === 403) {
                console.error("Authentication or authorization error");
                // Clear token and redirect to login
                localStorage.removeItem("token");
                localStorage.setItem('redirectUrl', window.location.href);
                window.location.href = "login.html";
                return;
            }
            throw new Error(`Failed to fetch products: ${response.status}`);
        }

        const products = await response.json();
        console.log("Products received:", products.length);

        displayProducts(products);
        updateDashboardStats(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        // Show error in the product table
        const tableBody = document.querySelector("#product-table tbody");
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error loading products: ${error.message}</td></tr>`;
        }
    }
}

// Display products in the table
function displayProducts(products) {
    console.log("Displaying products...");
    const tableBody = document.querySelector("#product-table tbody");

    if (!tableBody) {
        console.error("Table body not found!");
        return;
    }

    tableBody.innerHTML = ""; // Clear existing rows

    // Get user role to determine what actions they can perform
    const userRole = localStorage.getItem("userRole");
    console.log("User role:", userRole);

    // If no products were received, show a message
    if (!products || products.length === 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.innerHTML = `<td colspan="5" style="text-align: center;">No products found</td>`;
        tableBody.appendChild(emptyRow);
        return;
    }

    products.forEach(product => {
        const row = document.createElement("tr");

        // Check if product is at or below reorder level
        const isLowStock = product.quantity <= product.reorder_level;

        // Add a class to highlight low stock products
        if (isLowStock) {
            row.classList.add("low-stock");
        }

        // Create action buttons based on user role
        let actionButtons = '';
        if (userRole === 'Admin') {
            actionButtons = `
                <button onclick="editProduct(${product.id})" class="edit-btn">Edit</button>
                <button onclick="deleteProduct(${product.id})" class="delete-btn">Delete</button>
            `;
        } else if (userRole === 'Staff') {
            // Staff can only view products and create sales, not edit or delete them
            actionButtons = `
                <button onclick="createSale(${product.id})" class="create-sale-btn">Create Sale</button>
                <span class="staff-note">View Only</span>
            `;
        } else {
            // Default case if role is not set properly
            actionButtons = `<span class="staff-note">View Only</span>`;
            console.warn("User role not properly set, defaulting to view-only mode");
        }

        row.innerHTML = `
            <td>${product.name}${isLowStock ? ' <span class="low-stock-indicator">⚠️ Low Stock</span>' : ''}</td>
            <td>${product.category}</td>
            <td>${product.quantity}${isLowStock ? ` / ${product.reorder_level}` : ''}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>${actionButtons}</td>
        `;
        tableBody.appendChild(row);
    });
}


// Update dashboard statistics
function updateDashboardStats(products) {
    const totalProducts = document.getElementById("total-products-count");
    const totalStock = document.getElementById("total-stock-quantity");
    const salesTodayElement = document.getElementById("sales-today");

    if (totalProducts) {
        totalProducts.textContent = products.length;
    }

    if (totalStock) {
        const stockSum = products.reduce((sum, product) => sum + product.quantity, 0);
        totalStock.textContent = stockSum;
    }

    // Count low stock products
    if (salesTodayElement) {
        const lowStockCount = products.filter(product => product.quantity <= product.reorder_level).length;
        salesTodayElement.textContent = lowStockCount;

        // Update the card title to reflect low stock count
        const cardTitle = salesTodayElement.previousElementSibling;
        if (cardTitle && cardTitle.tagName === 'H3') {
            cardTitle.textContent = 'Low Stock Items';
        }

        // Add visual indicator if there are low stock items
        if (lowStockCount > 0) {
            salesTodayElement.classList.add('low-stock-count');
        }
    }
}

// Make functions available globally for the onclick handlers
window.editProduct = function (productId) {
    // Check if user is admin before allowing edit
    const userRole = localStorage.getItem("userRole");
    if (userRole !== 'Admin') {
        alert("Only administrators can edit products.");
        return;
    }
    window.location.href = `edit-product.html?id=${productId}`;
};

window.deleteProduct = async function (productId) {
    // Check if user is admin before allowing delete
    const userRole = localStorage.getItem("userRole");
    if (userRole !== 'Admin') {
        alert("Only administrators can delete products.");
        return;
    }

    if (!confirm("Are you sure you want to delete this product?")) {
        return;
    }

    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:3000/api/products/${productId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete product');
        }

        fetchProducts(); // Refresh the list
    } catch (error) {
        console.error("Error deleting product:", error);
        alert("Failed to delete product");
    }
};

// Function for staff to create a sale
window.createSale = function (productId) {
    console.log("Creating sale for product ID:", productId);
    // Redirect to the sales page with the product ID as a parameter
    window.location.href = `sales.html?productId=${productId}`;
};