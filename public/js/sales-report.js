import { checkAuth, logout } from "./auth.js";

document.addEventListener('DOMContentLoaded', function () {
    console.log("Sales report page loaded");

    // Ensure Chart.js is properly loaded before proceeding
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded. Waiting for it to load...');

        // Wait for Chart.js to load (retry a few times)
        let attempts = 0;
        const maxAttempts = 10; // Increased max attempts
        const checkChartInterval = setInterval(() => {
            attempts++;
            console.log(`Checking for Chart.js (attempt ${attempts}/${maxAttempts})...`);

            if (typeof Chart !== 'undefined') {
                console.log('Chart.js is now loaded!');
                clearInterval(checkChartInterval);
                initializePage();
            } else if (attempts >= maxAttempts) {
                console.error('Chart.js failed to load after multiple attempts');
                clearInterval(checkChartInterval);
                // Show error message on the page
                document.querySelectorAll('.charts-container div').forEach(container => {
                    container.innerHTML = '<p class="error-message">Failed to load chart library. Please refresh the page.</p>';
                });
                // Still try to show the table data at least
                initializePage();
            }
        }, 1000); // Increased interval to 1 second
    } else {
        console.log('Chart.js is already loaded');
        initializePage();
    }
});

// Create a container for the top selling products table
const createTopSellingProductsContainer = () => {
    // Check if the container already exists
    if (document.getElementById('top-selling-products-container')) {
        return; // Container already exists
    }
    
    // Add CSS for the top product highlighting
    const style = document.createElement('style');
    style.textContent = `
        .top-product {
            background-color: rgba(255, 215, 0, 0.2) !important; /* Gold background */
            font-weight: bold;
        }
        #top-selling-products-table th {
            background-color: #f8f9fa;
        }
    `;
    document.head.appendChild(style);

    // Create the container
    const container = document.createElement('div');
    container.id = 'top-selling-products-container';
    container.className = 'card mt-4';

    // Create the card header
    const header = document.createElement('div');
    header.className = 'card-header';
    header.innerHTML = '<h3>Top 3 Highest Selling Products by Quantity</h3>';


    // Create the card body
    const body = document.createElement('div');
    body.className = 'card-body';

    // Create the table
    const table = document.createElement('table');
    table.id = 'top-selling-products-table';
    table.className = 'table table-striped';

    // Create the table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Product Name</th>
            <th>Quantity Sold</th>
            <th>Revenue</th>
            <th>Number of Sales</th>
        </tr>
    `;

    // Create the table body
    const tbody = document.createElement('tbody');
    tbody.innerHTML = '<tr><td colspan="4">Loading top selling products...</td></tr>';

    // Append elements
    table.appendChild(thead);
    table.appendChild(tbody);
    body.appendChild(table);
    container.appendChild(header);
    container.appendChild(body);

    // Find the charts container to insert before it
    const chartsContainer = document.querySelector('.charts-container');
    if (chartsContainer) {
        chartsContainer.parentNode.insertBefore(container, chartsContainer);
    } else {
        // If charts container not found, append to the main content
        const mainContent = document.querySelector('.content');
        if (mainContent) {
            mainContent.appendChild(container);
        }
    }
};

// Initialize the page content
function initializePage() {
    // Only proceed if authentication is successful
    if (checkAuth()) {
        console.log("Authentication successful, displaying sales report");
        // Create the top selling products container
        createTopSellingProductsContainer();
        // Display the sales report and top selling products
        displaySalesReport();
        displayTopSellingProducts();
    } else {
        console.log("Authentication failed, redirecting to login");
    }
}

const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
}

async function fetchSalesReport() {
    try {
        const token = localStorage.getItem("token");

        if (!token) {
            console.error('No authentication token found');
            showErrorMessage("Authentication required. Please log in again.");
            // Store the current page URL before redirecting
            localStorage.setItem('redirectUrl', window.location.href);
            window.location.href = "login.html";
            return [];
        }

        console.log("Fetching sales report with token:", token ? 'Token exists' : 'No token');

        const response = await fetch("http://localhost:3000/api/reports/sales-summary", {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });

        console.log(`Response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);

            if (response.status === 401 || response.status === 403) {
                showErrorMessage("Authentication failed. Please log in again.");
                localStorage.removeItem("token");
                window.location.href = "login.html";
                return [];
            } else {
                throw new Error(`Failed to fetch sales report: ${response.status} - ${errorText || 'Unknown error'}`);
            }
        }

        let data;
        try {
            data = await response.json();
            // For debugging - log the actual data structure
            console.log("Raw API response:", data);
        } catch (jsonError) {
            console.error("Error parsing JSON response:", jsonError);
            throw new Error("Invalid response format from server");
        }

        // If data is not valid, return empty array
        if (!data) {
            showErrorMessage("No data received from server.");
            return [];
        }

        // Check if data is an array
        if (!Array.isArray(data)) {
            // If data is an object with an error message, show that message
            if (data.error) {
                showErrorMessage(`Server error: ${data.error}`);
                return [];
            }

            // If data is not an array but has no error message, try to handle it
            console.warn("Received non-array data:", data);
            // Try to convert to array if possible
            if (typeof data === 'object') {
                try {
                    // If it's an object with numeric keys, try to convert to array
                    const possibleArray = Object.values(data);
                    if (possibleArray.length > 0) {
                        console.log("Converted object to array:", possibleArray);
                        return possibleArray;
                    }
                } catch (e) {
                    console.error("Failed to convert object to array:", e);
                }
            }

            showErrorMessage("Invalid sales data format received from server.");
            return [];
        }

        // If data is empty, return the empty array without showing an error
        // This allows the UI to handle the empty state appropriately
        if (data.length === 0) {
            console.log("Sales data is valid but empty");
            return data;
        }

        // Validate each item in the array has the expected properties
        const validData = data.filter(item => {
            return item &&
                typeof item === 'object' &&
                item.product &&
                typeof item.product === 'object' &&
                item.product.name &&
                (item.totalQuantitySold !== undefined) &&
                (item.totalRevenue !== undefined) &&
                (item.totalSalesCount !== undefined);
        });

        if (validData.length < data.length) {
            console.warn(`Filtered out ${data.length - validData.length} invalid items from sales data`);
        }

        return validData;
    } catch (error) {
        console.error("Error fetching sales report:", error);
        showErrorMessage(`Error loading sales report data: ${error.message}. Please try again later.`);
        return [];
    }
}

// Helper function to show error messages
function showErrorMessage(message) {
    // Show error in table
    const reportTable = document.getElementById("sales-report-table").getElementsByTagName("tbody")[0];
    if (reportTable) {
        reportTable.innerHTML = `<tr><td colspan='4'>${message}</td></tr>`;
    }

    // Show error in chart containers
    document.querySelectorAll('.charts-container div').forEach(container => {
        const canvas = container.querySelector('canvas');
        if (canvas) {
            // Clear any existing charts
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Add error message
            const errorMsg = document.createElement('p');
            errorMsg.className = 'error-message';
            errorMsg.textContent = message;
            errorMsg.style.textAlign = 'center';
            errorMsg.style.color = '#d9534f';
            errorMsg.style.padding = '20px';
            container.appendChild(errorMsg);
        }
    });
}

function clearErrorMessages() {
    // Remove error messages from chart containers
    document.querySelectorAll('.error-message').forEach(msg => {
        msg.remove();
    });
}

function showLoadingIndicator() {
    // Show loading in table
    const reportTable = document.getElementById("sales-report-table").getElementsByTagName("tbody")[0];
    if (reportTable) {
        reportTable.innerHTML = `<tr><td colspan='4'>Loading sales data...</td></tr>`;
    }

    // Show loading in chart containers
    document.querySelectorAll('.charts-container div').forEach(container => {
        // Add loading message if it doesn't already have one
        if (!container.querySelector('.loading-indicator')) {
            const loadingMsg = document.createElement('p');
            loadingMsg.className = 'loading-indicator';
            loadingMsg.textContent = 'Loading chart data...';
            loadingMsg.style.textAlign = 'center';
            loadingMsg.style.color = '#007bff';
            loadingMsg.style.padding = '20px';
            container.appendChild(loadingMsg);
        }
    });
}

function hideLoadingIndicator() {
    // Remove loading indicators
    document.querySelectorAll('.loading-indicator').forEach(indicator => {
        indicator.remove();
    });
}

// Global chart instance holders
let revenueChartInstance = null;
let quantityChartInstance = null;
let performanceChartInstance = null;

// Function to create a bar chart
function createBarChart(canvasId, labels, data, label, backgroundColor) {
    try {
        if (!canvasId || typeof canvasId !== 'string') {
            console.error('Invalid canvasId provided to createBarChart');
            return null;
        }
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas element with ID '${canvasId}' not found`);
            return null;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error(`Could not get 2D context for canvas '${canvasId}'`);
            return null;
        }
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded. Please check the script inclusion.');
            return null;
        }
        // Destroy previous chart instance if exists
        if (canvasId === 'revenue-chart' && revenueChartInstance) {
            revenueChartInstance.destroy();
        }

        // Check if we have valid data
        if (!labels || !Array.isArray(labels) || !data || !Array.isArray(data)) {
            console.error(`Invalid data format for chart '${canvasId}'`);
            return null;
        }

        if (labels.length === 0 || data.length === 0) {
            console.error(`Empty data for chart '${canvasId}'`);
            return null;
        }

        // Ensure data values are valid numbers
        const validData = data.map(value => {
            const num = parseFloat(value);
            return isNaN(num) ? 0 : num;
        });
        const validBackgroundColor = Array.isArray(backgroundColor) && backgroundColor.length > 0 ?
            backgroundColor : ['rgba(54, 162, 235, 0.6)'];
        console.log(`Creating bar chart for '${canvasId}' with data:`, { labels, validData });
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: validData,
                    backgroundColor: backgroundColor,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    title: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                animation: false
            }
        });
        // Set a fixed height for the bar chart canvas
        if (canvasId === 'revenue-chart' && canvas) {
            canvas.style.height = '350px';
        }
        if (canvasId === 'revenue-chart') {
            revenueChartInstance = chart;
        }
        return chart;
    } catch (error) {
        console.error(`Error creating bar chart for '${canvasId}':`, error);
        try {
            const canvas = document.getElementById(canvasId);
            if (canvas && canvas.parentElement) {
                const errorMsg = document.createElement('p');
                errorMsg.className = 'chart-error';
                errorMsg.textContent = 'Error creating chart. Please try again later.';
                errorMsg.style.color = '#d9534f';
                errorMsg.style.textAlign = 'center';
                canvas.parentElement.appendChild(errorMsg);
            }
        } catch (e) {
            console.error('Error adding error message to chart container:', e);
        }
        return null;
    }
}

// Function to create a pie chart
function createPieChart(canvasId, labels, data, backgroundColor) {
    try {
        if (!canvasId || typeof canvasId !== 'string') {
            console.error('Invalid canvasId provided to createPieChart');
            return null;
        }
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas element with ID '${canvasId}' not found`);
            return null;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error(`Could not get 2D context for canvas '${canvasId}'`);
            return null;
        }
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded. Please check the script inclusion.');
            return null;
        }
        // Destroy previous chart instance if exists
        if (canvasId === 'quantity-chart' && quantityChartInstance) {
            quantityChartInstance.destroy();
        }

        // Check if we have valid data
        if (!labels || !Array.isArray(labels) || !data || !Array.isArray(data)) {
            console.error(`Invalid data format for chart '${canvasId}'`);
            return null;
        }

        if (labels.length === 0 || data.length === 0) {
            console.error(`Empty data for chart '${canvasId}'`);
            return null;
        }

        // Ensure data values are valid numbers
        const validData = data.map(value => {
            const num = parseFloat(value);
            return isNaN(num) ? 0 : num;
        });
        const validBackgroundColor = Array.isArray(backgroundColor) && backgroundColor.length > 0 ?
            backgroundColor : ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)'];

        // Make sure we have enough colors for all data points
        while (validBackgroundColor.length < validData.length) {
            const hue = (validBackgroundColor.length * 137) % 360; // Use golden ratio to spread colors
            validBackgroundColor.push(`hsla(${hue}, 70%, 60%, 0.6)`);
        }

        console.log(`Creating pie chart for '${canvasId}' with data:`, { labels, validData });

        const chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: validData,
                    backgroundColor: validBackgroundColor,
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true },
                    title: { display: true, text: 'Quantity Sold' }
                }
            }
        });
        if (canvasId === 'quantity-chart') {
            quantityChartInstance = chart;
        }
        return chart;
    } catch (error) {
        console.error(`Error creating pie chart for '${canvasId}':`, error);
        try {
            const canvas = document.getElementById(canvasId);
            if (canvas && canvas.parentElement) {
                const errorMsg = document.createElement('p');
                errorMsg.className = 'chart-error';
                errorMsg.textContent = 'Error creating chart. Please try again later.';
                errorMsg.style.color = '#d9534f';
                errorMsg.style.textAlign = 'center';
                canvas.parentElement.appendChild(errorMsg);
            }
        } catch (e) {
            console.error('Error adding error message to chart container:', e);
        }
        return null;
    }
}

// Function to create a scatter chart for sales performance
function createSalesPerformanceChart(canvasId, reportData, backgroundColors) {
    try {
        if (!canvasId || typeof canvasId !== 'string') {
            console.error('Invalid canvasId provided to createSalesPerformanceChart');
            return null;
        }
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas element with ID '${canvasId}' not found`);
            return null;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error(`Could not get 2D context for canvas '${canvasId}'`);
            return null;
        }
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded. Please check the script inclusion.');
            return null;
        }
        // Destroy previous chart instance if exists
        if (canvasId === 'sales-performance-chart' && performanceChartInstance) {
            performanceChartInstance.destroy();
        }

        // Check if we have valid data
        if (!reportData || !Array.isArray(reportData) || reportData.length === 0) {
            console.error(`Invalid data for chart '${canvasId}'`);
            return null;
        }

        // Ensure backgroundColor is valid
        const validBackgroundColors = Array.isArray(backgroundColors) && backgroundColors.length > 0 ?
            backgroundColors : ['rgba(54, 162, 235, 0.6)'];

        // Make sure we have enough colors for all data points
        while (validBackgroundColors.length < reportData.length) {
            const hue = (validBackgroundColors.length * 137) % 360; // Use golden ratio to spread colors
            validBackgroundColors.push(`hsla(${hue}, 70%, 60%, 0.6)`);
        }

        // Prepare data for scatter plot with safety checks
        const scatterData = reportData.map(item => {
            // Safely extract values with fallbacks
            const salesCount = parseInt(item?.totalSalesCount);
            const revenue = parseFloat(item?.totalRevenue);
            const productName = item?.product?.name || 'Unknown Product';

            return {
                x: isNaN(salesCount) ? 0 : salesCount,
                y: isNaN(revenue) ? 0 : revenue,
                productName: productName
            };
        });

        // Filter out any invalid data points
        const validScatterData = scatterData.filter(point =>
            point.x !== undefined &&
            point.y !== undefined &&
            !isNaN(point.x) &&
            !isNaN(point.y)
        );

        if (validScatterData.length === 0) {
            console.error(`No valid data points for scatter chart '${canvasId}'`);
            return null;
        }

        console.log(`Creating scatter chart for '${canvasId}' with data:`, validScatterData);

        const chart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Sales Performance',
                    data: validScatterData,
                    backgroundColor: validBackgroundColors,
                    pointRadius: 10,
                    pointHoverRadius: 15
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: 'Sales Performance' }
                }
            }
        });
        if (canvasId === 'sales-performance-chart') {
            performanceChartInstance = chart;
        }
        return chart;
    } catch (error) {
        console.error(`Error creating scatter chart for '${canvasId}':`, error);
        try {
            const canvas = document.getElementById(canvasId);
            if (canvas && canvas.parentElement) {
                const errorMsg = document.createElement('p');
                errorMsg.className = 'chart-error';
                errorMsg.textContent = 'Error creating chart. Please try again later.';
                errorMsg.style.color = '#d9534f';
                errorMsg.style.textAlign = 'center';
                canvas.parentElement.appendChild(errorMsg);
            }
        } catch (e) {
            console.error('Error adding error message to chart container:', e);
        }
        return null;
    }
}

async function displaySalesReport() {
    try {
        console.log("Fetching sales report data...");

        // Clear any existing error messages before fetching new data
        clearErrorMessages();

        // Show loading indicator
        showLoadingIndicator();

        const reportData = await fetchSalesReport();

        // Hide loading indicator
        hideLoadingIndicator();

        // Debug: Log the received data
        console.log("Sales report data received:", reportData);

        // Get the report table
        const reportTable = document.getElementById("sales-report-table")?.getElementsByTagName("tbody")[0];
        if (!reportTable) {
            console.error("Sales report table not found");
            showErrorMessage("Error: Sales report table not found on page.");
            return;
        }

        // Clear existing rows
        reportTable.innerHTML = "";

        // Handle empty data case
        if (!reportData || !Array.isArray(reportData) || reportData.length === 0) {
            console.log("No sales report data available");
            reportTable.innerHTML = "<tr><td colspan='4'>No sales data available. Create some sales first.</td></tr>";

            // Clear any existing charts
            clearCharts();
            return;
        }

        try {
            // Extract data for charts - with additional safety checks
            const productNames = reportData.map(item => {
                return item?.product?.name || 'Unknown Product';
            });

            const revenues = reportData.map(item => {
                const revenue = parseFloat(item?.totalRevenue);
                return isNaN(revenue) ? 0 : revenue;
            });

            const quantities = reportData.map(item => {
                const quantity = parseInt(item?.totalQuantitySold);
                return isNaN(quantity) ? 0 : quantity;
            });

            // Generate random colors for charts
            const generateColors = (count) => {
                const colors = [];
                for (let i = 0; i < count; i++) {
                    const hue = (i * 137) % 360; // Use golden ratio to spread colors
                    colors.push(`hsla(${hue}, 70%, 60%, 0.6)`);
                }
                return colors;
            };

            const backgroundColors = generateColors(productNames.length);

            // Debug: Log chart data
            console.log("Chart data:", {
                productNames,
                revenues,
                quantities,
                backgroundColors
            });

            // Check if canvas elements exist
            const revenueCanvas = document.getElementById('revenue-chart');
            const quantityCanvas = document.getElementById('quantity-chart');
            const performanceCanvas = document.getElementById('sales-performance-chart');

            console.log("Revenue chart canvas exists:", !!revenueCanvas);
            console.log("Quantity chart canvas exists:", !!quantityCanvas);
            console.log("Sales performance chart canvas exists:", !!performanceCanvas);

            if (!revenueCanvas || !quantityCanvas || !performanceCanvas) {
                console.error("One or more chart canvases not found");
                showErrorMessage("Error: Chart elements not found on page.");
                return;
            }

            // Create revenue chart
            const revenueChart = createBarChart(
                'revenue-chart',
                productNames,
                revenues,
                'Revenue ($)',
                backgroundColors
            );
            console.log("Revenue chart created:", !!revenueChart);

            // Create quantity chart
            const quantityChart = createPieChart(
                'quantity-chart',
                productNames,
                quantities,
                backgroundColors
            );
            console.log("Quantity chart created:", !!quantityChart);

            // Create sales performance chart (scatter plot)
            const performanceChart = createSalesPerformanceChart(
                'sales-performance-chart',
                reportData,
                backgroundColors
            );
            console.log("Sales performance chart created:", !!performanceChart);

            // Populate table with safety checks for each property
            reportData.forEach((item) => {
                try {
                    const row = reportTable.insertRow();

                    // Add product name with fallback
                    const nameCell = row.insertCell();
                    nameCell.textContent = item?.product?.name || 'Unknown Product';

                    // Add quantity with fallback
                    const quantityCell = row.insertCell();
                    const quantity = parseInt(item?.totalQuantitySold);
                    quantityCell.textContent = isNaN(quantity) ? '0' : quantity;

                    // Add revenue with fallback and formatting
                    const revenueCell = row.insertCell();
                    const revenue = parseFloat(item?.totalRevenue);
                    revenueCell.textContent = isNaN(revenue) ? '$0.00' : `$${revenue.toFixed(2)}`;

                    // Add sales count with fallback
                    const countCell = row.insertCell();
                    const count = parseInt(item?.totalSalesCount);
                    countCell.textContent = isNaN(count) ? '0' : count;
                } catch (rowError) {
                    console.error("Error creating table row:", rowError);
                    // Continue with next item instead of failing completely
                }
            });

            console.log(`Populated sales report table with ${reportData.length} rows`);
        } catch (error) {
            console.error("Error displaying sales report:", error);
            showErrorMessage("Error displaying sales report: " + error.message);
        }
    } catch (error) {
        console.error("Error in displaySalesReport:", error);
        showErrorMessage("Error loading sales report: " + error.message);
        hideLoadingIndicator();
    }
}

// Helper function to clear all charts
function clearCharts() {
    const chartIds = ['revenue-chart', 'quantity-chart', 'sales-performance-chart'];

    chartIds.forEach(id => {
        const canvas = document.getElementById(id);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Add a message about no data
                const container = canvas.parentElement;
                if (container) {
                    const message = document.createElement('p');
                    message.className = 'no-data-message';
                    message.textContent = 'No sales data available to display chart';
                    message.style.textAlign = 'center';
                    message.style.color = '#6c757d';
                    message.style.padding = '20px';

                    // Remove any existing messages first
                    container.querySelectorAll('.no-data-message').forEach(el => el.remove());
                    container.appendChild(message);
                }
            }
        }
    });
}

// Function to fetch top selling products
async function fetchTopSellingProducts() {
    try {
        const token = localStorage.getItem("token");

        if (!token) {
            console.error('No authentication token found');
            return [];
        }

        console.log("Fetching top selling products with token:", token ? 'Token exists' : 'No token');

        const response = await fetch("http://localhost:3000/api/reports/top-selling-products", {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });

        console.log(`Response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);

            if (response.status === 401 || response.status === 403) {
                showErrorMessage("Authentication failed. Please log in again.");
                localStorage.removeItem("token");
                window.location.href = "login.html";
                return [];
            } else {
                throw new Error(`Failed to fetch top selling products: ${response.status} - ${errorText || 'Unknown error'}`);
            }
        }

        let data;
        try {
            data = await response.json();
            console.log("Raw top selling products data:", data);
        } catch (jsonError) {
            console.error("Error parsing JSON response:", jsonError);
            throw new Error("Invalid response format from server");
        }

        // If data is not valid, return empty array
        if (!data) {
            console.warn("No data received from server.");
            return [];
        }

        // Check if data is an array
        if (!Array.isArray(data)) {
            // If data is an object with an error message, log that message
            if (data.error) {
                console.error(`Server error: ${data.error}`);
                return [];
            }

            // If data is not an array but has no error message, try to handle it
            console.warn("Received non-array data:", data);

            // Check if data is wrapped in another object (common API pattern)
            if (data.products && Array.isArray(data.products)) {
                console.log("Found products array in response:", data.products);
                return data.products;
            }

            // Check if data has a 'data' property that's an array (another common pattern)
            if (data.data && Array.isArray(data.data)) {
                console.log("Found data array in response:", data.data);
                return data.data;
            }

            // Try to convert to array if possible
            if (typeof data === 'object') {
                try {
                    // If it's an object with numeric keys, try to convert to array
                    const possibleArray = Object.values(data);
                    if (possibleArray.length > 0) {
                        console.log("Converted object to array:", possibleArray);
                        return possibleArray;
                    }
                } catch (e) {
                    console.error("Failed to convert object to array:", e);
                }
            }

            console.warn("Invalid top selling products data format received from server.");
            return [];
        }

        // Validate each item in the array has the expected properties
        const validData = data.filter(item => {
            return item &&
                typeof item === 'object' &&
                item.product &&
                typeof item.product === 'object' &&
                item.product.name &&
                (item.totalQuantitySold !== undefined) &&
                (item.totalRevenue !== undefined) &&
                (item.totalSalesCount !== undefined);
        });

        if (validData.length < data.length) {
            console.warn(`Filtered out ${data.length - validData.length} invalid items from top selling products data`);
        }

        console.log("Processed top selling products data:", validData);
        return validData;
    } catch (error) {
        console.error("Error fetching top selling products:", error);
        return [];
    }
}

// Function to display top selling products
async function displayTopSellingProducts() {
    try {
        // Get the table body
        const tableBody = document.querySelector('#top-selling-products-table tbody');
        if (!tableBody) {
            console.error("Top selling products table not found");
            return;
        }

        // Show loading message
        tableBody.innerHTML = '<tr><td colspan="4">Loading top selling products...</td></tr>';

        try {
            // Fetch the data
            const allProducts = await fetchTopSellingProducts();

            // Debug: Log the actual data received
            console.log("Top products data received:", allProducts);

            // Clear the table
            tableBody.innerHTML = '';

            // Check if we have data
            if (!allProducts || !Array.isArray(allProducts) || allProducts.length === 0) {
                // No sales data at all
                tableBody.innerHTML = '<tr><td colspan="4">No sales data available yet. Start making sales to see top selling products here.</td></tr>';
                console.log("No sales data available at all");
                return;
            }

            // Sort products by quantity sold in descending order
            const sortedProducts = [...allProducts].sort((a, b) => {
                const quantityA = parseInt(a.totalQuantitySold) || 0;
                const quantityB = parseInt(b.totalQuantitySold) || 0;
                return quantityB - quantityA; // Descending order
            });

            // Get only the top 3 products
            const topThreeProducts = sortedProducts.slice(0, 3);
            
            console.log("Top 3 highest selling products by quantity:", topThreeProducts);

            // Populate the table with the top 3 products
            topThreeProducts.forEach((item, index) => {
                const row = tableBody.insertRow();
                
                // Highlight the top product
                if (index === 0) {
                    row.className = 'top-product';
                }

                // Add product name
                const nameCell = row.insertCell();
                nameCell.textContent = item?.product?.name || 'Unknown Product';

                // Add quantity
                const quantityCell = row.insertCell();
                quantityCell.textContent = item.totalQuantitySold || '0';

                // Add revenue
                const revenueCell = row.insertCell();
                revenueCell.textContent = `$${parseFloat(item.totalRevenue || 0).toFixed(2)}`;

                // Add sales count
                const countCell = row.insertCell();
                countCell.textContent = item.totalSalesCount || '0';
            });
            
            // If we have fewer than 3 products, add a message
            if (topThreeProducts.length < 3) {
                const remainingRows = 3 - topThreeProducts.length;
                for (let i = 0; i < remainingRows; i++) {
                    const row = tableBody.insertRow();
                    const cell = row.insertCell();
                    cell.colSpan = 4;
                    cell.textContent = 'Not enough sales data yet';
                    cell.style.textAlign = 'center';
                    cell.style.fontStyle = 'italic';
                }
            }
            
            console.log(`Populated top selling products table with ${topThreeProducts.length} rows`);
        } catch (innerError) {
            console.error("Error fetching top selling products data:", innerError);
            tableBody.innerHTML = `<tr><td colspan="4">Error loading top selling products: ${innerError.message}. Please try again later.</td></tr>`;
            return;
        }
    } catch (error) {
    console.error("Error displaying top selling products:", error);
    const tableBody = document.querySelector('#top-selling-products-table tbody');
    if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="4">Error loading top selling products: ${error.message}</td></tr>`;
    }
}
}
