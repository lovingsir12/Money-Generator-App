// ============================================
// Money Flow Dashboard - Frontend Application
// ============================================

const API_BASE = '/api';

// State
let categories = [];
let trendChart = null;
let categoryChart = null;

// DOM Elements
const views = {
    dashboard: document.getElementById('dashboardView'),
    transactions: document.getElementById('transactionsView'),
    goals: document.getElementById('goalsView')
};

const modals = {
    transaction: document.getElementById('transactionModal'),
    goal: document.getElementById('goalModal'),
    updateGoal: document.getElementById('updateGoalModal')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initModals();
    initForms();
    loadCategories();
    loadDashboard();
    setCurrentDate();
});

// Set current date
function setCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
    document.getElementById('date').valueAsDate = now;
}

// Navigation
function initNavigation() {
    document.querySelectorAll('.nav-item, .view-all').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = link.dataset.view;
            switchView(viewName);
        });
    });
}

function switchView(viewName) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Update views
    Object.entries(views).forEach(([name, el]) => {
        el.classList.toggle('active', name === viewName);
    });

    // Load view data
    if (viewName === 'dashboard') loadDashboard();
    if (viewName === 'transactions') loadTransactions();
    if (viewName === 'goals') loadGoals();
}

// Modals
function initModals() {
    // Quick add button
    document.getElementById('quickAddBtn').addEventListener('click', () => openModal('transaction'));
    document.getElementById('addTransactionBtn').addEventListener('click', () => openModal('transaction'));
    document.getElementById('addGoalBtn').addEventListener('click', () => openModal('goal'));

    // Close buttons
    document.querySelectorAll('.modal-close, .modal-cancel, .modal-backdrop').forEach(el => {
        el.addEventListener('click', closeAllModals);
    });

    // Stop propagation on modal content
    document.querySelectorAll('.modal-content').forEach(el => {
        el.addEventListener('click', e => e.stopPropagation());
    });
}

function openModal(type) {
    modals[type].classList.add('active');
    if (type === 'transaction') {
        updateCategoryOptions();
        document.getElementById('date').valueAsDate = new Date();
    }
}

function closeAllModals() {
    Object.values(modals).forEach(modal => modal.classList.remove('active'));
}

// Forms
function initForms() {
    // Transaction type toggle
    document.querySelectorAll('input[name="type"]').forEach(radio => {
        radio.addEventListener('change', updateCategoryOptions);
    });

    // Transaction form
    document.getElementById('transactionForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        try {
            await fetch(`${API_BASE}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            closeAllModals();
            e.target.reset();
            document.getElementById('date').valueAsDate = new Date();
            loadDashboard();
            if (views.transactions.classList.contains('active')) loadTransactions();
        } catch (error) {
            console.error('Failed to add transaction:', error);
        }
    });

    // Goal form
    document.getElementById('goalForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        try {
            await fetch(`${API_BASE}/goals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            closeAllModals();
            e.target.reset();
            loadDashboard();
            if (views.goals.classList.contains('active')) loadGoals();
        } catch (error) {
            console.error('Failed to add goal:', error);
        }
    });

    // Update goal form
    document.getElementById('updateGoalForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('updateGoalId').value;
        const current_amount = document.getElementById('updateCurrentAmount').value;

        try {
            await fetch(`${API_BASE}/goals/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_amount: parseFloat(current_amount) })
            });

            closeAllModals();
            loadDashboard();
            if (views.goals.classList.contains('active')) loadGoals();
        } catch (error) {
            console.error('Failed to update goal:', error);
        }
    });

    // Transaction filter
    document.getElementById('transactionFilter').addEventListener('change', loadTransactions);
}

// Load categories
async function loadCategories() {
    try {
        const res = await fetch(`${API_BASE}/categories`);
        categories = await res.json();
        updateCategoryOptions();
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

function updateCategoryOptions() {
    const type = document.querySelector('input[name="type"]:checked').value;
    const select = document.getElementById('category');
    const filtered = categories.filter(c => c.type === type);

    select.innerHTML = filtered.map(c =>
        `<option value="${c.name}">${c.icon} ${c.name}</option>`
    ).join('');
}

// Load Dashboard
async function loadDashboard() {
    try {
        const res = await fetch(`${API_BASE}/dashboard`);
        const data = await res.json();

        // Update stats
        document.getElementById('monthlyIncome').textContent = formatCurrency(data.monthlyIncome);
        document.getElementById('monthlyExpense').textContent = formatCurrency(data.monthlyExpense);
        document.getElementById('monthlyBalance').textContent = formatCurrency(data.monthlyBalance);
        document.getElementById('allTimeBalance').textContent = formatCurrency(data.allTimeBalance);

        // Update recent transactions
        renderTransactions(data.recentTransactions, 'recentTransactions');

        // Update goals preview
        renderGoals(data.goals.slice(0, 3), 'goalsPreview');

        // Update charts
        renderTrendChart(data.monthlyTrend);
        renderCategoryChart(data.expenseByCategory);
    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }
}

// Load all transactions
async function loadTransactions() {
    const filterType = document.getElementById('transactionFilter').value;
    try {
        let url = `${API_BASE}/transactions?limit=100`;
        if (filterType) url += `&type=${filterType}`;

        const res = await fetch(url);
        const transactions = await res.json();
        renderTransactions(transactions, 'allTransactions', true);
    } catch (error) {
        console.error('Failed to load transactions:', error);
    }
}

// Load all goals
async function loadGoals() {
    try {
        const res = await fetch(`${API_BASE}/goals`);
        const goals = await res.json();
        renderGoals(goals, 'allGoals', true);
    } catch (error) {
        console.error('Failed to load goals:', error);
    }
}

// Render transactions
function renderTransactions(transactions, containerId, showActions = false) {
    const container = document.getElementById(containerId);

    if (transactions.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💳</div>
        <p class="empty-state-text">No transactions yet. Add your first one!</p>
      </div>
    `;
        return;
    }

    container.innerHTML = transactions.map(t => `
    <div class="transaction-item">
      <div class="transaction-icon" style="background: ${t.color || '#6366f1'}20;">
        ${t.icon || '💰'}
      </div>
      <div class="transaction-info">
        <div class="transaction-category">${t.category}</div>
        <div class="transaction-description">${t.description || 'No description'}</div>
      </div>
      <div class="transaction-meta">
        <div class="transaction-amount ${t.type}">
          ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
        </div>
        <div class="transaction-date">${formatDate(t.date)}</div>
      </div>
      ${showActions ? `
        <div class="transaction-actions">
          <button class="delete-btn" onclick="deleteTransaction(${t.id})">Delete</button>
        </div>
      ` : ''}
    </div>
  `).join('');
}

// Render goals
function renderGoals(goals, containerId, showActions = false) {
    const container = document.getElementById(containerId);

    if (goals.length === 0) {
        container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-state-icon">🎯</div>
        <p class="empty-state-text">No savings goals yet. Set your first one!</p>
      </div>
    `;
        return;
    }

    container.innerHTML = goals.map(g => {
        const percentage = Math.min(100, (g.current_amount / g.target_amount) * 100);
        return `
      <div class="goal-card" style="--goal-color: ${g.color};">
        <div class="goal-header">
          <div class="goal-name">${g.name}</div>
          ${g.deadline ? `<div class="goal-deadline">📅 ${formatDate(g.deadline)}</div>` : ''}
        </div>
        <div class="goal-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${percentage}%; background: ${g.color};"></div>
          </div>
        </div>
        <div class="goal-stats">
          <div class="goal-amounts">
            <span class="goal-current">${formatCurrency(g.current_amount)}</span>
            <span class="goal-target"> / ${formatCurrency(g.target_amount)}</span>
          </div>
          <div class="goal-percentage">${percentage.toFixed(0)}%</div>
        </div>
        ${showActions ? `
          <div class="goal-actions">
            <button class="update-goal-btn" onclick="openUpdateGoal(${g.id}, ${g.current_amount})">Update Progress</button>
            <button class="delete-goal-btn" onclick="deleteGoal(${g.id})">Delete</button>
          </div>
        ` : ''}
      </div>
    `;
    }).join('');
}

// Charts
function renderTrendChart(data) {
    const ctx = document.getElementById('trendChart').getContext('2d');

    if (trendChart) trendChart.destroy();

    const labels = data.map(d => {
        const [year, month] = d.month.split('-');
        return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short' });
    });

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Income',
                    data: data.map(d => d.income),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: '#10b981'
                },
                {
                    label: 'Expenses',
                    data: data.map(d => d.expense),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: '#ef4444'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#a0a0b0', font: { family: 'Inter' } }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#6b6b7b' }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: {
                        color: '#6b6b7b',
                        callback: value => '$' + value.toLocaleString()
                    }
                }
            }
        }
    });
}

function renderCategoryChart(data) {
    const ctx = document.getElementById('categoryChart').getContext('2d');

    if (categoryChart) categoryChart.destroy();

    if (data.length === 0) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.font = '14px Inter';
        ctx.fillStyle = '#6b6b7b';
        ctx.textAlign = 'center';
        ctx.fillText('No expense data yet', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => `${d.icon} ${d.category}`),
            datasets: [{
                data: data.map(d => d.total),
                backgroundColor: data.map(d => d.color || '#6366f1'),
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#a0a0b0',
                        font: { family: 'Inter', size: 11 },
                        padding: 10,
                        boxWidth: 12
                    }
                }
            }
        }
    });
}

// Delete functions
async function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
        await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
        loadDashboard();
        loadTransactions();
    } catch (error) {
        console.error('Failed to delete transaction:', error);
    }
}

async function deleteGoal(id) {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
        await fetch(`${API_BASE}/goals/${id}`, { method: 'DELETE' });
        loadDashboard();
        loadGoals();
    } catch (error) {
        console.error('Failed to delete goal:', error);
    }
}

// Update goal modal
function openUpdateGoal(id, currentAmount) {
    document.getElementById('updateGoalId').value = id;
    document.getElementById('updateCurrentAmount').value = currentAmount;
    modals.updateGoal.classList.add('active');
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
}
