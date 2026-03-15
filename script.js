let retirementChart = null;

function isDarkMode() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
}

const DEFAULTS = {
  currentAge: 25,
  retirementAge: 65,
  lifeExpectancy: 95,
  currentSavings: 5000,
  monthlyContribution: 500,
  preReturnRate: 7,
  postReturnRate: 5,
  inflationRate: 3,
  retirementBudget: 80,
  currentIncome: 60000,
  otherIncome: 1500
};

function loadDefaults() {
  document.getElementById('currentAge').value = DEFAULTS.currentAge;
  document.getElementById('retirementAge').value = DEFAULTS.retirementAge;
  document.getElementById('lifeExpectancy').value = DEFAULTS.lifeExpectancy;
  document.getElementById('currentSavings').value = DEFAULTS.currentSavings;
  document.getElementById('monthlyContribution').value = DEFAULTS.monthlyContribution;
  document.getElementById('preReturnRate').value = DEFAULTS.preReturnRate;
  document.getElementById('postReturnRate').value = DEFAULTS.postReturnRate;
  document.getElementById('inflationRate').value = DEFAULTS.inflationRate;
  document.getElementById('retirementBudget').value = DEFAULTS.retirementBudget;
  document.getElementById('currentIncome').value = DEFAULTS.currentIncome;
  document.getElementById('otherIncome').value = DEFAULTS.otherIncome;
}

document.addEventListener('DOMContentLoaded', () => {
  loadDefaults();
  calculate();

  // Mobile Hamburget bar behavior
  const navHamburger = document.getElementById('navHamburger');
  const navLinks = document.getElementById('navLinks');

  navHamburger.addEventListener('click', () => {
    navLinks.classList.toggle('show');
  });

  // Auto-close menu when nav link is clicked
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('show');
    });
  });

  // Dark mode toggle
  const darkModeToggle = document.getElementById('darkModeToggle');

  // Load saved preference
  if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    darkModeToggle.textContent = '☀️';
  }

  darkModeToggle.addEventListener('click', () => {
    if (isDarkMode()) {
        document.documentElement.removeAttribute('data-theme');
        darkModeToggle.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        darkModeToggle.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    }

    // Re-render chart with new colors
    calculate();
  })
});


function calculate() {
    // Grab input values
    const currentAge = parseFloat(document.getElementById('currentAge').value);
    const retirementAge = parseFloat(document.getElementById('retirementAge').value);
    const lifeExpectancy = parseFloat(document.getElementById('lifeExpectancy').value);
    const currentSavings = parseFloat(document.getElementById('currentSavings').value);
    const monthlyContribution = parseFloat(document.getElementById('monthlyContribution').value);
    const preReturnRate = parseFloat(document.getElementById('preReturnRate').value / 100);
    const postReturnRate = parseFloat(document.getElementById('postReturnRate').value / 100);
    const inflationRate = parseFloat(document.getElementById('inflationRate').value / 100);
    const retirementBudget = parseFloat(document.getElementById('retirementBudget').value / 100);
    const currentIncome = parseFloat(document.getElementById('currentIncome').value);
    const otherIncome = parseFloat(document.getElementById('otherIncome').value);

    // Basic Validation
    if (isNaN(currentAge) || isNaN(retirementAge) || isNaN(lifeExpectancy) ||
        isNaN(currentSavings) || isNaN(monthlyContribution) || isNaN(preReturnRate) ||
        isNaN(postReturnRate) || isNaN(inflationRate) || isNaN(retirementBudget) ||
        isNaN(currentIncome) || isNaN(otherIncome)) {
        alert('Please fill in ALL fields before calculating.');
        return;
    }

    if (retirementAge <= currentAge) {
        alert('Retirement age must be greater than your current age.');
        return;
    }

    if (lifeExpectancy <= retirementAge) {
        alert('Retirement age must be greater than current age.');
        return;
    }

    // Core Calculations
    // Pre Retirement Phase
    const yearsToRetirement = retirementAge - currentAge;
    const monthsToRetirement = yearsToRetirement * 12;
    const monthlyPreRate = preReturnRate / 12;

    // Future value formula: FV = P(1+r)^n + PMT * [((1+r)^n - 1) / r]
    const futureValueSavings = currentSavings * Math.pow(1 + monthlyPreRate, monthsToRetirement);
    const futureValueContributions = monthlyPreRate === 0
        ? monthlyContribution * monthsToRetirement
        : monthlyContribution * ((Math.pow(1 + monthlyPreRate, monthsToRetirement) - 1) / monthlyPreRate);
    
    const nominalSavingsAtRetirement = futureValueSavings + futureValueContributions;

    // Adjust for inflation
    const inflationAdjustedSavings = nominalSavingsAtRetirement / Math.pow(1 + inflationRate, yearsToRetirement);

    // Post Retirement Phase
    const yearsInRetirement = lifeExpectancy - retirementAge;
    const monthsInRetirement = yearsInRetirement * 12

    // Monthly Spending Need (in today's dollars)
    const monthlySpendingNeed = ((currentIncome / 12) * retirementBudget) - otherIncome;

    // Monthly Spending need infalted to retirement date
    const inflatedMonthlyNeed = monthlySpendingNeed * Math.pow(1 + inflationRate, yearsToRetirement);

    // Can the portfolio sustain withdrawls> Using post-retirement return rate
    const monthlyPostRate = postReturnRate / 12;
    const sustainableMonthlyWithdrawal = monthlyPostRate === 0
        ? nominalSavingsAtRetirement / monthsInRetirement
        : (nominalSavingsAtRetirement * monthlyPostRate) / (1 - Math.pow(1 + monthlyPostRate, -monthsInRetirement));

    // Surplus or Deficit
    const monthlySurplusDeficit = sustainableMonthlyWithdrawal - inflatedMonthlyNeed;
    const isSufficient = monthlySurplusDeficit >= 0

    // Total contributions
    const totalContributions = currentSavings + (monthlyContribution * monthsToRetirement);
    const interestEarned = nominalSavingsAtRetirement - totalContributions

    // console.log("futureValueSavings:", futureValueSavings);
    // console.log("futureValueContributions:", futureValueContributions);
    // console.log("totalSavings:", totalSavings);
    // console.log("totalContributions:", totalContributions);
    // console.log("interestEarned:", interestEarned);

    // Display results
    const fmt = (n) => '$' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    document.getElementById('yearsResult').textContent = yearsToRetirement + ' years';
    document.getElementById('contributionsResult').textContent = fmt(totalContributions);
    document.getElementById('interestResult').textContent = fmt(interestEarned);
    document.getElementById('totalResult').textContent = fmt(nominalSavingsAtRetirement);
    document.getElementById('inflationAdjustedResult').textContent = fmt(inflationAdjustedSavings);
    document.getElementById('monthlyWithdrawalResult').textContent = fmt(sustainableMonthlyWithdrawal);
    document.getElementById('monthlyNeedResult').textContent = fmt(inflatedMonthlyNeed);
    document.getElementById('surplusDeficitResult').textContent = (isSufficient ? '+' : '-') + fmt(Math.abs(monthlySurplusDeficit));
    document.getElementById('sufficiencyResult').textContent = isSufficient ? 'On Track' : 'Shortfall';
    
    switchTab('graph');

    // Render Chart
    renderChart(currentAge, retirementAge, lifeExpectancy, currentSavings, monthlyContribution, monthlyPreRate, monthlyPostRate, inflatedMonthlyNeed, inflationRate);
}

function clearForm() {
    loadDefaults();
    calculate();
}

function renderChart(currentAge, retirementAge, lifeExpectancy, currentSavings, monthlyContribution, monthlyPreRate, monthlyPostRate, inflatedMonthlyNeed, inflationRate) {
    const labels = [];
    const nominalData = [];
    const inflationAdjustedData = [];
    const contributionsData = [];

    let postBalance = null;

    for (let age = currentAge; age <= lifeExpectancy; age++) {
        const yearsElapsed = age - currentAge;
        const monthsElapsed = yearsElapsed * 12;

        labels.push(age);
        if (age <= retirementAge) {
            contributionsData.push((currentSavings + (monthlyContribution * monthsElapsed)).toFixed(2));
        } else {
            const monthsToRetirement = (retirementAge - currentAge) * 12;
            contributionsData.push(null);
        }

        if (age <= retirementAge) {
            // Pre-retirement: balance grows
            const fvSavings = currentSavings * Math.pow(1 + monthlyPreRate, monthsElapsed);
            const fvContributions = monthlyPreRate === 0
                ? monthlyContribution * monthsElapsed
                : monthlyContribution * ((Math.pow(1 + monthlyPreRate, monthsElapsed) - 1) / monthlyPreRate);

            const nominal = fvSavings + fvContributions;
            const adjusted = nominal / Math.pow(1 + inflationRate, yearsElapsed);

            nominalData.push(nominal.toFixed(2));
            inflationAdjustedData.push(adjusted.toFixed(2));

            if (age === retirementAge) postBalance = nominal;

        } else {
            // Post-retirement: balance shrinks with withdrawals
            for (let m = 0; m < 12; m++) {
                if (postBalance > 0) {
                    postBalance = postBalance * (1 + monthlyPostRate) - inflatedMonthlyNeed
                    if (postBalance < 0) postBalance = 0;
                }
            }
            nominalData.push(postBalance.toFixed(2));
            inflationAdjustedData.push(null);
        }
    }

    // Clear old chart if one exists before drawing new one
    if (retirementChart) retirementChart.destroy();

    const ctx = document.getElementById('retirementChart').getContext('2d');

    retirementChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Projected Balance',
                    data: nominalData,
                    borderColor: '#4ecca3',
                    backgroundColor: 'rgba(78, 204, 163, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Purchasing Power (Today\'s $)',
                    data: inflationAdjustedData,
                    borderColor: '#e94560',
                    backgroundColor: 'rgba(233, 69, 96, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Your Total Contributions',
                    data: contributionsData,
                    borderColor: '#f5a623',
                    backgroundColor: 'rgba(245, 166, 35, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { 
                    color: isDarkMode() ? '#e0e0e0' : '#1a1a2e' 
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => ' $' + Number(context.raw).toLocaleString()
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: isDarkMode() ? '#e0e0e0' : '#1a1a2e',
                        callback: function(value, index) {
                            return index % 5 === 0 ? this.getLabelForValue(value) : '';
                        },
                        maxRotation: 0,
                        autoSkip: false
                    },
                    grid: { display: false }
                },
                y: {
                    ticks: {
                        color: isDarkMode() ? 'e0e0e0' : '#1a1a2e',
                        callback: (value) => '$' + Number(value).toLocaleString()
                    },
                    grid: {
                        color: isDarkMode() ? '#2a2a4a' : '#e8e8e8',
                        lineWidth: 0.8
                    }
                }
            }
        }
    });

    document.getElementById('chartPanel').style.display = 'flex';

    // Banner Message
    const banner = document.getElementById('chartBanner');
    const depletionAge = nominalData.findIndex(val => parseFloat(val) === 0);

    if (depletionAge !== -1) {
        const age = currentAge + depletionAge;
        banner.textContent = '⚠️ Based on your inputs, your savings may run out around Age ' + age + '.';
        banner.className = 'chart-banner warning';
    } else {
        banner.textContent = '✅ Based on your inputs, your savings are on track to last through Age ' + lifeExpectancy + '.';
        banner.className = 'chart-banner success'
    }

    setuoToggles();
}


function setuoToggles() {
    document.getElementById('toggleProjected').addEventListener('change', function() {
        retirementChart.data.datasets[0].hidden = !this.checked;
        retirementChart.update();
    });

    document.getElementById('togglePurchasing').addEventListener('change', function() {
        retirementChart.data.datasets[1].hidden = !this.checked;
        retirementChart.update();
    });

    document.getElementById('toggleContributions').addEventListener('change', function() {
        retirementChart.data.datasets[2].hidden = !this.checked;
        retirementChart.update();
    });
}

function switchTab(tab) {
    document.getElementById('chartPanel').style.display = 'flex';

    const graphTab = document.getElementById('tab-graph');
    const summaryTab = document.getElementById('tab-summary');
    const buttons = document.querySelectorAll('.tab-btn');

    if (tab === 'graph') {
        graphTab.classList.remove('hidden');
        summaryTab.classList.add('hidden');
        buttons[0].classList.add('active');
        buttons[1].classList.remove('active');
    } else {
        summaryTab.classList.remove('hidden');
        graphTab.classList.add('hidden');
        buttons[1].classList.add('active');
        buttons[0].classList.remove('active');
    }
}