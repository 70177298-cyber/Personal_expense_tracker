/* ========================================
   EXPENSE TRACKER - JAVASCRIPT
   Easy to understand code with clear comments
   ======================================== */

// ========================================
// 1. DOM ELEMENTS - References to HTML elements
// ========================================

const expenseForm = document.getElementById('expenseForm');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const descriptionInput = document.getElementById('description');
const dateInput = document.getElementById('date');
const categoryFilterSelect = document.getElementById('categoryFilter');
const expensesContainer = document.getElementById('expensesContainer');
const totalSpentElement = document.getElementById('totalSpent');
const expenseCountElement = document.getElementById('expenseCount');
const avgExpenseElement = document.getElementById('avgExpense');

// ========================================
// 2. STATE - Data management
// ========================================

// Array to store all expenses
let expenses = [];

// Chart instances for updates
let categoryChart = null;
let trendsChart = null;

// ========================================
// 3. INITIALIZATION - Run when page loads
// ========================================

function initializeApp() {
    // Set today's date in the date input
    dateInput.valueAsDate = new Date();

    // Load expenses from browser storage
    loadExpenses();

    // Display all data on page load
    updateDisplay();
}

// ========================================
// 4. DATA MANAGEMENT - Save and load data
// ========================================

/**
 * Load expenses from localStorage
 * localStorage keeps data even after browser closes
 */
function loadExpenses() {
    const savedData = localStorage.getItem('expenses');
    expenses = savedData ? JSON.parse(savedData) : [];
}

/**
 * Save expenses to localStorage
 */
function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// ========================================
// 5. EVENT LISTENERS - Handle user actions
// ========================================

// When user submits the form to add expense
expenseForm.addEventListener('submit', (event) => {
    event.preventDefault();

    // Create new expense object
    const newExpense = {
        id: Date.now(), // Unique ID using timestamp
        amount: parseFloat(amountInput.value),
        category: categoryInput.value,
        description: descriptionInput.value,
        date: dateInput.value
    };

    // Add to expenses array
    expenses.push(newExpense);

    // Save to browser storage
    saveExpenses();

    // Clear form for next entry
    expenseForm.reset();
    dateInput.valueAsDate = new Date();

    // Update all displays
    updateDisplay();
});

// When user changes the category filter
categoryFilterSelect.addEventListener('change', () => {
    updateDisplay();
});

// ========================================
// 6. EXPENSE OPERATIONS - Add, delete, filter
// ========================================

/**
 * Delete an expense by ID
 * @param {number} id - The expense ID to delete
 */
function deleteExpense(id) {
    // Ask user to confirm
    if (confirm('Are you sure you want to delete this expense?')) {
        // Remove expense from array
        expenses = expenses.filter(expense => expense.id !== id);

        // Save changes
        saveExpenses();

        // Refresh display
        updateDisplay();
    }
}

/**
 * Get filtered expenses based on selected category
 * @returns {array} Filtered expenses array
 */
function getFilteredExpenses() {
    const selectedCategory = categoryFilterSelect.value;

    // If no category selected, return all expenses
    if (!selectedCategory) {
        return expenses;
    }

    // Return only expenses matching selected category
    return expenses.filter(expense => expense.category === selectedCategory);
}

// ========================================
// 7. DISPLAY UPDATES - Update UI with data
// ========================================

/**
 * Update all displays on the page
 * Called whenever data changes
 */
function updateDisplay() {
    updateStatistics();
    updateExpensesTable();
    updateCharts();
}

/**
 * Update the statistics boxes (Total, Count, Average)
 */
function updateStatistics() {
    const filtered = getFilteredExpenses();

    // Calculate total amount
    const total = filtered.reduce((sum, expense) => sum + expense.amount, 0);

    // Count number of expenses
    const count = filtered.length;

    // Calculate average
    const average = count > 0 ? total / count : 0;

    // Update HTML with calculated values
    totalSpentElement.textContent = `₨${total.toFixed(2)}`;
    expenseCountElement.textContent = count;
    avgExpenseElement.textContent = `₨${average.toFixed(2)}`;
}

/**
 * Update the expenses table with current data
 */
function updateExpensesTable() {
    const filtered = getFilteredExpenses();

    // Sort by newest date first
    const sorted = filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Show message if no expenses
    if (sorted.length === 0) {
        expensesContainer.innerHTML = '<div class="no-data">No expenses found</div>';
        return;
    }

    // Build HTML table
    let html = `
        <table class="expenses-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Add each expense as a table row
    sorted.forEach(expense => {
        const categoryClass = `cat-${expense.category.toLowerCase()}`;
        const formattedDate = new Date(expense.date).toLocaleDateString();

        html += `
            <tr>
                <td>${formattedDate}</td>
                <td><span class="category-badge ${categoryClass}">${expense.category}</span></td>
                <td>${expense.description || '—'}</td>
                <td class="amount">₨${expense.amount.toFixed(2)}</td>
                <td><button class="btn btn--delete" onclick="deleteExpense(${expense.id})">Delete</button></td>
            </tr>
        `;
    });

    html += '</tbody></table>';

    // Insert into page
    expensesContainer.innerHTML = html;
}

// ========================================
// 8. CHARTS - Display visual data
// ========================================

/**
 * Update both charts
 */
function updateCharts() {
    updateCategoryChart();
    updateTrendsChart();
}

/**
 * Update the category pie chart
 * Shows spending breakdown by category
 */
function updateCategoryChart() {
    // Calculate total for each category
    const categories = {};
    expenses.forEach(expense => {
        categories[expense.category] = (categories[expense.category] || 0) + expense.amount;
    });

    // Get canvas element
    const ctx = document.getElementById('categoryChart').getContext('2d');

    // Destroy old chart if it exists
    if (categoryChart) {
        categoryChart.destroy();
    }

    // Create new chart
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: [
                    '#f39c12', '#3498db', '#9b59b6', '#1abc9c',
                    '#e74c3c', '#16a085', '#95a5a6'
                ],
                borderColor: 'white',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

/**
 * Update the trends line chart
 * Shows spending over the last 7 days
 */
function updateTrendsChart() {
    // Create object for last 7 days
    const last7Days = {};
    const today = new Date();

    // Initialize each day with 0
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        last7Days[dateString] = 0;
    }

    // Add expenses to corresponding dates
    expenses.forEach(expense => {
        if (last7Days.hasOwnProperty(expense.date)) {
            last7Days[expense.date] += expense.amount;
        }
    });

    // Get canvas element
    const ctx = document.getElementById('trendsChart').getContext('2d');

    // Destroy old chart if it exists
    if (trendsChart) {
        trendsChart.destroy();
    }

    // Create new chart
    trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            // Format dates for display (e.g., "Jun 20")
            labels: Object.keys(last7Days).map(dateStr => {
                return new Date(dateStr).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                });
            }),
            datasets: [{
                label: 'Daily Spending',
                data: Object.values(last7Days),
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#667eea'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        // Format y-axis labels with currency
                        callback: function(value) {
                            return '₨' + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
}

// ========================================
// 9. START THE APPLICATION
// ========================================

// Run initialization when page loads
initializeApp();
