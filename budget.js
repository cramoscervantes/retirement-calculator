// PRESET CATEGORIES
const PRESET_CATEGORIES = [
    'Housing',
    'Food & Groceries',
    'Transportation',
    'Utilities',
    'Insurance',
    'Subscriptions',
    'Entertainment',
    'Healthcare',
    'Savings',
    'Other'
];

const CHART_COLORS = [
    '#e94560', '#4ecca3', '#f5a623', '#a78bfa',
    '#60a5fa', '#f472b6', '#34d399', '#fb923c',
    '#818cf8', '#94a3b8'
];

// STATE
let budgetChart = null;
let budgetData = [];

// INIT
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    renderTable();
    renderCalendar();
    updateStats();

    document.getElementById('takeHomePay').addEventListener('input', () => {
        saveToStorage();
        updateStats();
    });

    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        darkModeToggle.textContent = '☀️';
    }

    darkModeToggle.addEventListener('click', () => {
        if (document.documentElement.getAttribute('data-theme') === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            darkModeToggle.textContent = '🌙';
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            darkModeToggle.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
        }
        renderChart();
    });

    // Mobile hamburger
    const navHamburger = document.getElementById('navHamburger');
    const navLinks = document.getElementById('navLinks');
    navHamburger.addEventListener('click', () => navLinks.classList.toggle('show'));
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => navLinks.classList.remove('show'));
    });
});

// STORAGE
function saveToStorage() {
    localStorage.setItem('budgetData', JSON.stringify(budgetData));
    localStorage.setItem('takeHomePay', document.getElementById('takeHomePay').value);
}

function loadFromStorage() {
    const saved = localStorage.getItem('budgetData');
    const savedPay = localStorage.getItem('takeHomePay');

    if (saved) {
        budgetData = JSON.parse(saved);
    } else {
        // Load presets with empty amounts
        budgetData = PRESET_CATEGORIES.map(name => ({
            name,
            amount: '',
            dueDate: '',
            isCustom: false
        }));
    }

    if (savedPay) {
        document.getElementById('takeHomePay').value = savedPay;
    }
}

// RENDER TABLE
function renderTable() {
    const tbody = document.getElementById('budgetTableBody');
    tbody.innerHTML = '';

    budgetData.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                ${item.isCustom
                    ? `<input type="text" value="${item.name}" placeholder="Category name"
                        onchange="updateField(${index}, 'name', this.value)">`
                    : `<span class="budget-category-name">${item.name}</span>`
                }
            </td>
            <td>
                <input type="number" value="${item.amount}" placeholder="0.00" min="0"
                    onchange="updateField(${index}, 'amount', this.value)">
            </td>
            <td>
                <input type="number" value="${item.dueDate}" placeholder="Day (1-31)" min="1" max="31"
                    onchange="updateField(${index}, 'dueDate', this.value)">
            </td>
            <td>
                ${item.isCustom
                    ? `<button class="btn-remove-row" onclick="removeCategory(${index})">✕</button>`
                    : ''
                }
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ADD / REMOVE CATEGORIES
function addCustomCategory() {
    budgetData.push({ name: '', amount: '', dueDate: '', isCustom: true });
    renderTable();
    saveToStorage();
}

function removeCategory(index) {
    budgetData.splice(index, 1);
    renderTable();
    renderCalendar();
    renderChart();
    updateStats();
    saveToStorage();
}

// UPDATE FIELD
function updateField(index, field, value) {
    budgetData[index][field] = value;
    renderCalendar();
    renderChart();
    updateStats();
    saveToStorage();
}

// STATS
function updateStats() {
    const takeHome = parseFloat(document.getElementById('takeHomePay').value) || 0;
    const total = budgetData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const remaining = takeHome - total;
    const savingsRow = budgetData.find(i => i.name === 'Savings');
    const savingsAmt = parseFloat(savingsRow?.amount) || 0;
    const savingsRate = takeHome > 0 ? ((savingsAmt / takeHome) * 100).toFixed(1) : 0;

    const fmt = (n) => '$' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    document.getElementById('totalBudgeted').textContent  = fmt(total);
    document.getElementById('totalRemaining').textContent = fmt(remaining);
    document.getElementById('savingsRate').textContent    = savingsRate + '%';

    // Color remaining red if over budget
    const remainingEl = document.getElementById('totalRemaining');
    remainingEl.style.color = remaining < 0
        ? 'var(--color-primary)'
        : 'var(--color-accent-success)';

    renderChart();
}

// DONUT CHART
function renderChart() {
    const filled = budgetData.filter(i => parseFloat(i.amount) > 0);
    const labels  = filled.map(i => i.name);
    const amounts = filled.map(i => parseFloat(i.amount));
    const colors  = filled.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    if (budgetChart) budgetChart.destroy();

    const ctx = document.getElementById('budgetChart').getContext('2d');
    budgetChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: amounts,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: isDark ? '#1a1a2e' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const val = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = ((val / total) * 100).toFixed(1);
                            return ` $${val.toLocaleString()} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });

    // Custom legend
    const legendEl = document.getElementById('budgetChartLegend');
    legendEl.innerHTML = filled.map((item, i) => `
        <div class="legend-item">
            <span class="legend-dot" style="background:${colors[i]}"></span>
            <span>${item.name} — $${parseFloat(item.amount).toLocaleString()}</span>
        </div>
    `).join('');
}

// CALENDAR
function renderCalendar() {
    const cal = document.getElementById('budgetCalendar');
    cal.innerHTML = '';

    // Day headers
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        cal.appendChild(header);
    });

    // Build expense map by due date
    const expenseMap = {};
    budgetData.forEach(item => {
        const day = parseInt(item.dueDate);
        if (day >= 1 && day <= 31 && parseFloat(item.amount) > 0) {
            if (!expenseMap[day]) expenseMap[day] = [];
            expenseMap[day].push(item);
        }
    });

    // Render days 1–31
    for (let day = 1; day <= 31; day++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day';

        const dayNum = document.createElement('div');
        dayNum.className = 'calendar-day-number';
        dayNum.textContent = day;
        cell.appendChild(dayNum);

        if (expenseMap[day]) {
            expenseMap[day].forEach(item => {
                const badge = document.createElement('span');
                badge.className = 'calendar-expense-badge';
                badge.textContent = item.name;
                badge.title = `${item.name}: $${parseFloat(item.amount).toLocaleString()}`;
                cell.appendChild(badge);
            });
        }

        cal.appendChild(cell);
    }
}

// RETIREMENT IMPACT
function sendToRetirement() {
    const takeHome    = parseFloat(document.getElementById('takeHomePay').value) || 0;
    const savingsRow  = budgetData.find(i => i.name === 'Savings');
    const savingsAmt  = parseFloat(savingsRow?.amount) || 0;
    const monthlyContrib = savingsAmt;

    if (monthlyContrib <= 0 || takeHome <= 0) {
        alert('Please enter your take-home pay and a Savings amount first.');
        return;
    }

    // Store values for the calculator to pick up
    localStorage.setItem('budgetToRetirement', JSON.stringify({ monthlyContrib }));
    window.location.href = 'index.html';
}
