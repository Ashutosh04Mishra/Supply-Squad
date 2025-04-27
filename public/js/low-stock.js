import { checkAuth, logout } from "./auth.js";

window.onload = () => {
    // Only proceed if authentication is successful
    if (checkAuth()) {
        displayLowStockProducts();
    }
};

const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
}

async function fetchLowStockProducts() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:3000/api/products/low-stock", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            throw new Error("Failed to fetch low stock products");
        }
        return await response.json();
    } catch (error) {
        setTimeout(() => {
            console.error("Error fetching low stock products:", error);
        }, 10000);
        console.error("Error fetching low stock products:", error);
        //window.location.href = "/html/index.html";
    }
}

async function displayLowStockProducts() {
    const products = await fetchLowStockProducts();
    const lowStockTable = document.getElementById("low-stock-table").getElementsByTagName("tbody")[0];
    
    // Clear existing rows
    lowStockTable.innerHTML = "";
    
    // Handle case when no products are found or API returns null/undefined
    if (!products || products.length === 0) {
        const row = lowStockTable.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 4; // Span across all columns
        cell.textContent = "No products are currently at or below reorder level";
        cell.style.textAlign = "center";
        return;
    }

    products.forEach((product) => {
        const row = lowStockTable.insertRow();
        
        // Add class based on stock level
        if (product.quantity < product.reorder_level) {
            row.classList.add("critical-stock"); // Red background for critical stock
        } else if (product.quantity === product.reorder_level) {
            row.classList.add("low-stock"); // Yellow background for low stock
        }
        
        const nameCell = row.insertCell();
        const categoryCell = row.insertCell();
        const quantityCell = row.insertCell();
        const reorderLevelCell = row.insertCell();

        // Add warning indicator for critical stock
        if (product.quantity < product.reorder_level) {
            nameCell.innerHTML = `${product.name} <span class="low-stock-indicator">⚠️ Critical</span>`;
        } else {
            nameCell.textContent = product.name;
        }
        
        categoryCell.textContent = product.category;
        quantityCell.textContent = product.quantity;
        reorderLevelCell.textContent = product.reorder_level;
    });
    
    console.log(`Displayed ${products.length} low stock products`);
}

// Initialization is now handled in window.onload