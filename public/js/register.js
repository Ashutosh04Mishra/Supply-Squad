// public/js/register.js
import { checkAuth } from "./auth.js";

document.addEventListener('DOMContentLoaded', () => {
    console.log("Register page loaded"); // Debug log
    
    // We should not redirect users from the registration page even if they have a token
    // This allows users to create new accounts even when logged in

    const registerForm = document.getElementById("register-form");
    const messageContainer = document.getElementById("register-message");
    const registerButton = registerForm.querySelector("button[type='submit']");

    if (!registerForm) {
        console.error("Register form not found!"); // Debug log
        return;
    }

    registerForm.onsubmit = async function(e) {
        e.preventDefault(); // Stop form from submitting normally
        
        // Disable the button while processing
        registerButton.disabled = true;
        messageContainer.textContent = "Processing...";
        
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const role = document.getElementById("role").value;

        console.log("Form data:", { username, role }); // Debug log

        try {
            console.log("Sending request to server..."); // Debug log
            const response = await fetch("http://localhost:3000/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password, role }),
            });

            console.log("Response received:", response.status); // Debug log

            const data = await response.json();
            console.log("Response data:", data); // Debug log

            if (response.ok) {
                messageContainer.style.color = "green";
                messageContainer.textContent = "Registration successful! Redirecting to login...";
                
                // Re-enable the button on success
                registerButton.disabled = false;
                
                // Wait 2 seconds before redirecting
                setTimeout(() => {
                    window.location.href = "login.html?from=register";
                }, 2000);
            } else {
                throw new Error(data.error || "Registration failed");
            }
        } catch (error) {
            console.error("Registration error:", error); // Debug log
            messageContainer.style.color = "red";
            messageContainer.textContent = error.message || "An error occurred during registration";
            // Re-enable the button on error
            registerButton.disabled = false;
        }

        return false; // Prevent form submission
    };
});