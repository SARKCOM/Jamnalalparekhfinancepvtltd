// Credit Scoring System — Jamnalal Parekh Finance Pvt. Ltd.
// Internal tool for field sales agents. No backend, no dependencies.
// Tune weights, tier points, thresholds, hint text and flag rules in the
// CONFIG / PARAMS / FLAGS blocks below.

// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------

const CONFIG = {
    tierPoints: { low: 50, medium: 30, high: 20 },
    // Best possible score (all 11 parameters = Low risk) = sum(weight) * 50
    // = 100 * 50 = 5000. Thresholds below are expressed in raw points.
    thresholds: {
        approve: 4000, // >= 4000 (80%) -> Approve
        review: 3000,  // 3000-3999 (60-79%) -> Review; below -> Reject
    },
    maxScore: 5000,
    storageKey: 'jpf_credit_assessments',
};

// ---------------------------------------------------------------------------
// PARAMETERS (weights must sum to 100)
// ---------------------------------------------------------------------------

const PARAMS = [
    {
        id: 'guarantor',
        name: 'Relationship with guarantor',
        weight: 3,
        hints: {
            low: 'Parent / spouse / sibling',
            medium: 'Other relative / close friend',
            high: 'Distant / colleague / unknown',
        },
    },
    {
        id: 'cibil',
        name: 'CIBIL score',
        weight: 15,
        hints: {
            low: '750 and above',
            medium: '650 to 749',
            high: 'Below 650 or no credit history',
        },
    },
    {
        id: 'employment',
        name: 'Employment type',
        weight: 15,
        hints: {
            low: 'Govt / PSU / large company salaried',
            medium: 'Small company salaried, established self-employed',
            high: 'Daily wage / informal / new business',
        },
    },
    {
        id: 'income',
        name: 'Monthly income',
        weight: 15,
        hints: {
            low: 'Comfortable (high for local area)',
            medium: 'Moderate',
            high: 'Low / unstable',
        },
    },
    {
        id: 'age',
        name: 'Age',
        weight: 3,
        hints: {
            low: '25 to 45 years',
            medium: '21 to 24 or 46 to 55 years',
            high: 'Below 21 or above 55 years',
        },
    },
    {
        id: 'distance',
        name: 'Distance from branch',
        weight: 10,
        hints: {
            low: 'Within 10 km',
            medium: '10 to 25 km',
            high: 'More than 25 km',
        },
    },
    {
        id: 'dependents',
        name: 'Dependent family members',
        weight: 10,
        hints: {
            low: '0 to 2 dependents',
            medium: '3 to 4 dependents',
            high: '5 or more dependents',
        },
    },
    {
        id: 'loan',
        name: 'Loan disbursement amount',
        weight: 10,
        hints: {
            low: "Small for this customer's profile",
            medium: 'Medium',
            high: "Large for this customer's profile",
        },
    },
    {
        id: 'reference',
        name: 'Reference from existing customer',
        weight: 3,
        hints: {
            low: 'Existing good-standing customer',
            medium: 'Existing average customer',
            high: 'No reference',
        },
    },
    {
        id: 'tenure',
        name: 'EMI tenure',
        weight: 6,
        hints: {
            low: '12 months or less',
            medium: '13 to 24 months',
            high: '25 months or more',
        },
    },
    {
        id: 'interview',
        name: 'Interview / self analysis',
        weight: 10,
        hints: {
            low: 'Confident, consistent story',
            medium: 'Some inconsistencies',
            high: 'Evasive / suspicious',
        },
    },
];

// ---------------------------------------------------------------------------
// FRAUD / RISK FLAGS (combinations of selected tiers)
// ---------------------------------------------------------------------------

const FLAGS = [
    {
        id: 'loanVsIncome',
        label: 'High loan vs low income',
        when: s => s.loan === 'high' && s.income === 'high',
    },
    {
        id: 'farNoReference',
        label: 'Far from branch and no reference',
        when: s => s.distance === 'high' && s.reference === 'high',
    },
    {
        id: 'weakCreditLargeLoan',
        label: 'Weak credit history with large loan',
        when: s => s.cibil === 'high' && s.loan === 'high',
    },
    {
        id: 'longTenureInformal',
        label: 'Long tenure with informal employment',
        when: s => s.tenure === 'high' && s.employment === 'high',
    },
    {
        id: 'lowIncomeManyDependents',
        label: 'Low income with many dependents',
        when: s => s.income === 'high' && s.dependents === 'high',
    },
    {
        id: 'interviewWeakGuarantor',
        label: 'Interview concerns and weak guarantor',
        when: s => s.interview === 'high' && s.guarantor === 'high',
    },
    {
        id: 'riskyAgeLargeLoan',
        label: 'Risky age bracket with large loan',
        when: s => s.age === 'high' && s.loan === 'high',
    },
];

// ---------------------------------------------------------------------------
// STATE
// ---------------------------------------------------------------------------

const state = {}; // { [paramId]: 'low' | 'medium' | 'high' }

// ---------------------------------------------------------------------------
// RENDER
// ---------------------------------------------------------------------------

function renderParams() {
    const container = document.getElementById('params-container');
    container.innerHTML = '';

    PARAMS.forEach((param, index) => {
        const card = document.createElement('div');
        card.className = 'param-card';
        card.dataset.paramId = param.id;

        const header = document.createElement('div');
        header.className = 'param-header';

        const title = document.createElement('div');
        title.className = 'param-title';
        title.textContent = `${index + 1}. ${param.name}`;

        const weight = document.createElement('div');
        weight.className = 'param-weight';
        weight.textContent = `Weight ${param.weight}%`;

        header.appendChild(title);
        header.appendChild(weight);
        card.appendChild(header);

        const tiers = document.createElement('div');
        tiers.className = 'tier-buttons';

        ['low', 'medium', 'high'].forEach(tier => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `tier-btn tier-${tier}`;
            btn.dataset.tier = tier;

            const label = document.createElement('div');
            label.className = 'tier-label';
            label.textContent =
                tier === 'low' ? 'Low risk' :
                tier === 'medium' ? 'Medium risk' : 'High risk';

            const hint = document.createElement('div');
            hint.className = 'tier-hint';
            hint.textContent = param.hints[tier];

            btn.appendChild(label);
            btn.appendChild(hint);
            btn.addEventListener('click', () => selectTier(param.id, tier));
            tiers.appendChild(btn);
        });

        card.appendChild(tiers);
        container.appendChild(card);
    });
}

function selectTier(paramId, tier) {
    state[paramId] = tier;
    const card = document.querySelector(`.param-card[data-param-id="${paramId}"]`);
    card.querySelectorAll('.tier-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.tier === tier);
    });
    updateScore();
}

// ---------------------------------------------------------------------------
// SCORING
// ---------------------------------------------------------------------------

function calculate() {
    let total = 0;
    PARAMS.forEach(param => {
        const tier = state[param.id];
        if (tier) {
            total += param.weight * CONFIG.tierPoints[tier];
        }
    });
    return total;
}

function evaluateFlags() {
    return FLAGS.filter(flag => flag.when(state));
}

function getRecommendation(score, flagCount) {
    let band;
    if (score >= CONFIG.thresholds.approve) band = 'APPROVE';
    else if (score >= CONFIG.thresholds.review) band = 'REVIEW';
    else band = 'REJECT';

    // Any flag downgrades one level
    if (flagCount > 0) {
        if (band === 'APPROVE') band = 'REVIEW';
        else if (band === 'REVIEW') band = 'REJECT';
    }
    return band;
}

function updateScore() {
    const completed = PARAMS.every(p => state[p.id]);
    const score = calculate();
    const pct = Math.round((score / CONFIG.maxScore) * 100);
    const flags = evaluateFlags();
    const recommendation = completed ? getRecommendation(score, flags.length) : null;

    document.getElementById('score-value').textContent = score;
    document.getElementById('score-max').textContent = CONFIG.maxScore;
    document.getElementById('score-percent').textContent = `${pct}%`;

    const recEl = document.getElementById('recommendation');
    if (completed) {
        recEl.textContent = recommendation;
        recEl.className = `rec-badge rec-${recommendation.toLowerCase()}`;
    } else {
        const answered = PARAMS.filter(p => state[p.id]).length;
        recEl.textContent = `${answered} / ${PARAMS.length} answered`;
        recEl.className = 'rec-badge rec-pending';
    }

    const flagsEl = document.getElementById('flags-list');
    flagsEl.innerHTML = '';
    if (flags.length === 0) {
        flagsEl.innerHTML = '<div class="no-flags">No risk flags</div>';
    } else {
        flags.forEach(flag => {
            const div = document.createElement('div');
            div.className = 'flag-item';
            div.textContent = `! ${flag.label}`;
            flagsEl.appendChild(div);
        });
    }
}

// ---------------------------------------------------------------------------
// SAVE / EXPORT / RESET
// ---------------------------------------------------------------------------

function getApplicantDetails() {
    return {
        name: document.getElementById('applicant-name').value.trim(),
        mobile: document.getElementById('applicant-mobile').value.trim(),
        applicationId: document.getElementById('application-id').value.trim(),
        date: document.getElementById('application-date').value ||
              new Date().toISOString().slice(0, 10),
    };
}

function saveAndPrint() {
    const completed = PARAMS.every(p => state[p.id]);
    if (!completed) {
        alert('Please select a risk tier for every parameter before saving.');
        return;
    }
    const applicant = getApplicantDetails();
    if (!applicant.name) {
        alert('Please enter the applicant name before saving.');
        return;
    }

    const score = calculate();
    const flags = evaluateFlags();
    const recommendation = getRecommendation(score, flags.length);

    const record = {
        savedAt: new Date().toISOString(),
        ...applicant,
        tiers: { ...state },
        totalScore: score,
        maxScore: CONFIG.maxScore,
        percent: Math.round((score / CONFIG.maxScore) * 100),
        recommendation,
        flags: flags.map(f => f.label),
    };

    const existing = JSON.parse(localStorage.getItem(CONFIG.storageKey) || '[]');
    existing.push(record);
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(existing));

    window.print();
}

function exportCSV() {
    const records = JSON.parse(localStorage.getItem(CONFIG.storageKey) || '[]');
    if (records.length === 0) {
        alert('No saved assessments to export yet.');
        return;
    }

    const header = [
        'Saved At', 'Date', 'Applicant Name', 'Mobile', 'Application ID',
        ...PARAMS.map(p => p.name),
        'Total Score', 'Max Score', 'Percent', 'Recommendation', 'Flags',
    ];

    const rows = records.map(r => [
        r.savedAt,
        r.date,
        r.name,
        r.mobile,
        r.applicationId,
        ...PARAMS.map(p => r.tiers[p.id] || ''),
        r.totalScore,
        r.maxScore,
        r.percent,
        r.recommendation,
        (r.flags || []).join('; '),
    ]);

    const escape = v => {
        const s = String(v == null ? '' : v);
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
            return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
    };

    // UTF-8 BOM so Excel opens ₹ and other unicode cleanly
    const csv = '\ufeff' +
        [header, ...rows].map(row => row.map(escape).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jpf_credit_assessments_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function resetForm() {
    if (!confirm('Clear the current form? Saved assessments will not be deleted.')) {
        return;
    }
    Object.keys(state).forEach(k => delete state[k]);
    document.getElementById('applicant-name').value = '';
    document.getElementById('applicant-mobile').value = '';
    document.getElementById('application-id').value = '';
    document.getElementById('application-date').value = '';
    document.querySelectorAll('.tier-btn.selected').forEach(btn => {
        btn.classList.remove('selected');
    });
    updateScore();
}

// ---------------------------------------------------------------------------
// INIT
// ---------------------------------------------------------------------------

function init() {
    // Sanity check: weights should sum to 100
    const totalWeight = PARAMS.reduce((sum, p) => sum + p.weight, 0);
    if (totalWeight !== 100) {
        console.warn(`PARAMS weights sum to ${totalWeight}, expected 100.`);
    }

    // Default date to today
    document.getElementById('application-date').value =
        new Date().toISOString().slice(0, 10);

    renderParams();
    updateScore();

    document.getElementById('btn-save').addEventListener('click', saveAndPrint);
    document.getElementById('btn-export').addEventListener('click', exportCSV);
    document.getElementById('btn-reset').addEventListener('click', resetForm);
}

document.addEventListener('DOMContentLoaded', init);
