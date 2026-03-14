let retirementChart = null;

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
    document.getElementById('results').style.display = 'block';

    // Render Chart
    renderChart(currentAge, retirementAge, currentSavings, monthlyContribution, monthlyPreRate, inflationRate);
}

function clearForm() {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => input.value = '');
    document.getElementById('results').style.display =  'none';
    document.querySelector('chartPanel').style.display = 'none';
}

function renderChart(currentAge, retirementAge, currentSavings, monthlyContribution, monthlyPreRate, inflationRate) {
    const labels = [];
    const nominalData = [];
    const inflationAdjustedData = [];
    const contributionsData = [];

    let balance = currentSavings;

    for (let age = currentAge; age <= retirementAge; age++) {
        const yearsElapsed = age - currentAge;
        const monthsElapsed = yearsElapsed * 12;

        // nominal balance
        const fvSavings = currentSavings * Math.pow(1 + monthlyPreRate, monthsElapsed);
        const fvContributions = monthlyPreRate === 0
            ? monthlyContribution * monthsElapsed
            : monthlyContribution * ((Math.pow(1 + monthlyPreRate, monthsElapsed) - 1) / monthlyPreRate);

        const nominal = fvSavings + fvContributions;
        const adjusted = nominal / Math.pow(1 + inflationRate, yearsElapsed);
        const contributions = currentSavings + (monthlyContribution * monthsElapsed);

        labels.push('Age: ' + age);
        nominalData.push(nominal.toFixed(2));
        inflationAdjustedData.push(adjusted.toFixed(2));
        contributionsData.push(contributions.toFixed(2));
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
                    labels: { color: '#eee'}
                },
                tooltip: {
                    callbacks: {
                        label: (context) => ' s' + Number(context.raw).toLocaleString()
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#aaa' },
                    grid: { color: '#1a1a2e' }
                },
                y: {
                    ticks: {
                        color: '#aaa',
                        callback: (value) => '$' + Number(value).toLocaleString()
                    },
                    grid: { color: '#1a1a2e' }
                }
            }
        }
    
    });

    document.getElementById('chartPanel').style.display = 'flex';
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