// public/sales.js
import { checkAuth, logout } from "./auth.js";

window.onload = async () => {
    // Check authentication but don't redirect (checkAuth already handles redirection if needed)
    checkAuth();
    // Initialize the page - checkAuth will have already redirected if not authenticated
    await initializeSalesPage();
};

const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
}

async function fetchData(url) {
    try {
        const token = localStorage.getItem("token");
        console.log(`Fetching data from: ${url}`);
        console.log(`Using token: ${token ? 'Token exists' : 'No token found'}`);
        
        if (!token) {
            console.error('No authentication token found');
            // Store the current page URL before redirecting
            localStorage.setItem('redirectUrl', window.location.href);
            window.location.href = "login.html";
            return [];
        }
        
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        
        console.log(`Response status: ${response.status}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Data received from ${url}:`, data);
        console.log(`Number of products received: ${Array.isArray(data) ? data.length : 'Not an array'}`);
        return data;
    } catch (error) {
        console.error(`Failed to fetch data from ${url}:`, error);
        return [];
    }
}

async function initializeSalesPage() {
    await displaySales();
    await setupCreateSaleForm();
}

async function setupCreateSaleForm() {
    console.log('Setting up create sale form...');
    
    // Define these variables at the function level so they're accessible in all event listeners
    let products = [];
    let selectedProduct = null;
    const productSelect = document.getElementById("product-select");
    const quantityInput = document.getElementById("product-quantity");
    const availableStockSpan = document.getElementById("available-stock");
    const unitPriceSpan = document.getElementById("unit-price");
    const totalPriceSpan = document.getElementById("total-price");
    const createSaleForm = document.getElementById("create-sale-form");
    const saleMessage = document.getElementById("sale-message");
    
    // Check if a product ID was passed in the URL (from staff creating a sale)
    const urlParams = new URLSearchParams(window.location.search);
    const preselectedProductId = urlParams.get('productId');
    
    try {
        // Check if token exists before making the API call
        const token = localStorage.getItem("token");
        if (!token) {
            console.error("No authentication token found. Redirecting to login...");
            localStorage.setItem('redirectUrl', window.location.href);
            window.location.href = "login.html";
            return;
        }
        
        console.log('Fetching products from API...');
        products = await fetchData("http://localhost:3000/api/products");
        console.log('Products fetched:', products);
        
        // Populate product dropdown
        console.log('Clearing and initializing product dropdown...');
        productSelect.innerHTML = '<option value="">-- Select a product --</option>';
        
        // Check if products array exists and has items
        if (!products || !Array.isArray(products)) {
            console.error("Products data is not an array:", products);
            saleMessage.textContent = "Error loading products. Please try again later.";
            saleMessage.style.color = "red";
            productSelect.disabled = true;
            quantityInput.disabled = true;
            document.getElementById("create-sale-btn").disabled = true;
            return;
        }
        
        // Variable to track if we found the preselected product
        let foundPreselectedProduct = false;
        
        if (products.length === 0) {
            console.error("No products available - products array is empty");
            saleMessage.textContent = "No products available. Please add products first.";
            saleMessage.style.color = "red";
            // Disable the form elements
            productSelect.disabled = true;
            quantityInput.disabled = true;
            document.getElementById("create-sale-btn").disabled = true;
            return;
        }
        
        // If we have products, populate the dropdown
        console.log(`Adding ${products.length} products to dropdown...`);
        products.forEach(product => {
            console.log(`Adding product: ${product.name}, ID: ${product.id}`);
            const option = document.createElement("option");
            option.value = product.id;
            option.textContent = `${product.name} - $${product.price.toFixed(2)}`;
            option.dataset.price = product.price;
            option.dataset.quantity = product.quantity;
            
            // If this product matches the preselected ID, select it
            if (preselectedProductId && product.id.toString() === preselectedProductId) {
                option.selected = true;
                foundPreselectedProduct = true;
                // Trigger product selection to update UI
                selectedProduct = product;
                availableStockSpan.textContent = product.quantity;
                unitPriceSpan.textContent = `$${product.price.toFixed(2)}`;
                // Enable quantity input
                quantityInput.disabled = false;
                quantityInput.max = product.quantity;
                quantityInput.value = 1; // Set default quantity to 1
                // Update total price
                totalPriceSpan.textContent = `$${product.price.toFixed(2)}`;
            }
            
            productSelect.appendChild(option);
        });
        
        // If we found and selected the preselected product, scroll to the form
        if (foundPreselectedProduct) {
            createSaleForm.scrollIntoView({ behavior: 'smooth' });
            saleMessage.textContent = "Product selected. Please enter quantity and complete the sale.";
            saleMessage.style.color = "green";
        }
        
        // Log the number of products loaded
        console.log(`Loaded ${products.length} products into dropdown`);
        console.log('Product select options count:', productSelect.options.length);
    } catch (error) {
        console.error('Error in setupCreateSaleForm:', error);
        if (saleMessage) {
            saleMessage.textContent = "Error loading products: " + error.message;
            saleMessage.style.color = "red";
        }
    }

    // Update product information when selection changes
    productSelect.addEventListener("change", () => {
        const selectedOption = productSelect.options[productSelect.selectedIndex];
        if (selectedOption.value) {
            selectedProduct = products.find(p => p.id == selectedOption.value);
            console.log('Selected product:', selectedProduct);
            if (selectedProduct) {
                // Display available stock
                availableStockSpan.textContent = selectedProduct.quantity;
                
                // Use the product price directly as the unit price
                const unitPrice = selectedProduct.price;
                unitPriceSpan.textContent = unitPrice.toFixed(2);
                
                // Reset quantity input
                quantityInput.value = "1";
                quantityInput.max = selectedProduct.quantity;
                
                // Update total price for one item
                totalPriceSpan.textContent = unitPrice.toFixed(2);
            }
        } else {
            selectedProduct = null;
            availableStockSpan.textContent = "-";
            unitPriceSpan.textContent = "0.00";
            totalPriceSpan.textContent = "0.00";
        }
    });

    // Update total price when quantity changes
    quantityInput.addEventListener("input", () => {
        console.log('Quantity changed, selectedProduct:', selectedProduct);
        if (selectedProduct && quantityInput.value > 0) {
            const quantity = parseInt(quantityInput.value);
            // Use the product price directly as the unit price
            const unitPrice = selectedProduct.price;
            // Calculate total price based on quantity and unit price
            const totalPrice = quantity * unitPrice;
            totalPriceSpan.textContent = totalPrice.toFixed(2);
            
            // Show warning if quantity exceeds available stock
            if (quantity > selectedProduct.quantity) {
                saleMessage.textContent = "Warning: Quantity exceeds available stock!";
                saleMessage.style.color = "red";
            } else {
                saleMessage.textContent = "";
            }
        } else {
            totalPriceSpan.textContent = "0.00";
        }
    });

    // Handle form submission
    createSaleForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        createSaleForm.querySelector("#create-sale-btn").disabled = true;
        console.log('Form submitted, selectedProduct:', selectedProduct);
        
        if (!selectedProduct) {
            saleMessage.textContent = "Please select a product";
            saleMessage.style.color = "red";
            return;
        }
        
        const quantity = parseInt(quantityInput.value);
        
        if (quantity <= 0) {
            saleMessage.textContent = "Quantity must be greater than zero";
            saleMessage.style.color = "red";
            return;
        }
        
        if (quantity > selectedProduct.quantity) {
            saleMessage.textContent = "Insufficient stock available";
            saleMessage.style.color = "red";
            return;
        }
        
        try {
            const token = localStorage.getItem("token");
            
            // Use the product price directly as the unit price
            const unitPrice = selectedProduct.price;
            // Calculate total price for the sale
            const saleTotal = quantity * unitPrice;
            
            const response = await fetch("http://localhost:3000/api/sales", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    productId: selectedProduct.id,
                    quantity: quantity,
                    totalPrice: saleTotal
                }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                createSaleForm.querySelector("#create-sale-btn").disabled = false;
                throw new Error(errorData.message || "Failed to create sale");
            }
            
            const saleData = await response.json();
            
            // Update product price after sale if needed
            // REMOVE THIS BLOCK: It causes duplicate stock update
            // if (selectedProduct.quantity - quantity > 0) {
            //     // Only update price if there are remaining items
            //     const updateResponse = await fetch(`http://localhost:3000/api/products/${selectedProduct.id}`, {
            //         method: "PUT",
            //         headers: {
            //             "Content-Type": "application/json",
            //             Authorization: `Bearer ${token}`,
            //         },
            //         body: JSON.stringify({
            //             name: selectedProduct.name,
            //             quantity: selectedProduct.quantity - quantity,
            //             price: remainingPrice,
            //             category: selectedProduct.category,
            //             reorder_level: selectedProduct.reorder_level
            //         }),
            //     });
            //     
            //     if (!updateResponse.ok) {
            //         console.error("Failed to update product price after sale");
            //     }
            // }
            
            // Show success message
            saleMessage.textContent = "Sale created successfully!";
            saleMessage.style.color = "green";
            
            // Reset form
            createSaleForm.reset();
            availableStockSpan.textContent = "-";
            unitPriceSpan.textContent = "0.00";
            totalPriceSpan.textContent = "0.00";
            selectedProduct = null;
            
            // Re-enable the create sale button
            createSaleForm.querySelector("#create-sale-btn").disabled = false;
            
            // Refresh sales table
            await displaySales();
            
            // Fetch fresh product data after the sale
            products = await fetchData("http://localhost:3000/api/products");
            
            // Re-populate the product dropdown with updated data
            productSelect.innerHTML = '<option value="">-- Select a product --</option>';
            products.forEach(product => {
                const option = document.createElement("option");
                option.value = product.id;
                option.textContent = `${product.name} - $${product.price.toFixed(2)}`;
                option.dataset.price = product.price;
                option.dataset.quantity = product.quantity;
                productSelect.appendChild(option);
            });
            
            console.log('Product dropdown refreshed with updated data');
            console.log(`Loaded ${products.length} products into dropdown after sale`);
            
        } catch (error) {
            saleMessage.textContent = error.message;
            saleMessage.style.color = "red";
            createSaleForm.querySelector("#create-sale-btn").disabled = false;
            console.error("Error creating sale:", error);
        }
    });
}

// Function to decode JWT token and extract user information
function decodeToken(token) {
    try {
        // JWT tokens are split into three parts: header, payload, and signature
        // We only need the payload (second part)
        const payload = token.split('.')[1];
        // The payload is base64 encoded, so we need to decode it
        const decodedPayload = atob(payload);
        // Parse the decoded payload as JSON
        return JSON.parse(decodedPayload);
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
}

async function displaySales() {
    // Fetch fresh data each time to ensure we have the latest sales
    const sales = await fetchData("http://localhost:3000/api/sales");
    const products = await fetchData("http://localhost:3000/api/products");
    const users = await fetchData("http://localhost:3000/api/auth/users");
    
    // Get the current user's ID from the token
    const token = localStorage.getItem("token");
    const decodedToken = decodeToken(token);
    const currentUserId = decodedToken ? decodedToken.id : null;
    
    console.log('Current user ID:', currentUserId);
    console.log('Displaying sales history:', sales);
    console.log('Sales data structure:', JSON.stringify(sales[0]));
    
    // Filter sales to only show the current user's sales
    // Also deduplicate sales by using a Map with sale ID as key
    const salesMap = new Map();
    
    // First filter by user ID and add to map (this will automatically deduplicate by ID)
    const filteredSales = currentUserId ? sales.filter(sale => {
        return sale.userId === currentUserId || 
               (sale.user && sale.user.id === currentUserId);
    }) : sales;
    
    // Add to map with ID as key to remove duplicates
    filteredSales.forEach(sale => {
        if (!salesMap.has(sale.id)) {
            salesMap.set(sale.id, sale);
        }
    });
    
    // Convert map back to array
    const userSales = Array.from(salesMap.values());
    
    console.log(`Filtered to ${userSales.length} unique sales for current user`);
    
    const productFilter = document.getElementById("product-filter");
    const userFilter = document.getElementById("user-filter");
    const salesTable = document.getElementById("sales-table").getElementsByTagName("tbody")[0];

    // Clear existing options
    productFilter.innerHTML = '<option value="">All Products</option>';
    userFilter.innerHTML = '<option value="">All Users</option>';
    
    products.forEach((product) => {
        const option = document.createElement("option");
        option.value = product.id;
        option.textContent = product.name;
        productFilter.appendChild(option);
    });

    users.forEach((user) => {
        const option = document.createElement("option");
        option.value = user.id;
        option.textContent = user.username;
        userFilter.appendChild(option);
    });

    function populateSalesTable(salesData) {
        salesTable.innerHTML = "";
        
        if (salesData.length === 0) {
            // Display a message when no sales are found
            const row = salesTable.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 6; // Span across all columns
            cell.textContent = "No sales records found for your account";
            cell.style.textAlign = "center";
            return;
        }
        
        salesData.forEach((sale) => {
            console.log('Processing sale:', sale);
            console.log('Sale product info:', sale.product);
            
            // Find product info if not included in sale object
            let productName = 'Unknown Product';
            if (sale.product && sale.product.name) {
                productName = sale.product.name;
            } else if (sale.productId) {
                // Try to find product by ID
                const product = products.find(p => p.id === sale.productId);
                if (product) {
                    productName = product.name;
                }
            }
            
            // Find user info if not included in sale object
            let userName = 'Unknown User';
            if (sale.user && sale.user.username) {
                userName = sale.user.username;
            } else if (sale.userId) {
                // Try to find user by ID
                const user = users.find(u => u.id === sale.userId);
                if (user) {
                    userName = user.username;
                }
            }
            
            const row = salesTable.insertRow();
            row.insertCell().textContent = sale.id;
            row.insertCell().textContent = productName;
            row.insertCell().textContent = sale.quantity;
            row.insertCell().textContent = `$${sale.totalPrice.toFixed(2)}`;
            row.insertCell().textContent = new Date(sale.createdAt || sale.saleDate).toLocaleDateString();
            row.insertCell().textContent = userName;
        });
        
        console.log('Sales table populated with', salesData.length, 'records');
    }

    populateSalesTable(userSales);

    document.getElementById("search-input").addEventListener("input", (event) => {
        const searchTerm = event.target.value.toLowerCase();
        console.log('Search term:', searchTerm);
        
        const filteredSales = userSales.filter((sale) => {
            // Get product name - either from sale.product or by finding it in products array
            let productName = '';
            if (sale.product && sale.product.name) {
                productName = sale.product.name.toLowerCase();
            } else if (sale.productId) {
                const product = products.find(p => p.id === sale.productId);
                if (product) {
                    productName = product.name.toLowerCase();
                }
            }
            
            // Get username - either from sale.user or by finding it in users array
            let username = '';
            if (sale.user && sale.user.username) {
                username = sale.user.username.toLowerCase();
            } else if (sale.userId) {
                const user = users.find(u => u.id === sale.userId);
                if (user) {
                    username = user.username.toLowerCase();
                }
            }
            
            return (
                productName.includes(searchTerm) ||
                username.includes(searchTerm) ||
                sale.id.toString().includes(searchTerm)
            );
        });
        
        console.log('Filtered sales by search:', filteredSales.length);
        populateSalesTable(filteredSales);
    });

    productFilter.addEventListener("change", (event) => {
        const selectedProductId = parseInt(event.target.value);
        console.log('Product filter changed to:', selectedProductId);
        if (selectedProductId) {
            // Check both productId and product.id for flexibility
            const filteredSales = userSales.filter((sale) => {
                return sale.productId === selectedProductId || 
                       (sale.product && sale.product.id === selectedProductId);
            });
            console.log('Filtered sales by product:', filteredSales);
            populateSalesTable(filteredSales);
        } else {
            populateSalesTable(userSales);
        }
    });

    userFilter.addEventListener("change", (event) => {
        const selectedUserId = parseInt(event.target.value);
        console.log('User filter changed to:', selectedUserId);
        if (selectedUserId) {
            // Check both userId and user.id for flexibility
            const filteredSales = userSales.filter((sale) => {
                return sale.userId === selectedUserId || 
                       (sale.user && sale.user.id === selectedUserId);
            });
            console.log('Filtered sales by user:', filteredSales);
            populateSalesTable(filteredSales);
        } else {
            populateSalesTable(userSales);
        }
    });
}

// displaySales() is already called in initializeSalesPage()