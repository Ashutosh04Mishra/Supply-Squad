// import { checkAuth, logout } from "./auth.js";

// window.onload = checkAuth();
// const logoutBtn = document.getElementById("logout-btn");
// if (logoutBtn) {
//     logoutBtn.addEventListener("click", logout);
// }

// async function fetchData(url) {
//     try {
//         const token = localStorage.getItem("token");
//         const response = await fetch(url, {
//             headers: {
//                 Authorization: `Bearer ${token}`,
//             },
//         });
//         if (!response.ok) {
//             throw new Error(`HTTP error! Status: ${response.status}`);
//         }
//         return await response.json();
//     } catch (error) {
//         console.error("Failed to fetch data:", error);
//         window.location.href = "login.html";
//     }
// }

// async function displayStockHistory() {
//     const history = await fetchData("http://localhost:3000/api/reports/stock-history");
//     const products = await fetchData("http://localhost:3000/api/products");
//     const users = await fetchData("http://localhost:3000/api/auth/users");

//     const productFilter = document.getElementById("product-filter");
//     const userFilter = document.getElementById("user-filter");
//     const historyTable = document.getElementById("stock-history-table").getElementsByTagName("tbody")[0];

//     products.forEach((product) => {
//         const option = document.createElement("option");
//         option.value = product.id;
//         option.textContent = product.name;
//         productFilter.appendChild(option);
//     });

//     users.forEach((user) => {
//         const option = document.createElement("option");
//         option.value = user.id;
//         option.textContent = user.username;
//         userFilter.appendChild(option);
//     });

//     function populateHistoryTable(historyData) {
//         historyTable.innerHTML = "";
//         historyData.forEach((record) => {
//             const row = historyTable.insertRow();
//             row.insertCell().textContent = record.id;
//             row.insertCell().textContent = record.product.name;
//             row.insertCell().textContent = record.user.username;
//             row.insertCell().textContent = record.oldQuantity;
//             row.insertCell().textContent = record.newQuantity;
//             row.insertCell().textContent = record.transactionType;
//             row.insertCell().textContent = new Date(record.timestamp).toLocaleString();
//         });
//     }

//     populateHistoryTable(history);

//     document.getElementById("search-input").addEventListener("input", (event) => {
//         const searchTerm = event.target.value.toLowerCase();
//         const filteredHistory = history.filter((record) => {
//             return (
//                 record.product.name.toLowerCase().includes(searchTerm) ||
//                 record.user.username.toLowerCase().includes(searchTerm) ||
//                 record.transactionType.toLowerCase().includes(searchTerm)
//             );
//         });
//         populateHistoryTable(filteredHistory);
//     });

//     productFilter.addEventListener("change", (event) => {
//         const selectedProductId = parseInt(event.target.value);
//         if (selectedProductId) {
//             const filteredHistory = history.filter((record) => record.productId === selectedProductId);
//             populateHistoryTable(filteredHistory);
//         } else {
//             populateHistoryTable(history);
//         }
//     });

//     userFilter.addEventListener("change", (event) => {
//         const selectedUserId = parseInt(event.target.value);
//         if (selectedUserId) {
//             const filteredHistory = history.filter((record) => record.userId === selectedUserId);
//             populateHistoryTable(filteredHistory);
//         } else {
//             populateHistoryTable(history);
//         }
//     });
// }

// displayStockHistory();