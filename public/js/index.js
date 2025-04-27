import { checkAuth, logout } from "./auth.js";

// Add console logs for debugging
console.log("Index.js loaded");

// Check authentication when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded");
    // Only fetch products if authentication is successful
    if (checkAuth()) {
        fetchProducts();
    }
});

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
        console.log("Token:", token); // Check if we have a token

        const response = await fetch("http://localhost:3000/api/products", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        console.log("Response status:", response.status);
        
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }

        const products = await response.json();
        console.log("Products received:", products);
        
        displayProducts(products);
        updateDashboardStats(products);
    } catch (error) {
        console.error("Error fetching products:", error);
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

    products.forEach(product => {
        const row = document.createElement("tr");
        
        // Check if product is at or below reorder level
        const isLowStock = product.quantity <= product.reorder_level;
        
        // Add a class to highlight low stock products
        if (isLowStock) {
            row.classList.add("low-stock");
        }
        
        row.innerHTML = `
            <td>${product.name}${isLowStock ? ' <span class="low-stock-indicator">⚠️ Low Stock</span>' : ''}</td>
            <td>${product.category}</td>
            <td>${product.quantity}${isLowStock ? ` / ${product.reorder_level}` : ''}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>
                <button onclick="editProduct(${product.id})" class="edit-btn">Edit</button>
                <button onclick="deleteProduct(${product.id})" class="delete-btn">Delete</button>
            </td>
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
window.editProduct = function(productId) {
    window.location.href = `edit-product.html?id=${productId}`;
};

window.deleteProduct = async function(productId) {
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