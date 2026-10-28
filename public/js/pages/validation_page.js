import { MRZValidator } from '../modules/mrz_validation.js';

export function initValidationPage() {
    const form = document.getElementById('validation-form');
    const resultsContainer = document.getElementById('results-container');
    const loadSampleBtn = document.getElementById('load-sample-btn');

    // DOM Inputs
    const inputs = {
        docNum: document.getElementById('doc-number'),
        docCheck: document.getElementById('doc-check'),
        dob: document.getElementById('dob-mrz'),
        dobCheck: document.getElementById('dob-check'),
        exp: document.getElementById('exp-mrz'),
        expCheck: document.getElementById('exp-check')
    };

    // Load Sample Valid Data
    loadSampleBtn.addEventListener('click', () => {
        inputs.docNum.value = 'L898902C3';
        inputs.docCheck.value = '6';
        inputs.dob.value = '690806';
        inputs.dobCheck.value = '1';
        
        // Calculate a valid future date dynamically for the sample
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 5);
        const yy = String(futureDate.getFullYear()).slice(-2);
        const mm = String(futureDate.getMonth() + 1).padStart(2, '0');
        const dd = String(futureDate.getDate()).padStart(2, '0');
        const sampleExp = `${yy}${mm}${dd}`;
        
        inputs.exp.value = sampleExp;
        inputs.expCheck.value = MRZValidator.calculateCheckDigit(sampleExp);
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Clear previous results
        resultsContainer.innerHTML = '';
        
        // Build Data Array
        const checks = [
            { label: 'Document Number Checksum', str: inputs.docNum.value, check: inputs.docCheck.value },
            { label: 'Date of Birth Checksum', str: inputs.dob.value, check: inputs.dobCheck.value },
            { label: 'Expiration Date Checksum', str: inputs.exp.value, check: inputs.expCheck.value }
        ];

        let failedChecks = 0;

        // Process Checksums
        checks.forEach(item => {
            if (!item.str || !item.check) return; // Skip empty
            
            const isValid = MRZValidator.isValid(item.str, item.check);
            const calcDigit = MRZValidator.calculateCheckDigit(item.str);
            if (!isValid) failedChecks++;

            renderResultRow(item.label, isValid, `Expected: ${item.check} | Computed: ${calcDigit}`);
        });

        // Process Expiration
        if (inputs.exp.value) {
            const isExpired = MRZValidator.isExpired(inputs.exp.value);
            if (isExpired) failedChecks++;
            renderResultRow('Document Expiry Status', !isExpired, isExpired ? 'Document is EXPIRED' : 'Document is VALID');
        }

        // Render Final Verdict
        renderVerdict(failedChecks);
        if (window.lucide) window.lucide.createIcons();
    });

    function renderResultRow(label, passed, detailText) {
        const icon = passed ? 'check-circle-2' : 'x-circle';
        const colorClass = passed ? 'text-brand-primary bg-brand-primary/10 border-brand-primary/20' : 'text-brand-danger bg-brand-danger/10 border-brand-danger/20';

        const row = document.createElement('div');
        row.className = `validation-result ${colorClass} reveal-data`;
        const iconElement = document.createElement('i');
        iconElement.dataset.lucide = icon;
        iconElement.setAttribute('aria-hidden', 'true');
        const content = document.createElement('div');
        content.className = 'validation-result-copy';
        const title = document.createElement('p');
        title.textContent = label;
        const detail = document.createElement('p');
        detail.textContent = detailText;
        content.append(title, detail);
        const status = document.createElement('span');
        status.className = 'validation-result-status';
        status.textContent = passed ? 'Pass' : 'Fail';
        row.append(iconElement, content, status);
        resultsContainer.appendChild(row);
    }

    function renderVerdict(failedCount) {
        const passed = failedCount === 0;
        const color = passed ? 'text-brand-primary' : 'text-brand-danger';
        const message = passed ? 'ALL CHECKS PASSED. MRZ IS AUTHENTIC.' : 'FRAUD DETECTED: CHECKSUM OR DATE VALIDATION FAILED.';
        
        const verdict = document.createElement('div');
        verdict.className = `validation-verdict ${color} reveal-data`;
        const heading = document.createElement('p');
        heading.textContent = 'Final verdict';
        const summary = document.createElement('p');
        summary.textContent = message;
        verdict.append(heading, summary);
        resultsContainer.appendChild(verdict);
    }
}