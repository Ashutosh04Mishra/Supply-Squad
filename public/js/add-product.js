import { checkAuth, logout } from "./auth.js";

// Check authentication when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Only proceed if authentication is successful
    if (checkAuth()) {
        const addProductForm = document.getElementById("add-product-form");
        const messageContainer = document.getElementById("add-product-message");

    addProductForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        try {
            // Check authentication
            const token = localStorage.getItem("token");
            if (!token) {
                messageContainer.textContent = "Please login first";
                messageContainer.style.color = "red";
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2000);
                return;
            }

            // Get form data
            const formData = {
                name: document.getElementById("name").value.trim(),
                category: document.getElementById("category").value.trim(),
                quantity: parseInt(document.getElementById("quantity").value),
                price: parseFloat(document.getElementById("price").value),
                reorder_level: parseInt(document.getElementById("reorder_level").value)
            };

            // Validate the data
            if (!formData.name || !formData.category || isNaN(formData.quantity) || isNaN(formData.price)) {
                messageContainer.textContent = "Please fill in all fields with valid values";
                messageContainer.style.color = "red";
                return;
            }

            console.log('Attempting to send data:', formData);

            const response = await fetch("http://localhost:3000/api/products", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                messageContainer.textContent = "Product added successfully!";
                messageContainer.style.color = "green";
                addProductForm.reset();
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1500);
            } else {
                // Show specific error message
                const errorMessage = data.error || data.details || "Failed to add product";
                if (response.status === 403) {
                    messageContainer.textContent = "You don't have permission to add products. Please login as an Admin.";
                } else {
                    messageContainer.textContent = errorMessage;
                }
                messageContainer.style.color = "red";
            }
        } catch (error) {
            console.error("Error details:", error);
            messageContainer.textContent = "Server error. Please try again later.";
            messageContainer.style.color = "red";
        }
    });

    // Logout button handler
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }
  }
});