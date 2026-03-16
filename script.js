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

// What If Toggle
function toggleWhatIf() {
    const fields = document.getElementById('whatifFields');
    const arrow = document.getElementById('whatifArrow');
    fields.classList.toggle('open');
    arrow.classList.toggle('open');
}

// Read What If Inputs (blank = inherit from main)
function getWhatIfInputs() {
    const wi_retirementAge      = document.getElementById('wi_retirementAge').value;
    const wi_monthlyContribution= document.getElementById('wi_monthlyContribution').value;
    const wi_preReturnRate      = document.getElementById('wi_preReturnRate').value;
    const wi_currentSavings     = document.getElementById('wi_currentSavings').value;
    const wi_retirementBudget   = document.getElementById('wi_retirementBudget').value;

    // Return null if ALL fields are empty (no What If scenario)
    const anyFilled = [wi_retirementAge, wi_monthlyContribution, wi_preReturnRate,
                       wi_currentSavings, wi_retirementBudget].some(v => v !== '');
    if (!anyFilled) return null;

    // Fall back to main form values for any blank field
    return {
        retirementAge:       wi_retirementAge       !== '' ? parseFloat(wi_retirementAge)        : parseFloat(document.getElementById('retirementAge').value),
        monthlyContribution: wi_monthlyContribution !== '' ? parseFloat(wi_monthlyContribution)  : parseFloat(document.getElementById('monthlyContribution').value),
        preReturnRate:       wi_preReturnRate        !== '' ? parseFloat(wi_preReturnRate) / 100  : parseFloat(document.getElementById('preReturnRate').value) / 100,
        currentSavings:      wi_currentSavings       !== '' ? parseFloat(wi_currentSavings)       : parseFloat(document.getElementById('currentSavings').value),
        retirementBudget:    wi_retirementBudget     !== '' ? parseFloat(wi_retirementBudget) / 100 : parseFloat(document.getElementById('retirementBudget').value) / 100,
    };
}

// Run a single scenario, returns all result values
function runScenario(params) {
    const {
        currentAge, retirementAge, lifeExpectancy,
        currentSavings, monthlyContribution,
        preReturnRate, postReturnRate,
        inflationRate, retirementBudget,
        currentIncome, otherIncome
    } = params;

    const yearsToRetirement   = retirementAge - currentAge;
    const monthsToRetirement  = yearsToRetirement * 12;
    const monthlyPreRate      = preReturnRate / 12;
    const monthlyPostRate     = postReturnRate / 12;

    const fvSavings = currentSavings * Math.pow(1 + monthlyPreRate, monthsToRetirement);
    const fvContributions = monthlyPreRate === 0
        ? monthlyContribution * monthsToRetirement
        : monthlyContribution * ((Math.pow(1 + monthlyPreRate, monthsToRetirement) - 1) / monthlyPreRate);

    const nominalSavingsAtRetirement = fvSavings + fvContributions;
    const inflationAdjustedSavings   = nominalSavingsAtRetirement / Math.pow(1 + inflationRate, yearsToRetirement);

    const yearsInRetirement   = lifeExpectancy - retirementAge;
    const monthsInRetirement  = yearsInRetirement * 12;

    const monthlySpendingNeed  = ((currentIncome / 12) * retirementBudget) - otherIncome;
    const inflatedMonthlyNeed  = monthlySpendingNeed * Math.pow(1 + inflationRate, yearsToRetirement);

    const sustainableMonthlyWithdrawal = monthlyPostRate === 0
        ? nominalSavingsAtRetirement / monthsInRetirement
        : (nominalSavingsAtRetirement * monthlyPostRate) / (1 - Math.pow(1 + monthlyPostRate, -monthsInRetirement));

    const monthlySurplusDeficit = sustainableMonthlyWithdrawal - inflatedMonthlyNeed;
    const totalContributions    = currentSavings + (monthlyContribution * monthsToRetirement);
    const interestEarned        = nominalSavingsAtRetirement - totalContributions;

    return {
        yearsToRetirement, totalContributions, interestEarned,
        nominalSavingsAtRetirement, inflationAdjustedSavings,
        sustainableMonthlyWithdrawal, inflatedMonthlyNeed,
        monthlySurplusDeficit, monthlyPreRate, monthlyPostRate,
        inflatedMonthlyNeed
    };
}


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
    const preReturnRate = parseFloat(document.getElementById('preReturnRate').value) / 100;
    const postReturnRate = parseFloat(document.getElementById('postReturnRate').value) / 100;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) / 100;
    const retirementBudget = parseFloat(document.getElementById('retirementBudget').value) / 100;
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

    // Run main scenario
    const main = runScenario({
        currentAge, retirementAge, lifeExpectancy,
        currentSavings, monthlyContribution,
        preReturnRate, postReturnRate,
        inflationRate, retirementBudget,
        currentIncome, otherIncome
    });

    // Display results
    const fmt = (n) => '$' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    document.getElementById('yearsResult').textContent             = main.yearsToRetirement + ' years';
    document.getElementById('contributionsResult').textContent     = fmt(main.totalContributions);
    document.getElementById('interestResult').textContent          = fmt(main.interestEarned);
    document.getElementById('totalResult').textContent             = fmt(main.nominalSavingsAtRetirement);
    document.getElementById('inflationAdjustedResult').textContent = fmt(main.inflationAdjustedSavings);
    document.getElementById('monthlyWithdrawalResult').textContent = fmt(main.sustainableMonthlyWithdrawal);
    document.getElementById('monthlyNeedResult').textContent       = fmt(main.inflatedMonthlyNeed);
    document.getElementById('surplusDeficitResult').textContent    = (main.monthlySurplusDeficit >= 0 ? '+' : '') + fmt(main.monthlySurplusDeficit);
    document.getElementById('sufficiencyResult').textContent       = main.monthlySurplusDeficit >= 0 ? 'On Track' : 'Shortfall';

    // Run What If Fileds Filled
    // Render Chart
    // ── Run What If if fields filled ─────────────────
    const wi = getWhatIfInputs();

    if (wi) {
        const wiScenario = runScenario({
            currentAge,
            retirementAge:       wi.retirementAge,
            lifeExpectancy,
            currentSavings:      wi.currentSavings,
            monthlyContribution: wi.monthlyContribution,
            preReturnRate:       wi.preReturnRate,
            postReturnRate,
            inflationRate,
            retirementBudget:    wi.retirementBudget,
            currentIncome,
            otherIncome
        });

        function showDiff(diffId, wiId, mainVal, wiVal, isYears = false) {
            const diff  = wiVal - mainVal;
            const wiEl  = document.getElementById(wiId);
            const diffEl= document.getElementById(diffId);
            wiEl.textContent = isYears ? wiVal + ' years' : fmt(wiVal);
            wiEl.classList.remove('hidden');
            diffEl.textContent = (diff >= 0 ? '+' : '') + (isYears ? diff + ' yrs' : fmt(diff));
            diffEl.className   = 'result-diff ' + (diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral');
            diffEl.classList.remove('hidden');
        }

        showDiff('diff_yearsResult',             'wi_yearsResult',             main.yearsToRetirement,          wiScenario.yearsToRetirement,          true);
        showDiff('diff_contributionsResult',     'wi_contributionsResult',     main.totalContributions,         wiScenario.totalContributions);
        showDiff('diff_interestResult',          'wi_interestResult',          main.interestEarned,             wiScenario.interestEarned);
        showDiff('diff_totalResult',             'wi_totalResult',             main.nominalSavingsAtRetirement, wiScenario.nominalSavingsAtRetirement);
        showDiff('diff_inflationAdjustedResult', 'wi_inflationAdjustedResult', main.inflationAdjustedSavings,   wiScenario.inflationAdjustedSavings);
        showDiff('diff_monthlyWithdrawalResult', 'wi_monthlyWithdrawalResult', main.sustainableMonthlyWithdrawal, wiScenario.sustainableMonthlyWithdrawal);
        showDiff('diff_monthlyNeedResult',       'wi_monthlyNeedResult',       main.inflatedMonthlyNeed,        wiScenario.inflatedMonthlyNeed);
        showDiff('diff_surplusDeficitResult',    'wi_surplusDeficitResult',    main.monthlySurplusDeficit,      wiScenario.monthlySurplusDeficit);

        const wiSuffEl = document.getElementById('wi_sufficiencyResult');
        wiSuffEl.textContent = wiScenario.monthlySurplusDeficit >= 0 ? 'On Track' : 'Shortfall';
        wiSuffEl.classList.remove('hidden');
        document.getElementById('diff_sufficiencyResult').classList.add('hidden');

        renderChart(
            currentAge, retirementAge, lifeExpectancy,
            currentSavings, monthlyContribution,
            main.monthlyPreRate, main.monthlyPostRate,
            main.inflatedMonthlyNeed, inflationRate,
            {
                retirementAge:       wi.retirementAge,
                currentSavings:      wi.currentSavings,
                monthlyContribution: wi.monthlyContribution,
                monthlyPreRate:      wi.preReturnRate / 12,
                inflatedMonthlyNeed: wiScenario.inflatedMonthlyNeed
            }
        );

    } else {
        document.querySelectorAll('.result-whatif, .result-diff').forEach(el => el.classList.add('hidden'));
        renderChart(
            currentAge, retirementAge, lifeExpectancy,
            currentSavings, monthlyContribution,
            main.monthlyPreRate, main.monthlyPostRate,
            main.inflatedMonthlyNeed, inflationRate,
            null
        );
    }

    switchTab('graph');
}

function clearForm() {
    loadDefaults();
    calculate();
}

function renderChart(currentAge, retirementAge, lifeExpectancy, currentSavings, monthlyContribution, monthlyPreRate, monthlyPostRate, inflatedMonthlyNeed, inflationRate, wiParams = null) {
    const labels = [];
    const nominalData = [];
    const inflationAdjustedData = [];
    const contributionsData = [];

    let postBalance = null;

    const wiNominalData = [], wiAdjustedData = [], wiContributionsData = [];

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

    // Build What If chart data
    if (wiParams) {
        const { retirementAge: wiRetAge, currentSavings: wiSavings,
                monthlyContribution: wiContrib, monthlyPreRate: wiPreRate,
                inflatedMonthlyNeed: wiMonthlyNeed } = wiParams;
        let wiPostBalance = null;

        for (let age = currentAge; age <= lifeExpectancy; age++) {
            const yearsElapsed  = age - currentAge;
            const monthsElapsed = yearsElapsed * 12;

            if (age <= wiRetAge) {
                wiContributionsData.push((wiSavings + (wiContrib * monthsElapsed)).toFixed(2));
                const fvS = wiSavings * Math.pow(1 + wiPreRate, monthsElapsed);
                const fvC = wiPreRate === 0
                    ? wiContrib * monthsElapsed
                    : wiContrib * ((Math.pow(1 + wiPreRate, monthsElapsed) - 1) / wiPreRate);
                const nominal  = fvS + fvC;
                const adjusted = nominal / Math.pow(1 + inflationRate, yearsElapsed);
                wiNominalData.push(nominal.toFixed(2));
                wiAdjustedData.push(adjusted.toFixed(2));
                if (age === wiRetAge) wiPostBalance = nominal;
            } else {
                wiContributionsData.push(null);

                if (wiPostBalance === null) wiPostBalance = 0;
                for (let m = 0; m < 12; m++) {
                    if (wiPostBalance > 0) {
                        wiPostBalance = wiPostBalance * (1 + monthlyPostRate) - wiMonthlyNeed;
                        if (wiPostBalance < 0) wiPostBalance = 0;
                    }
                }
                wiNominalData.push(wiPostBalance.toFixed(2));
                wiAdjustedData.push(null);
            }
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
                },

                ...(wiParams ? [
                {
                    label: 'What If: Projected',
                    data: wiNominalData,
                    borderColor: '#4ecca3',
                    backgroundColor: 'transparent',
                    borderWidth: 2, borderDash: [6, 4],
                    fill: false, tension: 0.4, pointRadius: 0
                },
                {
                    label: 'What If: Purch. Power',
                    data: wiAdjustedData,
                    borderColor: '#e94560',
                    backgroundColor: 'transparent',
                    borderWidth: 2, borderDash: [6, 4],
                    fill: false, tension: 0.4, pointRadius: 0
                },
                {
                    label: 'What If: Contributions',
                    data: wiContributionsData,
                    borderColor: '#f5a623',
                    backgroundColor: 'transparent',
                    borderWidth: 2, borderDash: [6, 4],
                    fill: false, tension: 0.4, pointRadius: 0
                }
            ] : [])
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
                        color: isDarkMode() ? '#e0e0e0' : '#1a1a2e',
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

    ['toggleWIProjectedLabel','toggleWIPurchasingLabel','toggleWIContributionsLabel'].forEach(id => {
        document.getElementById(id).classList.toggle('hidden', !wiParams);
    });
    setupToggles(!!wiParams);
}


function setupToggles(hasWhatIf = false) {
    document.getElementById('toggleProjected').onchange = function() {
        retirementChart.data.datasets[0].hidden = !this.checked;
        retirementChart.update();
    };

    document.getElementById('togglePurchasing').onchange = function() {
        retirementChart.data.datasets[1].hidden = !this.checked;
        retirementChart.update();
    };

    document.getElementById('toggleContributions').onchange = function() {
        retirementChart.data.datasets[2].hidden = !this.checked;
        retirementChart.update();
    };

    if (hasWhatIf) {
        document.getElementById('toggleWIProjected').onchange = function() {
            retirementChart.data.datasets[3].hidden = !this.checked;
            retirementChart.update();
        };
        document.getElementById('toggleWIPurchasing').onchange = function() {
            retirementChart.data.datasets[4].hidden = !this.checked;
            retirementChart.update();
        };
        document.getElementById('toggleWIContributions').onchange = function() {
            retirementChart.data.datasets[5].hidden = !this.checked;
            retirementChart.update();
        };
    }
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

