// Initialize date input with today's date
document.getElementById('date').valueAsDate = new Date();

// Expenses array
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

// Chart instances
let categoryChart = null;
let trendsChart = null;

// Form submission
document.getElementById('expenseForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const expense = {
        id: Date.now(),
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        description: document.getElementById('description').value,
        date: document.getElementById('date').value
    };

    expenses.push(expense);
    localStorage.setItem('expenses', JSON.stringify(expenses));

    // Reset form
    document.getElementById('expenseForm').reset();
    document.getElementById('date').valueAsDate = new Date();

    updateDisplay();
});

// Delete expense
function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(exp => exp.id !== id);
        localStorage.setItem('expenses', JSON.stringify(expenses));
        updateDisplay();
    }
}

// Update all displays
function updateDisplay() {
    updateStats();
    updateExpensesTable();
    updateCharts();
}

// Update statistics
function updateStats() {
    const filtered = getFilteredExpenses();
    const total = filtered.reduce((sum, exp) => sum + exp.amount, 0);
    const count = filtered.length;
    const average = count > 0 ? total / count : 0;

    document.getElementById('totalSpent').textContent = `₨${total.toFixed(2)}`;
    document.getElementById('expenseCount').textContent = count;
    document.getElementById('avgExpense').textContent = `₨${average.toFixed(2)}`;
}

// Get filtered expenses
function getFilteredExpenses() {
    const selectedCategory = document.getElementById('categoryFilter').value;
    if (!selectedCategory) return expenses;
    return expenses.filter(exp => exp.category === selectedCategory);
}

// Update expenses table
function updateExpensesTable() {
    const filtered = getFilteredExpenses();
    const sorted = filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (sorted.length === 0) {
        document.getElementById('expensesContainer').innerHTML = 
            '<div class="no-data">No expenses found</div>';
        return;
    }

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

    sorted.forEach(exp => {
        const catClass = `cat-${exp.category.toLowerCase()}`;
        html += `
            <tr>
                <td>${new Date(exp.date).toLocaleDateString()}</td>
                <td><span class="category-badge ${catClass}">${exp.category}</span></td>
                <td>${exp.description || '—'}</td>
                <td class="amount">₨${exp.amount.toFixed(2)}</td>
                <td><button class="delete-btn" onclick="deleteExpense(${exp.id})">Delete</button></td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    document.getElementById('expensesContainer').innerHTML = html;
}

// Update charts
function updateCharts() {
    updateCategoryChart();
    updateTrendsChart();
}

// Category chart
function updateCategoryChart() {
    const categories = {};
    expenses.forEach(exp => {
        categories[exp.category] = (categories[exp.category] || 0) + exp.amount;
    });

    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    if (categoryChart) {
        categoryChart.destroy();
    }

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

// Trends chart
function updateTrendsChart() {
    const last7Days = {};
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last7Days[dateStr] = 0;
    }

    expenses.forEach(exp => {
        if (last7Days.hasOwnProperty(exp.date)) {
            last7Days[exp.date] += exp.amount;
        }
    });

    const ctx = document.getElementById('trendsChart').getContext('2d');
    
    if (trendsChart) {
        trendsChart.destroy();
    }

    trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(last7Days).map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
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
                        callback: function(value) {
                            return '₨' + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
}

// Filter change event
document.getElementById('categoryFilter').addEventListener('change', () => {
    updateDisplay();
});

// Initial display
updateDisplay();
