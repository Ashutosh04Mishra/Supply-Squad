import { checkAuth, logout } from "./auth.js";

window.onload = async () => {
     checkAuth ();
};
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
}

const editProductForm = document.getElementById("edit-product-form");
const messageContainer = document.getElementById("edit-product-message");
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

async function fetchProduct(id) {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:3000/api/products/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (!productId) {
            console.error("No product ID found in the URL.");
            // Optionally, you can redirect or display a message to the user
            return;
        }
        if (!response.ok) {
            throw new Error("Product not found");
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching product:", error);
        //window.location.href = "products.html";
    }
}

async function initializeForm(id) {
    const product = await fetchProduct(id);
    // editProductForm.name.value = product.name;
    // editProductForm.category.value = product.category;
    // editProductForm.quantity.value = product.quantity;
    // editProductForm.price.value = product.price;
    // editProductForm.reorder_level.value = product.reorder_level;
    if (product) {
        editProductForm.name.value = product.name;
        editProductForm.category.value = product.category;
        editProductForm.quantity.value = product.quantity;
        editProductForm.price.value = product.price;
        editProductForm.reorder_level.value = product.reorder_level;
    } else {
        messageContainer.textContent = "Product could not be loaded.";
        messageContainer.className = "error-message";
    }
}

editProductForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = editProductForm.name.value;
    const category = editProductForm.category.value;
    const quantity = parseInt(editProductForm.quantity.value);
    const price = parseFloat(editProductForm.price.value);
     const reorder_level = parseInt(editProductForm.reorder_level.value);

    if (!name || !category || isNaN(quantity) || isNaN(price) || isNaN(reorder_level)) {
        messageContainer.textContent = "Please fill in all fields with valid values.";
        messageContainer.className = "error-message";
        return;
    }

    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:3000/api/products/${productId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name, quantity, price, category, reorder_level }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to update product");
        }

        messageContainer.textContent = "Product updated successfully!";
        messageContainer.className = "success-message";
        setTimeout(() => {
            window.location.href = "/html/index.html";
        }, 2000);
    } catch (error) {
        messageContainer.textContent = error.message || "An error occurred.";
        messageContainer.className = "error-message";
    }
});

initializeForm(productId);