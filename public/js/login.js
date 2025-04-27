import { checkAuth } from "./auth.js";

document.addEventListener('DOMContentLoaded', function() {
    console.log("Login page loaded"); // Debug log
    
    const loginForm = document.getElementById("login-form");
    const messageContainer = document.getElementById("login-message");
    
    // Check if we were redirected from registration
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('from') && urlParams.get('from') === 'register') {
        messageContainer.textContent = "Registration successful! Please login with your new credentials.";
        messageContainer.style.color = "green";
    }

    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault(); // This prevents form refresh
        
        console.log("Login form submitted"); // Debug log

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        if (!username || !password) {
            messageContainer.textContent = "Please enter both username and password";
            messageContainer.className = "error-message";
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            console.log("Login response status:", response.status); // Debug log

            const data = await response.json();
            console.log("Login response data:", data); // Debug log

            if (response.ok) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("userRole", data.user.role);
                localStorage.setItem("userId", data.user.id);
                messageContainer.textContent = "Login successful! Redirecting...";
                messageContainer.style.color = "green";
                setTimeout(() => {
                    // Check if there's a stored redirect URL
                    const redirectUrl = localStorage.getItem('redirectUrl');
                    localStorage.removeItem('redirectUrl'); // Clear the stored URL
                    if (redirectUrl) {
                        window.location.href = redirectUrl;
                    } else {
                        window.location.href = "index.html";
                    }
                }, 1000);
            } else {
                messageContainer.textContent = data.error || "Login failed";
                messageContainer.style.color = "red";
            }
        } catch (error) {
            console.error("Login error:", error); // Debug log
            messageContainer.textContent = "An error occurred. Please try again.";
            messageContainer.style.color = "red";
        }
    });
});